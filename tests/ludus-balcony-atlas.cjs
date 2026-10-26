const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/assets/ludus-practice');
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
assert.equal(m.frameCount,4);assert.equal(m.frameWidth,462);assert.equal(m.frameHeight,217);
assert.deepEqual(m.order,[0,1,2,3,2,1]);assert.deepEqual(m.targetDraw,{x:746,y:15,width:462,height:217});
function dimensions(b){
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
 const t=b.toString('ascii',12,16);
 if(t==='VP8X')return [1+b[24]+(b[25]<<8)+(b[26]<<16),1+b[27]+(b[28]<<8)+(b[29]<<16)];
 if(t==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];
 throw Error('Unsupported WebP header '+t);
}
for(const [n,v] of Object.entries(m.assets)){
 const b=fs.readFileSync(path.join(dir,n));assert.equal(b.length,v.size);
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),v.sha256);
}
assert.deepEqual(dimensions(fs.readFileSync(path.join(dir,m.background))),[1280,720]);
assert.deepEqual(dimensions(fs.readFileSync(path.join(dir,m.atlas))),[462*4,217]);
const script=fs.readFileSync(path.join(root,'public/ludus-practice.js'),'utf8');
assert.match(script,/spectatorClock\s*\+=\s*realDt/);
assert.match(script,/crowdAtlas,frame\*462,0,462,217,746,15,462,217/);
assert.match(script,/Math\.floor\(spectatorClock\/\.33\)/);
assert.match(script,/order=\[0,1,2,3,2,1\]/);
assert.match(script,/reduced\?0:order/);
assert.match(script,/if\(!yardAssetFailed&&crowdAtlas/);
assert.match(script,/if\(!battle\.paused\)\{spectatorClock\+=realDt/);
assert.doesNotMatch(script,/drawImage\(crowdAtlas,frame\*553/);
new Function(script);console.log('PASS: padded whole-body spectators, 6-beat ping-pong, 4-frame atlas checksum, immutable still yard');
