// Optional real Chromium/WebGL smoke test. Executed by GitHub Actions.
// Captures screenshots of each dimension for visual review.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({
  headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist',
    '--disable-dev-shm-usage','--no-sandbox']
});
const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});
const warnings=[],errors=[];
page.on('console',msg=>{
  if(msg.type()==='error') errors.push(msg.text());
  if(/THREE\.WebGLProgram|shader error|glsl compile/i.test(msg.text())) warnings.push(msg.text());
});
page.on('pageerror',e=>errors.push(e.message));
mkdirSync('browser-artifacts',{recursive:true});
try{
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2500);
  const gl=await page.evaluate(()=>{
    const canvas=document.querySelector('canvas#space');
    if(!canvas)return {hasCanvas:false};
    const ctx=canvas.getContext('webgl2')||canvas.getContext('webgl');
    return {
      hasCanvas:true,hasContext:!!ctx,
      hasWebGL:document.body.classList.contains('has-webgl'),
      width:canvas.width,height:canvas.height
    };
  });
  assert.equal(gl.hasCanvas,true);
  assert.equal(gl.hasContext,true,'Se requiere un contexto WebGL en Chromium de CI');
  assert.equal(gl.hasWebGL,true,'Three.js no pudo inicializarse');
  for(let level=0;level<4;level++){
    await page.evaluate(level=>{
      const stage=document.getElementById('tunel-'+level);
      const top=stage.getBoundingClientRect().top+scrollY;
      document.documentElement.style.scrollBehavior='auto';
      scrollTo(0,top+stage.offsetHeight*.51);
    },level);
    await page.waitForTimeout(1300);
    const title=await page.locator('#portal-stop-title').textContent();
    assert.ok(title?.includes(['Luz','Fuego','Sombras','Cosmos'][level]),'Portal equivocado');
    assert.equal(await page.locator('#portal-stop').isVisible(),true);
    const shot=await page.locator('#space').screenshot({timeout:30000});
    writeFileSync('browser-artifacts/dimension-'+level+'.png',shot);
    assert.ok(shot.length>15000,'El dibujo WebGL no debe estar vacío');
  }
  assert.equal(warnings.length,0,'Compilación de shaders: '+warnings.join('\n'));
  const fatal=errors.filter(e=>/THREE\.WebGLProgram|TypeError|ReferenceError|SyntaxError|Cannot read properties/.test(e));
  assert.equal(fatal.length,0,'Errores graves durante el renderizado: '+fatal.join('\n'));
  console.log('Chrome WebGL OK: capturas de 4 dimensiones, consola y secuencias sin errores fatales.');
}finally{
  await browser.close();
}
