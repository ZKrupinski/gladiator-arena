'use strict';
// Browser QA: native dropdown popup palette, legibility and mobile touch size.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=path.resolve('public');
 const server=http.createServer((req,res)=>{
  const requested=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const filepath=path.resolve(root,'.'+requested);
  if(!filepath.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(filepath,(err,data)=>{
   if(err){res.writeHead(404);res.end();return;}
   const ext=path.extname(filepath);
   res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream');
   res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const base='http://127.0.0.1:'+server.address().port+'/tools/practice-scale-calibrator.html';
 const page=await browser.newPage({viewport:{width:1380,height:900}}),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 const inspect=async()=>page.evaluate(()=>{
  const parse=value=>{
   const match=value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
   if(!match)throw Error('Invalid computed color: '+value);
   return match.slice(1,4).map(Number);
  };
  const luminance=c=>{
   const values=c.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});
   return .2126*values[0]+.7152*values[1]+.0722*values[2];
  };
  const contrast=(a,b)=>{const x=luminance(parse(a)),y=luminance(parse(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const all=[...document.querySelectorAll('select')];
  return all.map(select=>{
   const style=getComputedStyle(select), option=select.options[0],optionStyle=option&&getComputedStyle(option);
   return {
    id:select.id||select.name||'unnamed',
    options:select.options.length,
    color:style.color,background:style.backgroundColor,
    optionColor:optionStyle?.color,optionBackground:optionStyle?.backgroundColor,
    selectContrast:contrast(style.color,style.backgroundColor),
    optionContrast:optionStyle?contrast(optionStyle.color,optionStyle.backgroundColor):null,
    scheme:style.colorScheme,fontSize:parseFloat(style.fontSize),
    height:select.getBoundingClientRect().height
   };
  });
 });
 try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.SpartacusScaleStudio && document.querySelector('#actionPose')?.options.length>3 && document.querySelector('#fxKind')?.options.length>3 && document.querySelector('.price-level select')?.options.length>3,null,{timeout:90000});
  const desktop=await inspect();
  assert(desktop.length>=12,'all dynamically populated editor and roster dropdowns available');
  for(const item of desktop){
   assert.equal(item.scheme,'dark','dark native popups: '+item.id);
   assert(item.selectContrast>=7,'closed dropdown must be highly legible: '+JSON.stringify(item));
   assert(item.optionContrast>=7,'expanded native option must be highly legible: '+JSON.stringify(item));
   assert(item.fontSize>=13,'desktop dropdown text readable: '+item.id);
   assert(item.height>=37,'desktop dropdown has usable hit area: '+item.id);
  }
  const action=page.locator('#actionPose');
  await action.focus();
  const focused=await action.evaluate(el=>{
   const s=getComputedStyle(el);return {background:s.backgroundColor,color:s.color,outline:s.outlineStyle,scheme:s.colorScheme};
  });
  assert.equal(focused.scheme,'dark');
  assert.equal(focused.outline,'solid','keyboard focus remains visible');
  await action.press('ArrowDown');
  assert((await action.inputValue()).length>0,'keyboard navigation remains functional');
  await page.setViewportSize({width:390,height:844});
  const mobile=await inspect();
  for(const item of mobile){
   assert(item.fontSize>=16,'mobile dropdown prevents tiny text and unwanted iOS zoom: '+JSON.stringify(item));
   assert(item.height>=43,'mobile tap target comfortable: '+JSON.stringify(item));
   assert(item.optionContrast>=7,'mobile popup colors legible: '+JSON.stringify(item));
  }
  assert.deepEqual(errors,[],'no JavaScript exceptions during dropdown checks');
  console.log('PASS v130: '+desktop.length+' native dropdowns, dark popup options, >=7:1 contrast, keyboard focus and mobile >=16px / >=43px controls');
  console.log(JSON.stringify({examples:desktop.filter(x=>['sort','actionPose','motionKey','fxKind','fxDirection'].includes(x.id)),mobile:mobile.slice(0,3)},null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1});
