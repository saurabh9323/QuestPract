import type {CartoonLesson} from './cartoon-lessons';

export const MOVIE_WIDTH=1100, MOVIE_HEIGHT=720;
type Point={x:number;y:number;w:number;h:number};
// This renderer is shared by the live player and exported video: captions and state match.
export function drawCartoon(ctx:CanvasRenderingContext2D,lesson:CartoonLesson,sceneIndex:number,phase=0,dark=false,reduced=false){
 const scene=lesson.scenes[sceneIndex],W=MOVIE_WIDTH,H=MOVIE_HEIGHT;
 const ink=dark?'#f0f6ff':'#172b42',muted=dark?'#b7c9dc':'#435e77',paper=dark?'#132334':'#f3f8ff',panel=dark?'#20364b':'#ffffff',line=dark?'#536e87':'#b6cbdc',accent=dark?'#bcf77a':'#cefa9a';
 ctx.clearRect(0,0,W,H);ctx.fillStyle=paper;ctx.fillRect(0,0,W,H);
 function box(x:number,y:number,w:number,h:number,fill:string,border=line,r=18){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=border;ctx.lineWidth=2;ctx.stroke()}
 function text(value:string,x:number,y:number,max:number,size=21,color=ink,lines=3){
  ctx.font=`${size>=25?'700':'500'} ${size}px system-ui, sans-serif`;ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='top';
  const words=value.split(/\s+/);let row='',n=0;
  for(let i=0;i<words.length;i++){const next=row?`${row} ${words[i]}`:words[i];if(ctx.measureText(next).width>max&&row){ctx.fillText(row,x,y+n*size*1.35);n++;row=words[i];if(n===lines-1){row=[row,...words.slice(i+1)].join(' ');while(ctx.measureText(row+'…').width>max&&row.length)row=row.slice(0,-1);ctx.fillText(row+'…',x,y+n*size*1.35);return}}else row=next}if(row)ctx.fillText(row,x,y+n*size*1.35);
 }
 text('QUEST90  /  CARTOON CLASSROOM',30,23,800,16,muted,1);
 text(lesson.title,30,53,1035,32,ink,1);
 text(`SCENE ${sceneIndex+1}/${lesson.scenes.length}  ·  ${scene.title}`,30,98,1020,20,muted,1);
 // Pip is an original little robot guide, built from shapes rather than external images.
 const bounce=reduced?0:Math.sin(phase*Math.PI*2)*5,ry=260+bounce;
 ctx.strokeStyle=muted;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(88,ry-63);ctx.lineTo(88,ry-82);ctx.stroke();ctx.fillStyle='#ffb866';ctx.beginPath();ctx.arc(88,ry-88,9,0,Math.PI*2);ctx.fill();
 box(42,ry-60,92,80,accent,'#63805b',20);ctx.fillStyle='#172b42';[67,108].forEach(x=>{ctx.beginPath();ctx.arc(x,ry-29,7,0,Math.PI*2);ctx.fill()});ctx.strokeStyle='#172b42';ctx.lineWidth=3;ctx.beginPath();ctx.arc(87,ry-10,13,0,Math.PI);ctx.stroke();box(57,ry+30,61,63,panel);ctx.strokeStyle=muted;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(56,ry+45);ctx.lineTo(29,ry+60);ctx.moveTo(118,ry+45);ctx.lineTo(153,ry+24);ctx.moveTo(72,ry+94);ctx.lineTo(62,ry+117);ctx.moveTo(103,ry+94);ctx.lineTo(113,ry+117);ctx.stroke();text('Pip',65,ry+133,90,20,muted,1);
 const count=scene.items.length,positions:Point[]=[];
 if(lesson.world==='table'){
  text('FOLLOW THE DATA',220,151,700,16,muted,1);
  scene.items.forEach((_,i)=>positions.push({x:220,y:183+i*73,w:800,h:61}));
 }else if(lesson.world==='stack'){
  scene.items.forEach((_,i)=>positions.push({x:400,y:378-i*71,w:380,h:60}));
  text('TOP = last item added',800,200,240,18,muted,2);
 }else if((lesson.id==='trees-bfs'||lesson.layout==='bfs-tree')){
  // Preserve the actual example topology: A -> B,C and B -> D,E.
  [[580,154],[370,259],[790,259],[260,365],[490,365]].forEach(([x,y])=>positions.push({x,y,w:150,h:65}));
 }else if(lesson.world==='tree'){
  scene.items.forEach((_,i)=>positions.push({x:350+i*65,y:160+i*99,w:540,h:76}));
 }else{
  const cols=lesson.world==='array'?count:count>4?3:count,gap=20,width=Math.min(245,(810-(cols-1)*gap)/cols);
  scene.items.forEach((_,i)=>positions.push({x:220+(i%cols)*(width+gap),y:count>cols?185+Math.floor(i/cols)*137:255,w:width,h:104}));
  text({array:'Inspect each value',queue:'FRONT  →  process in order  →  BACK',city:'Follow the request',factory:'Follow each responsibility',stage:'Watch the state change'}[lesson.world as 'array'|'queue'|'city'|'factory'|'stage']||'',220,158,800,18,muted,1);
 }
 function arrow(a:Point,b:Point,vertical=false){const ax=vertical?a.x+a.w/2:a.x+a.w,ay=vertical?a.y+a.h:a.y+a.h/2,bx=vertical?b.x+b.w/2:b.x,by=vertical?b.y:b.y+b.h/2;ctx.strokeStyle=line;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();const angle=Math.atan2(by-ay,bx-ax);ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-11*Math.cos(angle-.5),by-11*Math.sin(angle-.5));ctx.moveTo(bx,by);ctx.lineTo(bx-11*Math.cos(angle+.5),by-11*Math.sin(angle+.5));ctx.stroke()}
 if((lesson.id==='trees-bfs'||lesson.layout==='bfs-tree'))[[0,1],[0,2],[1,3],[1,4]].forEach(([a,b])=>arrow(positions[a],positions[b],true));
 else if(lesson.world==='tree'&&!((lesson.id==='linux'||lesson.layout==='linux-path')&&sceneIndex===1))positions.slice(1).forEach((p,i)=>arrow(positions[i],p,true));
 else if(['city','factory','queue','stage'].includes(lesson.world))positions.slice(1).forEach((p,i)=>{if(p.y===positions[i].y)arrow(positions[i],p)});
 positions.forEach((p,i)=>{const active=scene.active.includes(i);box(p.x,p.y,p.w,p.h,active?accent:panel,active?'#72964f':line);text(scene.items[i],p.x+16,p.y+14,p.w-32,lesson.world==='table'?22:20,active?'#172b42':ink,3);if(lesson.world==='array')text(`[${i}]`,p.x+10,p.y+p.h+12,p.w,16,muted,1)});
 const focus=scene.active.filter(i=>positions[i]);
 if(focus.length){const t=reduced?1:Math.min(1,phase*2),a=positions[focus[0]],b=positions[focus[focus.length-1]],x=a.x+a.w/2+(b.x+b.w/2-a.x-a.w/2)*t,y=a.y-19+(b.y-a.y)*t;ctx.fillStyle='#f5ac50';ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#734510';ctx.lineWidth=2;ctx.stroke()}
 box(25,493,1050,159,panel);text('PIP EXPLAINS',46,511,980,15,muted,1);text(scene.say,46,541,990,25,ink,3);
 text('Illustration · Read the technical view for exact behavior and limitations.',30,671,1010,16,muted,1);
 ctx.fillStyle=line;ctx.fillRect(0,H-8,W,8);ctx.fillStyle='#88b852';ctx.fillRect(0,H-8,W*((sceneIndex+Math.min(1,phase))/lesson.scenes.length),8);
}
