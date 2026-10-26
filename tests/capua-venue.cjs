const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/assets/capua');
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
assert.equal(m.version,'capua-second-image-animated-spectators-fast-v3-20261026');
assert.equal(m.frameMs,190);
assert.equal(m.cheerSpeedMultiplier,1.84);
assert.equal(m.noDuplicateTiles,true);
assert.deepEqual(m.audienceZones,['west_citizens','west_elites','center_west','center_east','east_citizens']);
assert.deepEqual(m.loopOrder,[0,1,2,3,2,1]);
const dim=b=>{assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');const t=b.toString('ascii',12,16);if(t==='VP8X')return [1+b[24]+b[25]*256+b[26]*65536,1+b[27]+b[28]*256+b[29]*65536];if(t==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];throw Error(t)};
for(const [name,asset] of Object.entries(m.assets)){const b=fs.readFileSync(path.join(dir,name));assert.equal(b.length,asset.size);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),asset.sha256);}
assert.deepEqual(dim(fs.readFileSync(path.join(dir,m.background))),[1672,941]);
assert.deepEqual(dim(fs.readFileSync(path.join(dir,m.atlas))),[6688,264]);
const code=fs.readFileSync(path.join(root,'public/capua-venue.js'),'utf8');new Function(code);
assert.match(code,/yard\.src=source\+'capua-sd-arena-selected\.webp/);
assert.match(code,/ctx\.drawImage\(audience,frame\*1672,0,1672,264,x,y\+78\*scale,width,264\*scale\)/);
assert.doesNotMatch(code,/for\(const position of \[-10,552,1114\]\)/);
assert.match(code,/chosen!=='capua'/);
assert.match(code,/order=\[0,1,2,3,2,1\]/);
assert.match(code,/Math\.floor\(Math\.max\(0,t\)\/\.19\)/);
assert.doesNotMatch(code,/Math\.floor\(Math\.max\(0,t\)\/\.35\)/);
assert.match(code,/motionOff\?0:order/);
assert.match(fs.readFileSync(path.join(root,'public/index.html'),'utf8'),/capua-venue\.js\?v=capua-sd-cheer-fast-v3-20261026/);
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
assert.match(html,/id="arenaVenueToggle"/);assert.match(html,/CapuaVenue\?\.draw/);
assert.match(html,/assets\/new-era\/arena\.webp/);
// Single duels and non-5v5 squad modes can still select the Capua venue.
const squad=fs.readFileSync(path.join(root,'public','squad-arena.js'),'utf8');
assert.match(squad,/CapuaVenue\?\.draw/);new Function(squad);
// In 5v5 the two depth lanes require the original Colosseum floor geometry.
const coop=fs.readFileSync(path.join(root,'public','arena-coop.js'),'utf8');
assert.doesNotMatch(coop,/CapuaVenue\?\.draw/);
assert.match(coop,/bg\.src='assets\/new-era\/arena\.webp'/);
assert.match(coop,/bg\.naturalHeight\*\.76/);
assert.match(html,/arena-coop\.js\?v=colosseum-only-5v5-v78/);
new Function(coop);
console.log('CAPUA_SECOND_SD_PASS: Capua remains in duels/squad; 5v5 Colosseum depth-lane background restored');
