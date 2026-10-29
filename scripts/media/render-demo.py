"""Render a disclosed replay of calculation modules, not UI/screen footage.

Requires Python 3, Pillow and imageio-ffmpeg. Run the Node export and Windows
narrate.ps1 first. Usage: python render-demo.py --audio-dir PATH --output-dir PATH
No browser, account, API key or live provider call is used by this renderer.
"""
from pathlib import Path
import argparse, hashlib, json, math, re, subprocess, textwrap, wave
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

APP=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('--audio-dir',type=Path,required=True)
parser.add_argument('--output-dir',type=Path,required=True)
args=parser.parse_args();OUT=args.output_dir.resolve();OUT.mkdir(parents=True,exist_ok=True)
data_path=APP/'examples/demo-video/module-output.json'
record_path=APP/'examples/nebius/submission-en.json'
DATA=json.loads(data_path.read_text(encoding='utf-8'))
RECORD=json.loads(record_path.read_text(encoding='utf-8'))
PLAN=json.loads((APP/'docs/submission/media/SCENES_EN.json').read_text(encoding='utf-8'))
assert DATA['synthetic'] and RECORD['connectionVerified'] and RECORD['projectReport']['selectionValidated']
assert [a['result']['deliveredT'] for a in DATA['alternatives']]==[1188,1404,1782,1782]
assert DATA['campaign']['second']['deliveredT']==1872
TOTAL=PLAN[-1]['end'];FPS=12;W,H=1280,720
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
BG='#08141e';PANEL='#102330';LINE='#29424f';WHITE='#f3f7f8';MUTED='#a5b9c7';CYAN='#59ddca';AMBER='#ffcc70';RED='#ff8d8d';BLUE='#8bbdff'
COLORS=[CYAN,BLUE,AMBER,'#d5a9ff']
font_cache={}
def font(size,bold=False):
 key=(size,bold)
 if key not in font_cache:
  names=['C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
  path=next((p for p in names if Path(p).exists()),None)
  font_cache[key]=ImageFont.truetype(path,size) if path else ImageFont.load_default()
 return font_cache[key]
def text(d,xy,value,size=22,color=WHITE,bold=False):d.text(xy,str(value),font=font(size,bold),fill=color)
def wrapped(d,x,y,value,width,size=23,color=WHITE,spacing=7,max_lines=5):
 lines=[];line=''
 for word in str(value).split():
  nxt=(line+' '+word).strip()
  if d.textlength(nxt,font=font(size))>width and line:lines.append(line);line=word
  else:line=nxt
 if line:lines.append(line)
 for i,line in enumerate(lines[:max_lines]):text(d,(x,y+i*(size+spacing)),line,size,color)
 return len(lines[:max_lines])*(size+spacing)
def box(d,rect,fill=PANEL,outline=LINE,radius=18):d.rounded_rectangle(rect,radius,fill,outline,2)
def chip(d,x,y,value,color=CYAN):
 width=d.textlength(value,font=font(17,True))+28
 box(d,(x,y,x+width,y+32),BG,color,10);text(d,(x+14,y+4),value,17,color,True)
 return width
def metric(d,x,y,label,value,unit='',color=CYAN,width=270):
 box(d,(x,y,x+width,y+104));text(d,(x+18,y+12),label,17,MUTED)
 text(d,(x+18,y+36),value,37,color,True);text(d,(x+18+ d.textlength(str(value),font=font(37,True))+10,y+53),unit,18,MUTED)
def lineplot(d,rect,series,xmax,ymax,limit=None):
 x,y,w,h=rect
 for level in [0,.25,.5,.75,1]:
  yy=y+h-level*h;d.line((x,yy,x+w,yy),fill=LINE,width=1);text(d,(x-42,yy-10),f'{int(level*ymax)}',14,MUTED)
 for vals,color in series:
  pts=[(x+min(1,a/xmax)*w,y+h-min(1,max(0,b/ymax))*h) for a,b in vals]
  if len(pts)>1:d.line(pts,fill=color,width=3)
 if limit is not None:
  yy=y+h-limit/ymax*h
  for xx in range(int(x),int(x+w),14):d.line((xx,yy,xx+7,yy),fill=AMBER,width=2)
 text(d,(x,y+h+7),'0',14,MUTED);text(d,(x+w-60,y+h+7),str(xmax),14,MUTED)

# Assemble narration from individual sentence WAVs. Captions follow actual audio
# boundaries; pauses are distributed within each scene without speeding speech.
RATE=24000;audio=bytearray(TOTAL*RATE*2);captions=[]
for i,scene in enumerate(PLAN):
 clips=[]
 for j,sentence in enumerate(scene['sentences']):
  path=args.audio_dir/f'scene-{i:02d}-sentence-{j:02d}.wav'
  raw=subprocess.run([FFMPEG,'-v','error','-i',str(path),'-f','s16le','-ar',str(RATE),'-ac','1','pipe:1'],check=True,capture_output=True).stdout
  clips.append((sentence,raw,len(raw)/(RATE*2)))
 speech=sum(c[2] for c in clips);room=scene['end']-scene['start']-speech
 assert room>=.2,f'Narration exceeds scene {i}; extend scene or rerecord.'
 gap=room/(len(clips)+1);cursor=scene['start']+gap
 for sentence,raw,duration in clips:
  offset=round(cursor*RATE)*2;audio[offset:offset+len(raw)]=raw
  captions.append({'start':cursor,'end':cursor+duration,'text':sentence,'scene':i})
  cursor+=duration+gap
with wave.open(str(OUT/'NARRATION_EN.wav'),'wb') as wav:
 wav.setparams((1,2,RATE,0,'NONE','not compressed'));wav.writeframes(audio)
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
srt='\n\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+'\n'.join(textwrap.wrap(c['text'],62)) for i,c in enumerate(captions))+'\n'
(OUT/'CAPTIONS_EN.srt').write_text(srt,encoding='utf-8')
(OUT/'NARRATION_EN.txt').write_text('\n\n'.join(' '.join(s['sentences']) for s in PLAN)+'\n',encoding='utf-8')

def render(t):
 i=next((i for i,s in enumerate(PLAN) if s['start']<=t<s['end']),len(PLAN)-1)
 scene=PLAN[i];p=(t-scene['start'])/(scene['end']-scene['start'])
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 text(d,(48,24),'ELECTRODECISION',19,CYAN,True)
 text(d,(865,26),'NEBIUS TOKEN FACTORY  ×  NVIDIA',16,MUTED)
 text(d,(48,67),scene['title'],34,WHITE,True)
 text(d,(48,116),'Working module outputs · synthetic mine · English technical walkthrough',17,MUTED)
 d.line((48,151,1232,151),fill=LINE,width=2)
 if i==0:
  for j,(title,body) in enumerate([('Mining task','Fleet, payload, route and shifts'),('Shared infrastructure','Chargers, critical loads and supply'),('Decision evidence','Production, energy and missing inputs')]):
   x=48+j*403;box(d,(x,210,x+378,455));text(d,(x+25,235),f'0{j+1}',21,CYAN,True)
   wrapped(d,x+25,281,title,330,29,max_lines=2);wrapped(d,x+25,367,body,330,22,MUTED)
  sample=DATA['alternatives'][0]['result']['samples'][min(719,int(p*720))]
  text(d,(73,493),f"Baseline module replay · minute {sample['minute']:03d} / 720",22,MUTED)
  text(d,(73,530),f"{sample['tonnes']:,.0f} t delivered",30,AMBER,True)
 elif i==1:
  for j,(label,value,unit) in enumerate([('Fleet','4','LHDs'),('Target','1,700','t / shift'),('Supply','1,050','kW'),('Battery health','85','%')]):metric(d,48+j*300,172,label,value,unit,width=284)
  box(d,(48,294,1232,584));text(d,(73,312),'Baseline power demand and vehicle states',22,WHITE,True)
  samples=DATA['alternatives'][0]['result']['samples'];n=min(719,max(1,int(p*720)));sample=samples[n]
  lineplot(d,(104,371,665,158),[([(s['minute'],s['gridKw']) for s in samples[:n+1]],CYAN)],720,1250,1050)
  text(d,(104,344),'kW · dashed line = available supply',16,MUTED)
  for j,state in enumerate(sample['states']):
   color=CYAN if state=='working' else AMBER
   text(d,(837,351+j*48),f'LHD {j+1}',19,MUTED);text(d,(938,351+j*48),state.capitalize(),19,color,True)
  text(d,(837,550),f"Minute {sample['minute']} · queue {sample['queue']}",17,MUTED)
 elif i==2:
  box(d,(48,172,1232,582));text(d,(75,191),'Same task, four charging alternatives',24,WHITE,True)
  x0=445;length=570;scale=2000;progress=1
  labels=['1 charger · current supply','2 chargers · same supply','2 chargers · +350 kW','2 chargers · unmanaged']
  for j,a in enumerate(DATA['alternatives']):
   y=257+j*67;r=a['result'];val=r['deliveredT']*progress;color=RED if j==3 else CYAN if j==2 else BLUE
   text(d,(77,y),labels[j],21,WHITE,j==2)
   d.rounded_rectangle((x0,y,x0+length,y+29),8,fill=BG)
   if val>0:d.rounded_rectangle((x0,y,x0+length*val/scale,y+29),8,fill=color)
   text(d,(1038,y-3),f'{val:,.0f} t',25,color,True)
   text(d,(x0,y+33),f"Waiting: {r['totalQueueMinutes']:,.0f} vehicle-min · overload: {r['overloadMinutes']} min",15,MUTED)
  xx=x0+length*1700/scale;d.line((xx,244,xx,515),fill=AMBER,width=2)
  text(d,(824,535),'Target: 1,700 t per shift',19,AMBER,True)
 elif i==3:
  c=DATA['campaign'];seq=c['first']['samples']+[{**s,'minute':720+s['minute']} for s in c['breakSamples']]+[{**s,'minute':780+s['minute']} for s in c['second']['samples']]
  n=min(len(seq)-1,max(1,int(p*len(seq))));samples=seq[:n+1]
  for j,(label,value,unit) in enumerate([('Shift 1','1,782','t'),('Charging break','60','min'),('Shift 2','1,872','t'),('Observation','25','hours')]):metric(d,48+j*300,172,label,value,unit,width=284)
  box(d,(48,294,1232,584));text(d,(78,311),'Individual battery SOC · no reset between shifts',22,WHITE,True)
  x,y,w,h=104,368,1057,157
  d.rectangle((x+w*720/1500,y,x+w*780/1500,y+h),fill='#283b39')
  lineplot(d,(x,y,w,h),[([(s['minute'],s['soc'][j]) for s in samples],COLORS[j]) for j in range(4)],1500,100,20)
  for j in range(4):text(d,(124+j*245,550),f"LHD {j+1}: {seq[n]['soc'][j]:.0f}%",18,COLORS[j],True)
  text(d,(671,338),'Break',15,AMBER);text(d,(1080,338),'SOC %',15,MUTED)
 elif i==4:
  review=DATA['review'] if p<.66 else DATA['declaredReview']
  x=48
  for label in ['Trolley assist','Implementation','Chile']:
   x+=chip(d,x,174,label)+14
  metric(d,48,223,'Open items',str(review['unresolved']),'of 12',AMBER,width=264)
  metric(d,48,343,'Critical items open',str(review['criticalOpen']),'items',RED,width=264)
  text(d,(60,470),'Declared ≠ verified',22,AMBER,True)
  wrapped(d,60,509,'Synthetic reference only. No permit or compliance certification.',240,20,MUTED)
  box(d,(337,223,1232,584))
  for j,item in enumerate(review['findings'][:5]):
   yy=243+j*65;color=CYAN if item['state']=='documented' else AMBER
   d.ellipse((361,yy+8,373,yy+20),fill=color)
   text(d,(389,yy),item['name'],23,WHITE,True)
   text(d,(389,yy+29),('DOCUMENT DECLARED · contents not verified' if item['state']=='documented' else 'MISSING · next specialist review'),16,color)
 elif i==5:
  report=RECORD['projectReport'];chip(d,48,174,'RECORDED REAL INFERENCE',AMBER)
  text(d,(390,178),RECORD['model'],21,WHITE,True)
  box(d,(48,224,645,584));text(d,(73,244),'Executed tool trace',23,WHITE,True)
  steps=[('Nebius Token Factory','Chat-completions inference API'),('assess_project_readiness','Executed · deterministic evidence counts'),('get_project_context','Executed · catalog and primary sources'),('Validated ID selection','Catalog-backed report; no free legal claims')]
  active=min(3,int(p*5))
  for j,(title,body) in enumerate(steps):
   yy=298+j*64;color=CYAN if j<=active else MUTED
   d.ellipse((75,yy+5,91,yy+21),fill=color);text(d,(110,yy),title,21,color,True);text(d,(110,yy+29),body,16,MUTED)
  box(d,(667,224,1232,584));text(d,(690,244),'Returned project report',23,WHITE,True)
  if p>.28:
   text(d,(690,290),f"{report['criticalOpen']} critical items open · {report['total']} required",22,AMBER,True)
   for j,a in enumerate(report['actions'][:3]):
    text(d,(690,337+j*53),a['id'],17,CYAN,True)
    wrapped(d,690,358+j*53,a['name'],500,19,max_lines=1)
  if p>.70:
   usage=RECORD['usage'];text(d,(690,519),f"Tokens: {usage['promptTokens']:,} input / {usage['completionTokens']:,} output",19,MUTED)
   text(d,(690,548),'Server credential excluded from this record',17,CYAN)
 elif i==6:
  box(d,(48,174,770,584));text(d,(76,198),'Reproducible source, visible evidence',26,WHITE,True)
  for j,line in enumerate(['npm run install:ci','npm test','npm run typecheck','npm run build','node scripts/export-demo-video-data.mjs']):
   text(d,(80,258+j*49),'› '+line,22,CYAN if j<=int(p*6) else MUTED)
  text(d,(80,532),'github.com/joseroavargas409/electrodecision-mining',19,MUTED)
  metric(d,794,174,'Automated tests','87','passed',CYAN,width=438)
  metric(d,794,294,'Public source license','MIT','',CYAN,width=438)
  wrapped(d,813,428,'Synthetic results. No measured savings, equipment control or engineering approval.',395,25,AMBER)
 else:
  text(d,(72,210),'Plan the review before buying the fleet.',38,WHITE,True)
  cards=[('01','Compare charging','Production and battery continuity'),('02','Expose constraints','Supply, queues and shift timing'),('03','Prioritize evidence','Sources, actions and tool trace')]
  for j,(num,title,body) in enumerate(cards):
   x=48+j*403;box(d,(x,310,x+378,478));text(d,(x+24,332),num,20,CYAN,True);text(d,(x+24,369),title,27,WHITE,True);wrapped(d,x+24,414,body,330,20,MUTED)
  text(d,(72,516),'Next: validate with site data and mining planners.',27,CYAN,True)
 # Sentence-aligned burnt-in captions and a persistent provenance statement.
 d.rectangle((0,605,W,668),fill='#040b10')
 caption=next((c['text'] for c in captions if c['start']<=t<c['end']),None)
 if caption:
  lines=textwrap.wrap(caption,95)
  for j,line in enumerate(lines[:2]):
   tw=d.textlength(line,font=font(22));text(d,((W-tw)/2,610+j*26),line,22,WHITE)
 text(d,(48,680),'MODULE REPLAY · recorded AI evidence · not a screen recording',15,MUTED)
 text(d,(1126,680),f'{int(t)//60:02}:{int(t)%60:02} / 02:48',15,MUTED)
 d.rectangle((0,710,int(W*t/TOTAL),719),fill=CYAN)
 return im

video=OUT/'ELECTRODECISION_WALKTHROUGH_EN.mp4'
cmd=[FFMPEG,'-v','error','-y','-f','rawvideo','-vcodec','rawvideo','-s',f'{W}x{H}','-pix_fmt','rgb24','-r',str(FPS),'-i','pipe:0','-i',str(OUT/'NARRATION_EN.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-r','24','-c:a','aac','-b:a','128k','-t',str(TOTAL),'-movflags','+faststart',str(video)]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
try:
 for n in range(TOTAL*FPS):
  proc.stdin.write(render(n/FPS).tobytes())
  if n and n%(30*FPS)==0:print(f'Rendered {n//FPS}/{TOTAL} seconds',flush=True)
 proc.stdin.close();stderr=proc.stderr.read().decode();assert proc.wait()==0,stderr
except BaseException:
 proc.kill();raise
for i,s in enumerate(PLAN):render((s['start']+s['end'])/2).save(OUT/f'SCENE_{i+1:02d}.jpg',quality=92)
render(57).save(OUT/'THUMBNAIL_EN.png')
# Decode the entire produced file and fail on damaged frames or packets.
check=subprocess.run([FFMPEG,'-v','error','-xerror','-i',str(video),'-map','0:v:0','-map','0:a:0','-f','null','-'],capture_output=True,text=True)
assert check.returncode==0,check.stderr
audio_check=subprocess.run([FFMPEG,'-hide_banner','-i',str(video),'-af','volumedetect','-vn','-sn','-dn','-f','null','-'],capture_output=True,text=True)
probe=subprocess.run([FFMPEG,'-hide_banner','-i',str(video)],capture_output=True,text=True).stderr
assert 'Duration: 00:02:48.' in probe and '1280x720' in probe and 'Audio: aac' in probe
assert 'mean_volume: -inf' not in audio_check.stderr
result={'file':video.name,'durationSeconds':TOTAL,'width':W,'height':H,'videoCodec':'H.264','audioCodec':'AAC','fps':24,'captionCues':len(captions),'englishNarration':True,'narrationVoice':'Microsoft Zira Desktop; synthetic speech','burnedInCaptions':True,'decodeVerified':True,'browserFootage':False,'newLiveInferenceDuringVideo':False,'submissionReady':False,'remainingVideoWork':'Include actual application footage and publish the final cut publicly on YouTube. This module replay is supporting material.','recordedInferenceVerifiedAt':RECORD['verifiedAt'],'recordedUsage':RECORD['usage'],'sourceDataSha256':hashlib.sha256(data_path.read_bytes()).hexdigest(),'inferenceEvidenceSha256':hashlib.sha256(record_path.read_bytes()).hexdigest(),'videoSha256':hashlib.sha256(video.read_bytes()).hexdigest(),'bytes':video.stat().st_size,'youtubeUrl':None,'provenance':DATA['provenance']}
(OUT/'VIDEO_VALIDATION_EN.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result),flush=True)
