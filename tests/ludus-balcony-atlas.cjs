const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/assets/ludus-practice');
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
assert.equal(m.assetVersion,'ludus-capua-stable-full-balcony-v5-20261026');
assert.equal(m.frameCount,4);assert.equal(m.frameWidth,480);assert.equal(m.frameHeight,225);
assert.deepEqual(m.order,[0,1,2,3,2,1]);assert.deepEqual(m.targetDraw,{x:760,y:0,width:480,height:225});
function dims(b){assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');const t=b.toString('ascii',12,16);
if(t==='VP8X')return [1+b[24]+(b[25]<<8)+(b[26]<<16),1+b[27]+(b[28]<<8)+(b[29]<<16)];
if(t==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];
if(t==='VP8L'){const n=b.readUInt32LE(21);return [(n&16383)+1,((n>>14)&16383)+1];}throw Error('Unexpected WebP type '+t);}
for(const [n,v] of Object.entries(m.assets)){const b=fs.readFileSync(path.join(dir,n));assert.equal(b.length,v.size,n);
assert.equal(crypto.createHash('sha256').update(b).digest('hex'),v.sha256,n);}
assert.deepEqual(dims(fs.readFileSync(path.join(dir,m.background))),[1280,720]);
assert.deepEqual(dims(fs.readFileSync(path.join(dir,m.atlas))),[1920,225]);
const src=fs.readFileSync(path.join(root,'public/ludus-practice.js'),'utf8');
assert.match(src,/crowdAtlas,frame\*480,0,480,225,760,0,480,225/);
assert.match(src,/crowdAtlas\.naturalWidth===1920&&crowdAtlas\.naturalHeight===225/);
assert.match(src,/Math\.floor\(spectatorClock\/\.33\)/);
assert.match(src,/order=\[0,1,2,3,2,1\]/);
assert.match(src,/reduced\?0:order/);
assert.match(src,/if\(!battle\.paused\)\{spectatorClock\+=realDt/);
assert.doesNotMatch(src,/crowdAtlas,frame\*467,0,467,187/);
new Function(src);console.log('PASS: single 4f Capua balcony, lossless art, checksums, and pause-aware render');