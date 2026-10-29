"""Edit authentic public-app screenshot sequences into the English demo video.

Capture files must come from documented CUA screenshot APIs. This program does
not access or automate a browser. It preserves the captured UI, adds a separate
editorial panel/captions, and holds the final frame of each shot for narration.
"""
from pathlib import Path
from functools import lru_cache
from bisect import bisect_right
import argparse,collections,hashlib,json,subprocess,textwrap,wave
from PIL import Image,ImageDraw,ImageFont
import imageio_ffmpeg

parser=argparse.ArgumentParser()
parser.add_argument('--capture-dir',type=Path,required=True)
parser.add_argument('--audio-dir',type=Path,required=True)
parser.add_argument('--output-dir',type=Path,required=True)
parser.add_argument('--stills-only',action='store_true')
args=parser.parse_args();CAP=args.capture_dir.resolve();OUT=args.output_dir.resolve();OUT.mkdir(parents=True,exist_ok=True)
APP=Path(__file__).resolve().parents[2];PLAN=json.loads((APP/'docs/submission/media/SUBMISSION_SCENES_EN.json').read_text())
manifest_path=CAP/'manifest.json';manifest=json.loads(manifest_path.read_text());groups=collections.defaultdict(list)
for frame in manifest['frames']:
 path=CAP/frame['file'];assert hashlib.sha256(path.read_bytes()).hexdigest()==frame['sha256'],frame['file']
 groups[frame['group']].append(frame)
for frames in groups.values():frames.sort(key=lambda f:f['elapsedMs'])
assert len({f['sha256'] for f in groups['playback']})>50
assert 'chatgpt.site/demo' in manifest['url']
TOTAL=168;FPS=24;W,H=1920,1080;RATE=24000;FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
BG='#0a1822';PANEL='#122935';TEXT='#f1f7f7';MUTED='#b0c2ce';GREEN='#65debe';AMBER='#ffcf80'
fonts={}
def font(size,bold=False):
 key=size,bold
 if key not in fonts:
  options=['C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
  path=next((p for p in options if Path(p).exists()),None)
  fonts[key]=ImageFont.truetype(path,size) if path else ImageFont.load_default()
 return fonts[key]
def text(d,x,y,value,size=30,color=TEXT,bold=False):d.text((x,y),str(value),fill=color,font=font(size,bold))
def wrap(d,x,y,value,width=665,size=30,color=TEXT,bold=False,spacing=10):
 lines=[];line=''
 for word in str(value).split():
  candidate=(line+' '+word).strip()
  if d.textlength(candidate,font=font(size,bold))>width and line:lines.append(line);line=word
  else:line=candidate
 if line:lines.append(line)
 for j,line in enumerate(lines):text(d,x,y+j*(size+spacing),line,size,color,bold)
 return y+len(lines)*(size+spacing)
def card(d,y,label,value,unit='',color=GREEN):
 d.rounded_rectangle((1190,y,1878,y+113),14,fill=PANEL)
 text(d,1213,y+11,label,23,MUTED)
 text(d,1213,y+43,value,43,color,True)
 if unit:text(d,1230+d.textlength(str(value),font=font(43,True)),y+61,unit,24,MUTED)
 return y+131

audio=bytearray(TOTAL*RATE*2);captions=[]
for i,scene in enumerate(PLAN):
 clips=[]
 for j,sentence in enumerate(scene['sentences']):
  path=args.audio_dir/f'scene-{i:02d}-sentence-{j:02d}.wav'
  raw=subprocess.run([FFMPEG,'-v','error','-i',str(path),'-f','s16le','-ar',str(RATE),'-ac','1','pipe:1'],capture_output=True,check=True).stdout
  clips.append((sentence,raw,len(raw)/(RATE*2)))
 remaining=scene['end']-scene['start']-sum(c[2] for c in clips)
 assert remaining>.15,f'Narration too long: scene {i}'
 gap=remaining/(len(clips)+1);cursor=scene['start']+gap
 for sentence,raw,duration in clips:
  offset=round(cursor*RATE)*2;audio[offset:offset+len(raw)]=raw
  captions.append({'start':cursor,'end':cursor+duration,'text':sentence});cursor+=duration+gap
with wave.open(str(OUT/'NARRATION_FINAL_EN.wav'),'wb') as w:w.setparams((1,2,RATE,0,'NONE','not compressed'));w.writeframes(audio)
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(OUT/'CAPTIONS_FINAL_EN.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+'\n'.join(textwrap.wrap(c['text'],66)) for i,c in enumerate(captions))+'\n',encoding='utf-8')
(OUT/'NARRATION_FINAL_EN.txt').write_text('\n\n'.join(' '.join(s['sentences']) for s in PLAN)+'\n',encoding='utf-8')
@lru_cache(maxsize=30)
def image(file):
 im=Image.open(CAP/file).convert('RGB');im.thumbnail((1100,902),Image.Resampling.LANCZOS)
 # Upscale uniformly to the frame area; no cropping or changes to UI contents.
 factor=min(1100/im.width,902/im.height)
 return im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS)
def frame_for(shot,t):
 fs=groups[shot['group']];ms=max(0,(t-shot['start'])*1000)
 index=max(0,min(len(fs)-1,bisect_right([f['elapsedMs'] for f in fs],ms)-1))
 return fs[index]
def render(t):
 scene_number=next((i for i,s in enumerate(PLAN) if s['start']<=t<s['end']),7);scene=PLAN[scene_number]
 shot=next((s for s in scene['clips'] if s['start']<=t<s['end']),scene['clips'][-1])
 frame=frame_for(shot,t);im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 text(d,40,20,'ELECTRODECISION · PUBLIC APPLICATION RECORDING',23,GREEN,True)
 text(d,1220,23,'NEBIUS TOKEN FACTORY × NVIDIA NEMOTRON',22,MUTED)
 screenshot=image(frame['file']);im.paste(screenshot,(40+(1100-screenshot.width)//2,76+(902-screenshot.height)//2))
 text(d,1190,85,f'{scene_number+1:02} / 08  ·  SYNTHETIC OPERATION',22,GREEN,True)
 y=wrap(d,1190,130,scene['title'],size=43,bold=True)+26
 if scene_number==0:
  y=wrap(d,1190,y,'Enough energy does not guarantee the production target.',size=38)+35
  y=wrap(d,1190,y,'Compare charging. Expose constraints. Prioritize missing evidence.',size=31,color=MUTED)
 elif scene_number==1:
  for label,val,unit in [('Generic underground fleet','4','LHDs'),('Production target','1,700','t per 12-hour shift'),('Current supply','1,050','kW'),('Battery state of health','85','%')]:y=card(d,y,label,val,unit)
 elif scene_number==2:
  for label,val,unit in [('1 charger / current supply','1,188','t'),('2 chargers / same supply','1,404','t'),('2 chargers / +350 kW','1,782','t')]:y=card(d,y,label,val,unit)
  wrap(d,1190,y+5,'Unmanaged: 1,782 t, but 369 minutes of supply overload.',size=32,color=AMBER)
 elif scene_number==3:
  for label,val,unit in [('Upgrade · shift one','1,782','t'),('Upgrade · shift two','1,872','t'),('Charging break','60','minutes'),('Two-shift observation','25','hours')]:y=card(d,y,label,val,unit)
 elif scene_number==4:
  declared=t>=96
  y=card(d,y,'Critical items still open','7' if declared else '8','items',AMBER)
  y=card(d,y,'Documents declared','1 / 12' if declared else '0 / 12','documents')
  wrap(d,1190,y+10,'A reference changes declared completeness. It never verifies a document or certifies a permit.',size=31,color=MUTED)
 elif scene_number==5:
  text(d,1190,y,'Calling model + tools' if t<115 else 'Inference and tools verified',30,GREEN,True);y+=66
  y=wrap(d,1190,y,'assess_project_readiness',size=29,bold=True)+25
  y=wrap(d,1190,y,'get_project_context',size=29,bold=True)+40
  if t>=123:y=card(d,y,'Recorded inference usage','8,296 / 602','input / output tokens')
  wrap(d,1190,y+15,'Validated evidence IDs → catalog-backed report. Provider key stays server-side.',size=30,color=MUTED)
 elif scene_number==6:
  y=card(d,y,'Automated checks','87','tests passed')
  y=card(d,y,'Public source license','MIT')
  for command in ['npm run install:ci','npm test','npm run typecheck','npm run build']:
   text(d,1190,y,command,29,GREEN);y+=49
  wrap(d,1190,y+18,'Synthetic inputs. No measured industrial savings or engineering approval.',size=28,color=AMBER)
 else:
  for title in ['Compare charging choices.','Expose production constraints.','Prioritize missing evidence.']:
   y=wrap(d,1190,y,title,size=34,color=GREEN,bold=True)+24
  y=wrap(d,1190,y+20,'Next: validate with site data and mining planners.',size=31,color=MUTED)+30
  wrap(d,1190,y,'Public demo and MIT source links are included with the video.',size=29)
 # Separate editorial panel; original captured UI is never regenerated.
 text(d,1190,906,'Recorded UI · edited with holds for narration',22,MUTED)
 text(d,1190,940,f'{int(t)//60:02}:{int(t)%60:02} / 02:48  ·  English demo',22,MUTED)
 d.rectangle((0,984,W,1080),fill='#030b10')
 caption=next((c['text'] for c in captions if c['start']<=t<c['end']),None)
 if caption:
  lines=textwrap.wrap(caption,110)
  for j,line in enumerate(lines[:2]):
   tw=d.textlength(line,font=font(31));text(d,(W-tw)/2,993+j*36,line,31)
 return im

for i,s in enumerate(PLAN):render((s['start']+s['end'])/2).save(OUT/f'FINAL_SCENE_{i+1:02d}.jpg',quality=92)
render(120).save(OUT/'THUMBNAIL_FINAL_EN.jpg',quality=95)
if args.stills_only:
 print('Representative final-cut frames rendered.');raise SystemExit(0)
video=OUT/'ELECTRODECISION_SUBMISSION_EN.mp4'
cmd=[FFMPEG,'-v','error','-y','-f','rawvideo','-vcodec','rawvideo','-s',f'{W}x{H}','-pix_fmt','rgb24','-r',str(FPS),'-i','pipe:0','-i',str(OUT/'NARRATION_FINAL_EN.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t',str(TOTAL),'-movflags','+faststart',str(video)]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
try:
 for n in range(TOTAL*FPS):
  proc.stdin.write(render(n/FPS).tobytes())
  if n and n%(30*FPS)==0:print(f'Final video: {n//FPS}/{TOTAL} seconds',flush=True)
 proc.stdin.close();error=proc.stderr.read().decode();assert proc.wait()==0,error
except BaseException:proc.kill();raise
decode=subprocess.run([FFMPEG,'-v','error','-xerror','-i',str(video),'-map','0:v:0','-map','0:a:0','-f','null','-'],capture_output=True,text=True);assert decode.returncode==0,decode.stderr
probe=subprocess.run([FFMPEG,'-hide_banner','-i',str(video)],capture_output=True,text=True).stderr
assert 'Duration: 00:02:48.' in probe and '1920x1080' in probe and 'Audio: aac' in probe
volume=subprocess.run([FFMPEG,'-hide_banner','-i',str(video),'-af','volumedetect','-vn','-sn','-dn','-f','null','-'],capture_output=True,text=True)
assert 'mean_volume: -inf' not in volume.stderr
result={'file':video.name,'durationSeconds':TOTAL,'width':W,'height':H,'fps':FPS,'videoCodec':'H.264','audioCodec':'AAC','englishNarration':True,'narrationVoice':'Microsoft Zira Desktop; synthetic speech','captionCues':len(captions),'burnedInCaptions':True,'decodeVerified':True,'browserFootage':True,'publicApplicationUrl':manifest['url'],'captureMethod':manifest['method'],'captureFrames':len(manifest['frames']),'capturedSeconds':round(sum(f[-1]['elapsedMs']/1000 for f in groups.values()),3),'editing':'Authentic screenshots assembled with their recorded timestamps at normal speed, then held for narration. Separate editorial panels and captions; no fabricated or injected UI. No local browser capture.','realInferenceRecordedDuringCapture':True,'recordedInferenceUsage':{'inputTokens':8296,'outputTokens':602},'captureManifestSha256':hashlib.sha256(manifest_path.read_bytes()).hexdigest(),'videoSha256':hashlib.sha256(video.read_bytes()).hexdigest(),'bytes':video.stat().st_size,'uploadReady':True,'youtubeUrl':None,'submitted':False}
(OUT/'FINAL_VIDEO_VALIDATION_EN.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result),flush=True)
