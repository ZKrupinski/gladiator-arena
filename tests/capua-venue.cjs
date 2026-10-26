const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),path=require('path');
const root=path.join(__dirname,'..'),dir=path.join(root,'public','assets','capua');
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const dim=b=>{assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');const type=b.toString('ascii',12,16);if(type==='VP8X')return [1+b[24]+b[25]*256+b[26]*65536,1+b[27]+b[28]*256+b[29]*65536];if(type==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];throw Error(type)};
for(const [name,asset] of Object.entries(m.assets)){const bytes=fs.readFileSync(path.join(dir,name));assert.equal(bytes.length,asset.size);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
assert.deepEqual(dim(fs.readFileSync(path.join(dir,'capua-yard.webp'))),[1672,941]);
assert.deepEqual(dim(fs.readFileSync(path.join(dir,'capua-crowd-4f.webp'))),[2172,270]);
const code=fs.readFileSync(path.join(root,'public','capua-venue.js'),'utf8');new Function(code);
assert.match(code,/for\(const position of \[-10,552,1114\]\)/);
assert.match(code,/chosen!=='capua'/);
const index=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
assert.match(index,/id="arenaVenueToggle"/);assert.match(index,/CapuaVenue\?\.draw/);
assert.match(index,/assets\/new-era\/arena\.webp/);
for(const name of ['arena-coop.js','squad-arena.js']){const s=fs.readFileSync(path.join(root,'public',name),'utf8');assert.match(s,/CapuaVenue\?\.draw/);new Function(s);}
console.log('CAPUA_PREVIEW_PASS: native assets, 4 frames, scene selection, old Colosseum preserved, main/squad/coop');