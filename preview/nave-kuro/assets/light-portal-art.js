// Portal celestial generado en Canvas: no utiliza fotografías ni archivos de imagen.
export function createCelestialTexture(THREE) {
  const canvas=document.createElement('canvas');
  canvas.width=704;canvas.height=1040;
  const ctx=canvas.getContext('2d');
  const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,PI=Math.PI;
  let seed=1734;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function ellipse(x,y,rx,ry,color,line=0,blur=0){
    ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,PI*2);
    if(blur){ctx.shadowColor=color;ctx.shadowBlur=blur;}
    if(line){ctx.lineWidth=line;ctx.strokeStyle=color;ctx.stroke();}
    else{ctx.fillStyle=color;ctx.fill();}
    ctx.restore();
  }
  function cloud(x,y,rw,rh,alpha=1){
    ctx.save();ctx.translate(x,y);ctx.scale(rw,rh);
    const g=ctx.createRadialGradient(-.17,-.24,.04,0,0,1);
    g.addColorStop(0,'rgba(255,255,251,'+(.86*alpha)+')');
    g.addColorStop(.43,'rgba(252,249,237,'+(.73*alpha)+')');
    g.addColorStop(.69,'rgba(219,233,246,'+(.34*alpha)+')');
    g.addColorStop(1,'rgba(188,210,240,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,PI*2);ctx.fill();ctx.restore();
  }
  function flare(x,y,size,opacity=1){
    ctx.save();ctx.globalAlpha=opacity;ctx.globalCompositeOperation='screen';
    const gr=ctx.createRadialGradient(x,y,0,x,y,size*3);
    gr.addColorStop(0,'rgba(255,255,255,.95)');
    gr.addColorStop(.12,'rgba(255,237,166,.65)');
    gr.addColorStop(1,'rgba(255,203,92,0)');
    ctx.fillStyle=gr;ctx.fillRect(x-size*3,y-size*3,size*6,size*6);
    ctx.strokeStyle='#fff9df';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x-size*1.65,y);ctx.lineTo(x+size*1.65,y);
    ctx.moveTo(x,y-size*1.9);ctx.lineTo(x,y+size*1.9);ctx.stroke();ctx.restore();
  }
  function tower(x,base,width,height,tone=0){
    const tip=base-height;ctx.save();
    const g=ctx.createLinearGradient(x-width,0,x+width,0);
    g.addColorStop(0,tone?'#b59a5c':'#a6bfd0');
    g.addColorStop(.25,'#f3e0aa');g.addColorStop(.51,'#fff7df');
    g.addColorStop(.78,'#d0b576');g.addColorStop(1,'#ad965c');
    ctx.fillStyle=g;ctx.beginPath();
    ctx.moveTo(x-width,base);ctx.lineTo(x-width*.84,tip+height*.27);
    ctx.lineTo(x-width*.33,tip+height*.20);ctx.lineTo(x,tip);
    ctx.lineTo(x+width*.33,tip+height*.20);ctx.lineTo(x+width*.84,tip+height*.27);
    ctx.lineTo(x+width,base);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,248,208,.8)';ctx.lineWidth=Math.max(1,width*.12);
    ctx.beginPath();ctx.moveTo(x,tip+height*.21);ctx.lineTo(x,base);ctx.stroke();
    ctx.strokeStyle='rgba(125,155,184,.30)';ctx.lineWidth=Math.max(1,width*.08);
    ctx.beginPath();ctx.moveTo(x-width*.45,tip+height*.31);ctx.lineTo(x-width*.45,base);ctx.stroke();
    for(let j=0;j<3;j++){
      const yy=tip+height*(.48+j*.15);
      ctx.fillStyle='rgba(151,193,213,.65)';
      ctx.fillRect(x-width*.23,yy,width*.46,Math.max(2,width*.25));
    }ctx.restore();
  }
  ctx.clearRect(0,0,w,h);
  // Interior ovalado recortado; nunca usar un centro negro o un remolino.
  ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,294,470,0,0,PI*2);ctx.clip();
  const sky=ctx.createLinearGradient(0,90,0,1030);
  sky.addColorStop(0,'#315785');sky.addColorStop(.24,'#82bfe9');
  sky.addColorStop(.45,'#d6eff8');sky.addColorStop(.60,'#fff2cc');
  sky.addColorStop(.84,'#dbeaf5');sky.addColorStop(1,'#eef9ff');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const sun=ctx.createRadialGradient(cx,462,6,cx,462,330);
  sun.addColorStop(0,'rgba(255,255,255,1)');
  sun.addColorStop(.12,'rgba(255,252,218,.96)');
  sun.addColorStop(.32,'rgba(255,235,177,.55)');
  sun.addColorStop(1,'rgba(255,231,198,0)');
  ctx.fillStyle=sun;ctx.fillRect(0,100,w,680);
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<19;i++){
    const a=-PI*.94+(i/18)*PI*.90;
    const left=cx+Math.sin(a)*480,top=465-Math.cos(a)*480;
    const left2=cx+Math.sin(a+.025)*480,top2=465-Math.cos(a+.025)*480;
    ctx.fillStyle='rgba(255,244,202,'+(.035+rand()*.08)+')';
    ctx.beginPath();ctx.moveTo(cx,470);ctx.lineTo(left,top);
    ctx.lineTo(left2,top2);ctx.closePath();ctx.fill();
  }ctx.restore();
  for(let i=0;i<32;i++){
    cloud(52+rand()*600,345+rand()*185,38+rand()*79,22+rand()*38,.24+rand()*.42);
  }
  for(const [x,y,wide] of [[175,580,105],[352,594,215],[540,581,100]]){
    const gr=ctx.createLinearGradient(0,y-30,0,y+86);
    gr.addColorStop(0,'#fff8d6');gr.addColorStop(.17,'#e1d1a5');
    gr.addColorStop(.45,'#8ba1ba');gr.addColorStop(1,'rgba(80,100,140,0)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(x-wide*.5,y);
    ctx.lineTo(x+wide*.5,y);ctx.lineTo(x+wide*.31,y+17);
    ctx.lineTo(x+wide*.08,y+77);ctx.lineTo(x-wide*.08,y+77);
    ctx.lineTo(x-wide*.31,y+17);ctx.closePath();ctx.fill();
  }
  ctx.fillStyle='#efe6c7';ctx.fillRect(247,453,210,130);
  ctx.fillStyle='#f9f1dc';ctx.fillRect(277,424,150,132);
  for(let i=0;i<9;i++)tower(180+i*43,573,13+(i%3)*3,123+(i%4)*24,1);
  tower(352,566,26,306,1);tower(294,559,21,237,1);
  tower(410,559,21,237,1);tower(237,567,19,175,1);tower(466,567,19,175,1);
  for(let i=0;i<14;i++){
    const x=250+i*15;
    ctx.fillStyle=i%2?'rgba(116,175,216,.66)':'rgba(255,250,230,.83)';
    ctx.fillRect(x,520,5,40);
  }
  // Camino blanco y dorado que converge en el palacio.
  const road=ctx.createLinearGradient(0,570,0,1040);
  road.addColorStop(0,'#fffdf1');road.addColorStop(.3,'#ffeec0');
  road.addColorStop(.58,'#fff9e4');road.addColorStop(1,'#d3e5f3');
  ctx.fillStyle=road;ctx.beginPath();ctx.moveTo(335,557);ctx.lineTo(369,557);
  ctx.lineTo(583,1040);ctx.lineTo(121,1040);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,214,103,.92)';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(334,557);ctx.lineTo(115,1040);
  ctx.moveTo(370,557);ctx.lineTo(590,1040);ctx.stroke();
  ctx.strokeStyle='rgba(212,170,93,.52)';ctx.lineWidth=2;
  for(let i=1;i<11;i++){
    const k=i/11,yy=565+470*k*k,half=21+215*k*k;
    ctx.beginPath();ctx.moveTo(cx-half,yy);ctx.lineTo(cx+half,yy);ctx.stroke();
  }
  for(let i=0;i<62;i++){
    const x=rand()*w,y=585+rand()*440;
    const edgeFade=Math.min(1,Math.abs(x-cx)/185+.06);
    cloud(x,y,45+rand()*105,20+rand()*54,(.30+rand()*.46)*edgeFade);
  }
  const shine=ctx.createLinearGradient(cx,585,cx,1030);
  shine.addColorStop(0,'rgba(255,255,255,.18)');
  shine.addColorStop(.7,'rgba(255,245,195,.24)');
  shine.addColorStop(1,'rgba(255,255,255,.45)');
  ctx.fillStyle=shine;ctx.beginPath();ctx.moveTo(348,584);ctx.lineTo(361,584);
  ctx.lineTo(430,1040);ctx.lineTo(276,1040);ctx.closePath();ctx.fill();
  ctx.restore();
  // Aros concéntricos de oro con filigrana y pequeñas joyas.
  const strokeRing=(rx,ry,lw,color,blur=0)=>ellipse(cx,cy,rx,ry,color,lw,blur);
  strokeRing(292,468,26,'rgba(190,117,35,.48)',22);
  strokeRing(295,471,16,'#a57439',7);
  strokeRing(285,460,12,'#fff2be',22);
  strokeRing(283,456,4,'#fffef6',18);
  strokeRing(267,443,13,'#ae773d',3);
  strokeRing(261,437,8,'#fff1b0',18);
  strokeRing(254,429,3,'#ffffff',12);
  strokeRing(244,418,8,'rgba(255,236,159,.5)',22);
  for(let i=0;i<56;i++){
    const theta=i*2*PI/56;
    const x=cx+Math.cos(theta)*275,y=cy+Math.sin(theta)*452;
    ctx.save();ctx.translate(x,y);ctx.rotate(theta+PI/2);
    ctx.fillStyle=i%7===0?'#fffef6':'#ffe1a1';
    if(i%7===0){
      ctx.shadowColor='#fff1a7';ctx.shadowBlur=14;
      ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(5,0);
      ctx.lineTo(0,12);ctx.lineTo(-5,0);ctx.closePath();ctx.fill();
    }else ctx.fillRect(-1.5,-7,3,14);
    ctx.restore();
  }
  for(const [x,y,size] of [[cx,63,30],[cx,976,26],[82,520,22],[622,520,22]]){
    ctx.save();ctx.translate(x,y);ctx.shadowColor='#ffe6a0';ctx.shadowBlur=22;
    ctx.fillStyle='#dcae55';ctx.beginPath();ctx.moveTo(0,-size*1.7);
    ctx.lineTo(size*.33,-size*.37);ctx.lineTo(size*1.1,0);
    ctx.lineTo(size*.33,size*.37);ctx.lineTo(0,size*1.7);
    ctx.lineTo(-size*.33,size*.37);ctx.lineTo(-size*1.1,0);
    ctx.lineTo(-size*.33,-size*.37);ctx.closePath();ctx.fill();
    ctx.fillStyle='#faffff';ctx.beginPath();ctx.moveTo(0,-size*.76);
    ctx.lineTo(size*.22,0);ctx.lineTo(0,size*.76);
    ctx.lineTo(-size*.22,0);ctx.closePath();ctx.fill();ctx.restore();
  }
  for(let i=0;i<68;i++){
    const a=rand()*PI*2,rx=238+rand()*90,ry=410+rand()*85;
    flare(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,1.8+rand()*4.8,.30+rand()*.65);
  }
  flare(cx,66,26,.88);flare(80,520,14,.8);flare(625,520,14,.8);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=2;
  return texture;
}
