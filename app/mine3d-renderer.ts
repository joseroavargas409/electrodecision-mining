import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type SceneItem = {
  id: string;
  label: string;
  kind: "charger" | "battery" | "packs" | "substation" | "trolley" | "mill"|"crusher"|"conveyor"|"fan"|"pump"|"compressor"|"workshop"|"office"|"lighting"|"drill"|"flotation"|"water";
  position: [number, number, number];
  proposed?: boolean;
};

export type SceneVehicle = {
  id: string;
  label: string;
  /** Battery percentage, from 0 to 100; null means unavailable. */
  soc: number | null;
  state: "charging" | "working" | "idle" | "unknown";
};

type CameraView = "overview" | "top" | "ramp";
type SceneHandle = {
  select(id: string): void;
  updateVehicles(vehicles: SceneVehicle[]): void;
  camera(view: CameraView): void;
  rotate(direction: number): void;
  zoom(direction: number): void;
  setSimulationMinute(minute: number): void;
  updateLoads(values: Record<string,{kw:number;ratio:number}>): void;
  dispose(): void;
};

const COLORS = {
  background: "#dce8ec",
  soil: "#ae8d69",
  soilLight: "#c4a883",
  soilDark: "#8b745d",
  road: "#6c7977",
  stripe: "#ede5cf",
  teal: "#137c78",
  tealLight: "#5ba9a0",
  yellow: "#e9b45b",
  dark: "#334b4a",
  ivory: "#f8f3e9",
  proposed: "#99a8a3",
};

/** Illustrative geometry only. The caller owns all operational calculations. */
export function mountMineScene(
  host: HTMLElement,
  items: SceneItem[],
  vehicles: SceneVehicle[],
  onSelect: (id: string) => void,
): SceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);
  scene.fog = new THREE.Fog(COLORS.background, 185, 360);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 600);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const sharedMaterials = new Map<string, THREE.MeshStandardMaterial>();
  const itemGroups = new Map<string, THREE.Group>();
  const selectable: THREE.Object3D[] = [];
  const vehicleLayer = new THREE.Group();
  const movingParts: {object:THREE.Object3D;owner:THREE.Group;kind:string;offset:number}[]=[];
  let vehicleSignature="", simulationMinute=0;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let frame: number | null = null;
  let disposed = false;
  let selectedItem = "mill";
  let pointerDown: { x: number; y: number } | null = null;
  let selection: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | null = null;

  function geometry<T extends THREE.BufferGeometry>(value: T): T {
    geometries.add(value);
    return value;
  }

  function material(color: string): THREE.MeshStandardMaterial {
    const existing = sharedMaterials.get(color);
    if (existing) return existing;
    const result = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.08 });
    sharedMaterials.set(color, result);
    materials.add(result);
    return result;
  }

  function box(
    group: THREE.Object3D,
    size: [number, number, number],
    position: [number, number, number],
    color: string,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry(new THREE.BoxGeometry(...size)), material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function cylinder(
    group: THREE.Object3D,
    radius: number,
    height: number,
    position: [number, number, number],
    color: string,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry(new THREE.CylinderGeometry(radius, radius, height, 12)), material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function label(group: THREE.Object3D, text: string, y: number, proposed = false): void {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 144;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "rgba(248, 245, 237, 0.96)";
    ctx.beginPath();
    ctx.roundRect(6, 6, 628, 132, 24);
    ctx.fill();
    ctx.strokeStyle = proposed ? "#97a6a1" : "#137c78";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = "#213e3d";
    ctx.font = "600 39px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const content = text.length > 34 ? `${text.slice(0, 31)}…` : text;
    ctx.fillText(content, 320, proposed ? 56 : 73, 590);
    if (proposed) {
      ctx.fillStyle = "#60756f";
      ctx.font = "500 27px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("PROPUESTO", 320, 106, 590);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true });
    materials.add(spriteMaterial);
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.y = y;
    sprite.scale.set(17.5, 3.94, 1);
    sprite.renderOrder = 20;
    group.add(sprite);
  }

  function line(group: THREE.Object3D, points: THREE.Vector3[], color: string): void {
    const lineMaterial = new THREE.LineBasicMaterial({ color });
    materials.add(lineMaterial);
    group.add(new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints(points)), lineMaterial));
  }

  function road(points: THREE.Vector3[], width: number, color = COLORS.road): void {
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const samples = curve.getPoints(72);
    const vertices: number[] = [];
    const indices: number[] = [];
    samples.forEach((point, index) => {
      const before = samples[Math.max(0, index - 1)];
      const after = samples[Math.min(samples.length - 1, index + 1)];
      const tangent = after.clone().sub(before).setY(0).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
      const left = point.clone().add(normal);
      const right = point.clone().sub(normal);
      vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
      if (index < samples.length - 1) {
        const a = index * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const surface = geometry(new THREE.BufferGeometry());
    surface.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    surface.setIndex(indices);
    surface.computeVertexNormals();
    const mesh = new THREE.Mesh(surface, material(color));
    mesh.receiveShadow = true;
    scene.add(mesh);
    for (let index = 2; index < samples.length - 2; index += 6) {
      line(scene, [samples[index].clone().add(new THREE.Vector3(0, 0.07, 0)), samples[index + 2].clone().add(new THREE.Vector3(0, 0.07, 0))], COLORS.stripe);
    }
  }

  function rampPoint(t: number, offset = 0): THREE.Vector3 {
    return new THREE.Vector3(-20 + 55 * t, 14 * t + offset, -16 - 9 * t);
  }

  function createTerrain(): void {
    box(scene, [166, 2, 116], [0, -1.2, -5], COLORS.soilLight);
    box(scene, [150, 3, 22], [0, 0.4, -48], COLORS.soil);
    box(scene, [124, 5, 16], [8, 2.6, -52], COLORS.soilLight);
    box(scene, [100, 7, 12], [16, 5.5, -55], COLORS.soil);
    box(scene, [74, 9, 8], [25, 9.3, -58], COLORS.soilDark);
    box(scene, [26, 14.2, 22], [46, 6.8, -25], COLORS.soil);

    // A solid embankment under the sloping road, rather than a floating ribbon.
    const start = rampPoint(0, -0.15);
    const end = rampPoint(1, -0.15);
    const side = new THREE.Vector3(9, 0, 55).normalize().multiplyScalar(9.5);
    const a = start.clone().add(side);
    const b = start.clone().sub(side);
    const c = end.clone().add(side);
    const d = end.clone().sub(side);
    const slope = geometry(new THREE.BufferGeometry());
    slope.setAttribute("position", new THREE.Float32BufferAttribute([
      a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z,
      a.x, -0.3, a.z, b.x, -0.3, b.z, c.x, -0.3, c.z, d.x, -0.3, d.z,
    ], 3));
    slope.setIndex([0, 2, 1, 1, 2, 3, 0, 4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5, 2, 6, 3, 3, 6, 7, 0, 1, 4, 1, 5, 4]);
    slope.computeVertexNormals();
    const embankment = new THREE.Mesh(slope, material(COLORS.soilDark));
    embankment.receiveShadow = true;
    scene.add(embankment);
    road([new THREE.Vector3(-65, 0.02, 38), new THREE.Vector3(-65, 0.02, -6), new THREE.Vector3(-32, 0.02, -23), rampPoint(0, 0.1)], 8);
    road([rampPoint(0, 0.1), rampPoint(1, 0.1), new THREE.Vector3(54, 14.1, -25)], 8);
    road([new THREE.Vector3(-65, 0.04, 42), new THREE.Vector3(-30, 0.04, 44), new THREE.Vector3(20, 0.04, 45), new THREE.Vector3(72, 0.04, 45)], 7);

    // Flat pads keep proposed stations legible on the mine floor.
    box(scene, [38, 0.18, 25], [-36, -0.01, 20], "#ddd7c6");
    box(scene, [28, 0.18, 14], [-21, -0.01, -7], "#ddd7c6");
    for (const x of [-48, -39, -30]) {
      line(scene, [new THREE.Vector3(x, 0.12, 13), new THREE.Vector3(x, 0.12, 29)], "#f8f3e9");
    }

    if(items.some(item=>item.kind==="mill")){
      const hills=geometry(new THREE.PlaneGeometry(180,36,80,20));hills.rotateX(-Math.PI/2);const pos=hills.getAttribute("position");for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,9+Math.sin(x*.08)*3+Math.sin(x*.19+z*.15)*2+Math.abs(z)*.45);}hills.computeVertexNormals();const hill=new THREE.Mesh(hills,material("#9e876b"));hill.position.set(0,2,-82);hill.receiveShadow=true;hill.castShadow=true;scene.add(hill);
      const skirtVertices:number[]=[];const edgePairs:[number,number][]=[];
      for(let x=0;x<80;x++)edgePairs.push([x,x+1],[20*81+x,20*81+x+1]);
      for(let z=0;z<20;z++)edgePairs.push([z*81,(z+1)*81],[z*81+80,(z+1)*81+80]);
      for(const [a,b] of edgePairs){const ax=pos.getX(a),ay=pos.getY(a),az=pos.getZ(a),bx=pos.getX(b),by=pos.getY(b),bz=pos.getZ(b);skirtVertices.push(ax,ay,az,bx,by,bz,ax,-3,az,bx,by,bz,bx,-3,bz,ax,-3,az)}
      const skirt=geometry(new THREE.BufferGeometry());skirt.setAttribute("position",new THREE.Float32BufferAttribute(skirtVertices,3));skirt.computeVertexNormals();
      const skirtMaterial=new THREE.MeshStandardMaterial({color:"#8e795f",side:THREE.DoubleSide,roughness:1});materials.add(skirtMaterial);
      const mountainSide=new THREE.Mesh(skirt,skirtMaterial);mountainSide.position.copy(hill.position);mountainSide.receiveShadow=true;scene.add(mountainSide);
      const portal=new THREE.Group();portal.position.set(-54,0,-17);box(portal,[9,7,3],[0,3.5,0],"#7a817b");box(portal,[6,5.7,.15],[0,2.9,1.6],"#172b2c");box(portal,[7,.3,.4],[0,6,2],"#cba34d");label(portal,"ACCESO MINA SUBTERRÁNEA",9);scene.add(portal);
      for(const point of [[-64,0],[-20,38],[10,42],[54,40]]){cylinder(scene,.12,7,[point[0],3.5,point[1]],"#6f807b");box(scene,[1.4,.2,.7],[point[0],7,point[1]],"#fff0ad");}
      for(const item of items.filter(i=>processKinds.has(i.kind)&&i.position[1]===0))line(scene,[new THREE.Vector3(-55,.2,8),new THREE.Vector3(item.position[0],.2,8),new THREE.Vector3(item.position[0],.2,item.position[2])],"#558e85");
    }

    const siteTitle = new THREE.Group();
    siteTitle.position.set(43, 0, 25);
    label(siteTitle, "MINA FICTICIA", 3.8);
    scene.add(siteTitle);
    for (const [x, z] of [[-68, -25], [-67, 34], [60, 32], [66, -8]]) {
      const rock = new THREE.Mesh(geometry(new THREE.DodecahedronGeometry(3.7, 0)), material(COLORS.soilDark));
      rock.position.set(x, 1.1, z);
      rock.scale.set(1.3, 0.55, 0.9);
      rock.castShadow = true;
      scene.add(rock);
    }
  }

  function createCharger(group: THREE.Group, color: string): void {
    box(group, [6, 0.28, 5], [0, 0.2, 0], "#e6e2d5");
    box(group, [2, 3.8, 1.5], [0, 2.1, 0], color);
    box(group, [1.35, 1, 0.09], [0, 2.6, 0.8], COLORS.dark);
    box(group, [0.5, 0.2, 0.12], [0, 1.6, 0.83], COLORS.yellow);
    const cable = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 3.3, 0.5), new THREE.Vector3(2.1, 2.4, 0.5), new THREE.Vector3(1.8, 0.65, 1.3), new THREE.Vector3(0.9, 1.2, 1.2),
    ]);
    group.add(new THREE.Mesh(geometry(new THREE.TubeGeometry(cable, 20, 0.12, 6, false)), material(COLORS.dark)));
    for (const x of [-2.3, 2.3]) cylinder(group, 0.16, 1.1, [x, 0.72, 1.9], COLORS.yellow);
  }

  function createBattery(group: THREE.Group, color: string): void {
    box(group, [9.5, 3.6, 4.5], [0, 2, 0], color);
    box(group, [10, 0.35, 5], [0, 0.2, 0], COLORS.dark);
    box(group, [10, 0.22, 5], [0, 3.93, 0], COLORS.ivory);
    for (let x = -4; x <= 4; x += 0.8) box(group, [0.08, 2.9, 0.08], [x, 2, 2.3], COLORS.tealLight);
    box(group, [1.5, 1.8, 0.1], [3.4, 2, 2.34], COLORS.dark);
    for (let y = 1.4; y < 2.7; y += 0.25) box(group, [1.2, 0.08, 0.12], [3.4, y, 2.42], "#849e96");
  }

  function createPacks(group: THREE.Group, color: string): void {
    box(group, [7.5, 0.3, 4.3], [0, 0.2, 0], COLORS.dark);
    for (const x of [-3.3, 3.3]) for (const z of [-1.7, 1.7]) box(group, [0.25, 3.7, 0.25], [x, 2, z], COLORS.dark);
    for (const y of [0.55, 2.2]) {
      box(group, [7.4, 0.2, 4], [0, y, 0], COLORS.dark);
      for (const x of [-1.8, 1.8]) {
        box(group, [2.8, 1.15, 3.2], [x, y + 0.7, 0], color);
        box(group, [1.5, 0.12, 0.15], [x, y + 0.8, 1.66], COLORS.yellow);
      }
    }
  }

  function createSubstation(group: THREE.Group, color: string): void {
    box(group, [11, 0.35, 7], [0, 0.2, 0], "#dfddd0");
    box(group, [4.6, 3, 3.6], [-1.7, 1.9, 0], color);
    for (const x of [-3.4, -2.4, -1.4, -0.4]) box(group, [0.15, 2.3, 4], [x, 1.9, 0], COLORS.dark);
    for (const x of [-2.7, -0.8]) {
      cylinder(group, 0.25, 1.2, [x, 3.9, 0], COLORS.ivory);
      cylinder(group, 0.35, 0.25, [x, 4.2, 0], COLORS.dark);
    }
    box(group, [2.5, 3.8, 2.5], [3.1, 2.3, 0], COLORS.ivory);
    box(group, [1.6, 0.8, 0.1], [3.1, 2.8, 1.31], COLORS.teal);
    for (const z of [-3, 3]) box(group, [11, 0.1, 0.1], [0, 1.2, z], "#a5afa3");
  }

  function createTrolley(group: THREE.Group, color: string, title: string, proposed: boolean): void {
    const tangent = new THREE.Vector3(55, 0, -9).normalize();
    const lateral = new THREE.Vector3(-tangent.z, 0, tangent.x);
    for (const t of [0.04, 0.34, 0.66, 0.96]) {
      const base = rampPoint(t);
      const mastBase = base.clone().addScaledVector(lateral, 5.4);
      cylinder(group, 0.2, 8.3, [mastBase.x, mastBase.y + 4.15, mastBase.z], color);
      const arm = box(group, [0.23, 0.23, 9.5], [base.x, base.y + 7.5, base.z], color);
      arm.rotation.y = Math.atan2(lateral.x, lateral.z);
      box(group, [1.8, 0.4, 1.8], [mastBase.x, mastBase.y + 0.15, mastBase.z], COLORS.soilLight);
    }
    for (const offset of [-1.65, 1.65]) {
      const points: THREE.Vector3[] = [];
      for (let index = 0; index <= 40; index++) {
        const t = index / 40;
        const p = rampPoint(t, 7.1).addScaledVector(lateral, offset);
        p.y -= Math.sin((t * 3.25) % 1 * Math.PI) * 0.14;
        points.push(p);
      }
      line(group, points, COLORS.dark);
    }
    const sign = new THREE.Group();
    sign.position.copy(rampPoint(0.53, 7.6));
    label(sign, title, 4, proposed);
    group.add(sign);
  }


  const processKinds = new Set(["mill","crusher","conveyor","fan","pump","compressor","workshop","office","lighting","drill","flotation","water"]);
  function pipe(group:THREE.Object3D, a:THREE.Vector3,b:THREE.Vector3,radius:number,color:string){
    const delta=b.clone().sub(a),mesh=cylinder(group,radius,delta.length(),[0,0,0],color);
    mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
  }
  function shed(group:THREE.Group,w:number,d:number,h:number,color:string){
    box(group,[w,.45,d],[0,.25,0],"#77817f");
    box(group,[w,h,d],[0,h/2+.5,0],color);
    const roof=box(group,[w+1,.4,d+1],[0,h+.8,0],"#52646b");roof.rotation.z=.04;
    for(let x=-w/2+1;x<w/2;x+=2){box(group,[1.2,1.2,.08],[x,h*.62,d/2+.05],"#70a7b9");box(group,[.09,h,.1],[x,h/2+.5,d/2+.12],"#a7b8bc");}
    box(group,[2.4,h*.7,.1],[0,h*.35+.5,d/2+.15],"#354c54");
  }
  function createProcess(group:THREE.Group, kind:string){
    const steel="#6c858d",green="#327e74",blue="#508ea6";
    if(kind==="mill"){
      shed(group,19,14,7,"#a5b4ad");
      for(const x of [-5,5]){
        const drum=cylinder(group,3.3,11,[x,4,0],steel);drum.rotation.x=Math.PI/2;movingParts.push({object:drum,owner:group,kind:"drum",offset:x});
        for(const z of [-4,4]){const ring=cylinder(group,3.55,.65,[x,4,z],"#9faeaa");ring.rotation.x=Math.PI/2;box(group,[5.7,1.5,1.4],[x,.9,z],"#626f6d");}
        box(group,[2.5,2.2,3],[x+3.5,1.5,2],green);
      }
      group.children[1].visible=false;
      group.children[2].visible=false;
      const gantry=box(group,[19,.6,.7],[0,9,0],"#d3aa53");
      for(const x of [-9,9])box(group,[.5,9,.5],[x,4.5,0],steel);
    }else if(kind==="crusher"){
      box(group,[8,2,8],[0,1,0],"#7c8179");
      const hopper=new THREE.Mesh(geometry(new THREE.CylinderGeometry(4.2,1.6,4,4)),material("#74867e"));hopper.position.y=5;hopper.rotation.y=Math.PI/4;group.add(hopper);
      cylinder(group,1.9,2,[0,2.8,0],green);box(group,[2,1.8,3],[3,1.6,0],green);
      for(let i=0;i<9;i++){const rock=new THREE.Mesh(geometry(new THREE.DodecahedronGeometry(.65,0)),material(COLORS.soilDark));rock.position.set(Math.sin(i*2)*2,7,Math.cos(i*3)*2);group.add(rock);}
    }else if(kind==="conveyor"){
      const belt=box(group,[15,.45,2.5],[0,2,0],"#35494c");
      for(const x of [-6,-2,2,6]){box(group,[.25,2,.25],[x,1,1.2],steel);box(group,[.25,2,.25],[x,1,-1.2],steel);const roller=cylinder(group,.17,2.8,[x,2,0],steel);roller.rotation.x=Math.PI/2;}
      for(const z of [-1.4,1.4])box(group,[15,.18,.15],[0,2.7,z],"#cfad60");
      for(let j=0;j<8;j++){const ore=box(group,[.65,.5,.8],[j*1.8-7,2.5,0],COLORS.soilDark);movingParts.push({object:ore,owner:group,kind:"ore",offset:j*1.8});}
    }else if(kind==="fan"){
      for(const x of [-3.5,3.5]){const duct=cylinder(group,2.3,7,[x,3,0],steel);duct.rotation.x=Math.PI/2;const mouth=cylinder(group,2, .15,[x,3,3.6],"#263c41");mouth.rotation.x=Math.PI/2;const rotor=new THREE.Group();rotor.position.set(x,3,3.75);group.add(rotor);for(let j=0;j<5;j++){const blade=box(rotor,[.35,3,.12],[0,0,0],"#acc1bc");blade.rotation.z=j*Math.PI/5;}movingParts.push({object:rotor,owner:group,kind:"rotor",offset:x});box(group,[5,.6,6],[x,.4,0],"#687d73");}
      pipe(group,new THREE.Vector3(0,2,-3),new THREE.Vector3(0,2,-8),1.2,steel);
    }else if(kind==="pump"||kind==="water"){
      if(kind==="water"){cylinder(group,5,2,[0,1.2,0],"#859791");cylinder(group,4.6,.08,[0,2.3,0],"#5795a2");box(group,[10,.2,.6],[0,2.7,0],steel);cylinder(group,.3,3,[0,1.8,0],steel);}
      for(const x of [-3,3]){cylinder(group,1,2,[x,1.1,5],green);const motor=cylinder(group,.75,2.4,[x,1.2,7],steel);motor.rotation.x=Math.PI/2;pipe(group,new THREE.Vector3(x,1.2,4),new THREE.Vector3(x,1.2,-4),.28,blue);}
    }else if(kind==="flotation"){
      for(const x of [-4,4])for(const z of [-3.6,3.6]){cylinder(group,3.2,3,[x,1.7,z],steel);cylinder(group,2.9,.1,[x,3.3,z],"#6a9e98");cylinder(group,.25,4,[x,3,z],"#d0d8c7");box(group,[1.6,1.3,1.6],[x,5.4,z],green);const agitator=box(group,[4,.12,.35],[x,3.5,z],"#d6d9ba");movingParts.push({object:agitator,owner:group,kind:"agitator",offset:x+z});}
      box(group,[16,.3,1.2],[0,4,0],"#d7b66d");
    }else if(kind==="compressor"){
      shed(group,10,7,4,"#a1aea5");for(const x of [-3,0,3]){const tank=cylinder(group,1.1,4,[x,1.7,5],steel);tank.rotation.x=Math.PI/2;box(group,[2,1.4,2],[x,1,8],green);}
    }else if(kind==="drill"){
      box(group,[5,1,2.8],[0,1,0],"#caad56");box(group,[2,2,2.4],[-1.4,2.3,0],"#b99740");for(const z of [-1,1]){pipe(group,new THREE.Vector3(1,2,z),new THREE.Vector3(6,4,z),.2,steel);pipe(group,new THREE.Vector3(6,4,z),new THREE.Vector3(8,3,z),.12,steel);}for(const x of [-1.7,1.7])for(const z of [-1.5,1.5]){const t=cylinder(group,.8,.5,[x,.8,z],"#2f4143");t.rotation.x=Math.PI/2;}
    }else if(kind==="lighting"){
      for(const x of [-3,3]){cylinder(group,.16,9,[x,4.5,0],steel);box(group,[2.4,.4,1],[x,9,0],"#fff2b7");}
    }else shed(group,kind==="office"?13:12,kind==="office"?7:10,kind==="office"?4:5,kind==="office"?"#c3c5ac":"#9daea4");
    for(const mesh of [...group.children])if(mesh instanceof THREE.Mesh){mesh.castShadow=true;mesh.receiveShadow=true;}
  }
  function updateLoads(values:Record<string,{kw:number;ratio:number}>){
    for(const [id,value] of Object.entries(values)){const group=itemGroups.get(id);if(!group)continue;group.userData.activity=Math.max(0,value.ratio);group.traverse(o=>{if(o instanceof THREE.Mesh){const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){if(mat instanceof THREE.MeshStandardMaterial){mat.emissive.set(value.ratio>.9?"#c17c2e":"#258272");mat.emissiveIntensity=Math.min(.45,Math.max(0,value.ratio)*.3);}}}});}
    requestRender();
  }

  function createItems(): void {
    for (const item of items) {
      const group = new THREE.Group();
      group.userData.itemId = item.id;
      const color = item.proposed ? COLORS.proposed : COLORS.teal;
      if (item.kind === "trolley") {
        createTrolley(group, color, item.label, Boolean(item.proposed));
        group.userData.focus = rampPoint(0.5, 0.2);
      } else {
        group.position.set(...item.position);
        if (item.kind === "charger") createCharger(group, color);
        if (item.kind === "battery") createBattery(group, color);
        if (item.kind === "packs") createPacks(group, color);
        if (item.kind === "substation") createSubstation(group, color);
        if(processKinds.has(item.kind)) {
          createProcess(group,item.kind);
          group.traverse(object=>{if(object instanceof THREE.Mesh){const old=Array.isArray(object.material)?object.material:[object.material];const copies=old.map(m=>{const copy=m.clone();materials.add(copy);return copy;});object.material=Array.isArray(object.material)?copies:copies[0];}});
        }
        label(group, item.label, processKinds.has(item.kind)?12:item.kind === "substation" ? 7.6 : 6.7, item.proposed);
        if(processKinds.has(item.kind))group.children.filter(o=>o instanceof THREE.Sprite).forEach(o=>o.visible=false);
        group.userData.focus = new THREE.Vector3(...item.position).add(new THREE.Vector3(0, 0.2, 0));
      }
      scene.add(group);
      itemGroups.set(item.id, group);
      selectable.push(group);
    }
  }

  function releaseDetached(group: THREE.Object3D): void {
    const foundGeometries = new Set<THREE.BufferGeometry>();
    const foundMaterials = new Set<THREE.Material>();
    group.traverse(object => {
      const renderable = object as THREE.Mesh | THREE.Sprite;
      if ("geometry" in renderable && renderable.geometry) foundGeometries.add(renderable.geometry);
      if ("material" in renderable && renderable.material) {
        for (const entry of Array.isArray(renderable.material) ? renderable.material : [renderable.material]) foundMaterials.add(entry);
      }
    });
    for (const entry of foundGeometries) {
      if (geometries.delete(entry)) entry.dispose();
    }
    for (const entry of foundMaterials) {
      if ([...sharedMaterials.values()].includes(entry as THREE.MeshStandardMaterial)) continue;
      const texture = (entry as THREE.SpriteMaterial).map;
      if (texture && textures.delete(texture)) texture.dispose();
      if (materials.delete(entry)) entry.dispose();
    }
    group.clear();
  }

  function createTruck(vehicle: SceneVehicle, index: number, stateIndex: number): THREE.Group {
    const group = new THREE.Group();
    const charging = vehicle.state === "charging";
    const bodyColor = charging ? COLORS.tealLight : COLORS.yellow;
    box(group, [5.8, 0.7, 2.9], [0, 1.1, 0], COLORS.dark);
    box(group, [3.9, 1.3, 3.2], [-0.8, 2.1, 0], bodyColor);
    box(group, [4.3, 0.15, 3.5], [-0.8, 2.83, 0], COLORS.ivory);
    box(group, [1.5, 1.9, 2.6], [1.9, 2, 0], bodyColor);
    box(group, [0.1, 0.9, 2.15], [2.7, 2.35, 0], COLORS.dark);
    box(group, [1.2, 0.8, 0.08], [1.9, 2.45, 1.34], COLORS.dark);
    box(group, [1.2, 0.8, 0.08], [1.9, 2.45, -1.34], COLORS.dark);
    for (const x of [-1.7, 1.8]) for (const z of [-1.55, 1.55]) {
      const tire = cylinder(group, 0.83, 0.6, [x, 0.86, z], "#293c3b");
      tire.rotation.x = Math.PI / 2;
      const hub = cylinder(group, 0.37, 0.64, [x, 0.86, z], "#b1bdb5");
      hub.rotation.x = Math.PI / 2;
    }
    const value = vehicle.soc !== null && Number.isFinite(vehicle.soc) ? `${Math.round(Math.max(0, Math.min(100, vehicle.soc)))} %` : "sin dato";
    label(group, `${vehicle.label} · ${value}`, 5.3);
    const charger = items.find(item => item.kind === "charger" && !item.proposed);
    if (charging && charger) {
      group.position.set(charger.position[0] + 5.8, charger.position[1] + 0.2, charger.position[2] + (charger.position[2] > 0 ? -5 : 4) + stateIndex * 4.7);
      group.rotation.y = Math.PI / 2;
    } else if (vehicle.state === "working") {
      const t = Math.min(0.88, 0.18 + stateIndex * 0.19);
      group.position.copy(rampPoint(t, 0.32));
      group.rotation.y = Math.atan2(9, 55);
    } else {
      group.position.set(-43 + (stateIndex % 3) * 9, 0.25, 36 + Math.floor(stateIndex / 3) * 6);
      group.rotation.y = -Math.PI / 2;
    }
    group.userData.vehicleState=vehicle.state;group.userData.stateIndex=stateIndex;
    group.name = `vehicle-${vehicle.id}-${index}`;
    return group;
  }

  function updateVehicles(next: SceneVehicle[]): void {
    if (disposed) return;
    const signature=JSON.stringify(next.map(v=>[v.id,v.label,v.state,v.soc===null?null:Math.round(v.soc)]));
    if(signature===vehicleSignature)return;vehicleSignature=signature;
    for (const child of [...vehicleLayer.children]) {
      vehicleLayer.remove(child);
      releaseDetached(child);
    }
    const stateCounts: Record<SceneVehicle["state"], number> = { charging: 0, working: 0, idle: 0, unknown: 0 };
    next.forEach((vehicle, index) => vehicleLayer.add(createTruck(vehicle, index, stateCounts[vehicle.state]++)));
    setSimulationMinute(simulationMinute);
    requestRender();
  }

  /** Analytic illustration driven only by the caller's clock, so pause/scrub are exact. */
  function setSimulationMinute(minute:number):void {
    if(disposed||!Number.isFinite(minute))return;
    simulationMinute=minute;
    for(const part of movingParts){
      if(!(part.owner.userData.activity>0))continue;
      const phase=minute*.7+part.offset;
      if(part.kind==="rotor")part.object.rotation.z=phase;
      if(part.kind==="drum"||part.kind==="agitator")part.object.rotation.y=phase;
      if(part.kind==="ore")part.object.position.x=((minute*.8+part.offset)%14+14)%14-7;
    }
    for(const truck of vehicleLayer.children){
      if(truck.userData.vehicleState!=="working")continue;
      const phase=((minute/24+truck.userData.stateIndex*.22)%1+1)%1;
      const ascending=phase<.5,t=.08+.84*(ascending?phase*2:(1-phase)*2);
      truck.position.copy(rampPoint(t,.32));truck.position.z+=ascending?1.7:-1.7;
      truck.rotation.y=Math.atan2(9,55)+(ascending?0:Math.PI);
    }
    requestRender();
  }

  function requestRender(): void {
    if (disposed || frame !== null || !renderer) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      if (!disposed && renderer) renderer.render(scene, camera);
    });
  }

  function resize(): void {
    if (disposed || !renderer) return;
    const width = Math.max(1, host.clientWidth || 640);
    const height = Math.max(1, host.clientHeight || 400);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    requestRender();
  }

  function select(id: string): void {
    if (disposed || !selection) return;
    selectedItem=id;
    for(const [key,item] of itemGroups)if(processKinds.has(items.find(v=>v.id===key)?.kind??""))item.children.filter(o=>o instanceof THREE.Sprite).forEach(o=>o.visible=key===id);
    const group = itemGroups.get(id);
    selection.visible = Boolean(group);
    if (group) {
      selection.position.copy(group.userData.focus as THREE.Vector3);
      selection.scale.setScalar(items.find(item => item.id === id)?.kind === "trolley" ? 1.4 : 1);
    }
    requestRender();
  }

  function onPointerDown(event: PointerEvent): void {
    pointerDown = event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
  }

  function onPointerCancel(): void {
    pointerDown = null;
  }

  function onPointerUp(event: PointerEvent): void {
    const start = pointerDown;
    pointerDown = null;
    if (!renderer || !start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(selectable, true);
    for (const hit of hits) {
      let object: THREE.Object3D | null = hit.object;
      while (object && !object.userData.itemId) object = object.parent;
      if (object?.userData.itemId) {
        const id = object.userData.itemId as string;
        select(id);
        onSelect(id);
        break;
      }
    }
  }

  function setCamera(view: CameraView): void {
    if (disposed || !controls) return;
    if (view === "top") {
      controls.target.set(0, 0, -6);
      camera.position.set(0, 154, -5);
    } else if (view === "ramp") {
      controls.target.set(6, 8, -19);
      camera.position.set(61, 40, 42);
    } else {
      controls.target.set(0, 2, 0);
      camera.position.set(95, 105, 135);
    }
    controls.update();
    requestRender();
  }

  function rotate(direction: number): void {
    if (disposed || !controls || !Number.isFinite(direction)) return;
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sign(direction) * Math.PI / 10);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    requestRender();
  }

  function zoom(direction: number): void {
    if (disposed || !controls || !Number.isFinite(direction)) return;
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(offset.length() * (direction > 0 ? 0.82 : 1.22), controls.minDistance, controls.maxDistance);
    offset.setLength(distance);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    requestRender();
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    resizeObserver?.disconnect();
    window.removeEventListener("resize", resize);
    controls?.removeEventListener("change", requestRender);
    controls?.dispose();
    if (renderer) {
      const canvas = renderer.domElement;
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.remove();
    }
    for (const value of geometries) value.dispose();
    for (const value of materials) value.dispose();
    for (const value of textures) value.dispose();
    geometries.clear();
    materials.clear();
    textures.clear();
    sharedMaterials.clear();
    itemGroups.clear();
    selectable.length = 0;
    scene.traverse(object => { if (object instanceof THREE.DirectionalLight) object.shadow.dispose(); });
    scene.clear();
    renderer?.renderLists.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer = null;
    controls = null;
  }

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "Vista 3D de una mina ficticia. La ubicación y el movimiento de los equipos son ilustrativos.");
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight("#fff7e9", "#8e9e90", 2.7));
    const sunlight = new THREE.DirectionalLight("#fff0d3", 3.2);
    sunlight.position.set(-50, 95, 55);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024);
    sunlight.shadow.camera.left = -100;
    sunlight.shadow.camera.right = 100;
    sunlight.shadow.camera.top = 85;
    sunlight.shadow.camera.bottom = -85;
    sunlight.shadow.camera.near = 1;
    sunlight.shadow.camera.far = 240;
    sunlight.shadow.bias = -0.0008;
    sunlight.shadow.normalBias = 0.15;
    scene.add(sunlight);
    createTerrain();
    createItems();
    scene.add(vehicleLayer);

    const selectionMaterial = new THREE.MeshBasicMaterial({ color: "#f0ac3c", side: THREE.DoubleSide, depthWrite: false, transparent: true, opacity: 0.95 });
    materials.add(selectionMaterial);
    selection = new THREE.Mesh(geometry(new THREE.RingGeometry(5.1, 5.55, 48)), selectionMaterial);
    selection.rotation.x = -Math.PI / 2;
    selection.visible = false;
    scene.add(selection);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.minDistance = 28;
    controls.maxDistance = 230;
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.addEventListener("change", requestRender);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerCancel);
    resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(host);
    window.addEventListener("resize", resize);
    updateVehicles(vehicles);
    setCamera("overview");
    resize();
    return { select, updateVehicles, updateLoads, setSimulationMinute, camera: setCamera, rotate, zoom, dispose };
  } catch (error) {
    dispose();
    throw error instanceof Error ? error : new Error("No fue posible iniciar la vista 3D.");
  }
}
