const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/assets/ludus-practice');
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
assert.equal(m.assetVersion,'ludus-empty-yard-crowd-v4-20261026');
assert.equal(m.frameCount,4);assert.equal(m.frameWidth,467);assert.equal(m.frameHeight,187);
assert.deepEqual(m.order,[0,1,2,3,2,1]);
assert.deepEqual(m.targetDraw,{x:796,y:18,width:358,height:143});
function dims(b){
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
 const type=b.toString('ascii',12,16);
 if(type==='VP8X')return [1+b[24]+(b[25]<<8)+(b[26]<<16),1+b[27]+(b[28]<<8)+(b[29]<<16)];
 if(type==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
 if(type==='VP8L'){const n=b.readUInt32LE(21);return [(n&0x3fff)+1,((n>>14)&0x3fff)+1];}
 throw Error('Unexpected WebP type '+type);
}
for(const [n,v] of Object.entries(m.assets)){
 const b=fs.readFileSync(path.join(dir,n));
 assert.equal(b.length,v.size,n+' size');
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),v.sha256,n+' hash');
}
assert.deepEqual(dims(fs.readFileSync(path.join(dir,m.background))),[1280,720]);
assert.deepEqual(dims(fs.readFileSync(path.join(dir,m.atlas))),[467*4,187]);
const src=fs.readFileSync(path.join(root,'public/ludus-practice.js'),'utf8');
assert.match(src,/yard-empty-v4-game\.webp/);
assert.match(src,/crowdAtlas,frame\*467,0,467,187,796,18,358,143/);
assert.match(src,/Math\.floor\(spectatorClock\/\.33\)/);
assert.match(src,/order=\[0,1,2,3,2,1\]/);
assert.match(src,/reduced\?0:order/);
assert.match(src,/if\(!battle\.paused\)\{spectatorClock\+=realDt/);
assert.doesNotMatch(src,/drawImage\(crowdAtlas,frame\*462/);
new Function(src);
console.log('PASS: V4 audience-only atlas, truly static empty yard, image SHA256, dimensions, paused/reduced motion playback');
