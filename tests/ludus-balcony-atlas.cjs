const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/assets/ludus-practice');
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
assert.equal(m.frameCount,4);assert.equal(m.frameWidth,553);assert.equal(m.frameHeight,149);
function dims(b){assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');const t=b.toString('ascii',12,16);
if(t==='VP8X')return [1+b[24]+(b[25]<<8)+(b[26]<<16),1+b[27]+(b[28]<<8)+(b[29]<<16)];
if(t==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];throw Error('Unsupported WebP header '+t);}
for(const [n,v] of Object.entries(m.assets)){const b=fs.readFileSync(path.join(dir,n));assert.equal(b.length,v.size);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),v.sha256);}
assert.deepEqual(dims(fs.readFileSync(path.join(dir,m.background))),[1280,720]);
assert.deepEqual(dims(fs.readFileSync(path.join(dir,m.atlas))),[2212,149]);
const script=fs.readFileSync(path.join(root,'public/ludus-practice.js'),'utf8');
assert.match(script,/spectatorClock\s*\+=\s*realDt/);assert.match(script,/crowdAtlas,frame\*553,0,553,149/);
assert.match(script,/if\(!yardAssetFailed&&crowdAtlas/);assert.match(script,/Math\.floor\(spectatorClock\/0\.29\)%4/);
new Function(script);console.log('PASS: cropped 4-frame audience, paused clock, WebP size/checksum and static background');