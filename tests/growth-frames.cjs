// Node validation using @napi-rs/canvas; no browser installation required.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {isolate,draw}=require('../public/growth-frames.js');
const dir=path.join(__dirname,'../public/assets/ludus-growth');
const cuts=JSON.parse(fs.readFileSync(path.join(dir,'frame-cuts.json')));
(async()=>{
 let count=0;
 for(const [key,sheet] of Object.entries(cuts.sheets)){
  const png=fs.readFileSync(path.join(dir,key+'.png'));
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'),sheet.sha256);
  const image=await loadImage(png),atlas=isolate(image,sheet,()=>createCanvas(1,1));
  const seen=new Uint8Array(sheet.size[0]*sheet.size[1]);
  for(const spec of sheet.frames){
   const [x,y,w,h]=spec.box;
   assert(w>0&&h>0&&x>=0&&y>=0&&x+w<=sheet.size[0]&&y+h<=sheet.size[1]);
   for(let i=0;i<spec.runs.length;i+=2){
    const offset=spec.runs[i],n=spec.runs[i+1],sy=y+Math.floor(offset/w),sx=x+offset%w;
    for(let j=0;j<n;j++){const p=sy*sheet.size[0]+sx+j;assert.equal(seen[p],0,'source pixel belongs to only one pose');seen[p]=1;}
   }
  }
  for(let i=0;i<12;i++){
   const f=atlas.frames[i],c=f.canvas,a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   let solid=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const alpha=a[(y*c.width+x)*4+3];
    if(x<4||y<4||x>=c.width-4||y>=c.height-4)assert.equal(alpha,0,'transparent sampling gutter');
    if(alpha>24)solid++;
   }
   assert(solid>15000,key+' '+i+' has a complete silhouette');
   const target=createCanvas(1000,600),ctx=target.getContext('2d');
   assert(draw(ctx,atlas,i,250,100,360,360,false,1));
   assert(draw(ctx,atlas,i,250,100,360,360,true,.5));
   count++;
  }
 }
 assert.equal(count,240);assert.equal(draw({},undefined,0,0,0,1,1),false);
 console.log('PASS: 240 isolated canvases, original source hashes, unique pixel ownership, transparent gutters, normal/mirrored draws and fallback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
