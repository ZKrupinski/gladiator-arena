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
assert.match(code,/chosen==='colosseum'/);
assert.match(code,/frameOrder=\[0,1,2,3,2,1\]/);
assert.match(code,/Math\.floor\(t\/\.19\)/);
assert.doesNotMatch(code,/Math\.floor\(Math\.max\(0,t\)\/\.35\)/);
assert.match(code,/reduced\(\)\?0:frameOrder/);
assert.match(fs.readFileSync(path.join(root,'public/index.html'),'utf8'),/capua-venue\.js\?v=capua-night-crowd-v4-20261026/);
assert.match(code,/capua-night-original\\.png/);
assert.match(code,/const choices=\\['capua','capua-night','colosseum'\\]/);
assert.match(code,/function nextMatch\\(\\)/);
assert.match(code,/function buildNightFrames\\(\\)/);
assert.match(code,/nightFrames\\[frame\\]/);
assert.match(code,/const storageKey='spartacus-arena-venue-v4'/);
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
assert.match(html,/id="arenaVenueToggle"/);assert.match(html,/CapuaVenue\?\.draw/);
assert.match(html,/CapuaVenue\?\.nextMatch/);
assert.match(html,/랜덤/);
assert.match(fs.readFileSync(path.join(root,'public/squad-arena.js'),'utf8'),/CapuaVenue\?\.nextMatch/);
assert.match(html,/assets\/new-era\/arena\.webp/);
// Single duels and non-5v5 squad modes can still select the Capua venue.
const squad=fs.readFileSync(path.join(root,'public','squad-arena.js'),'utf8');
assert.match(squad,/CapuaVenue\?\.draw/);new Function(squad);
// In 5v5 the two depth lanes require the original Colosseum floor geometry.
const coop=fs.readFileSync(path.join(root,'public','arena-coop.js'),'utf8');
assert.doesNotMatch(coop,/CapuaVenue\?\.draw/);
assert.match(coop,/bg\.src='assets\/new-era\/arena\.webp'/);
assert.match(coop,/bg\.naturalHeight\*\.76/);
assert.match(html,/arena-coop\.js\?v=corpse-prone-v81/);
new Function(coop);
const vm=require('node:vm'),coop2=fs.readFileSync(path.join(root,'public','arena-coop.js'),'utf8');
const sandbox={window:{}};vm.runInNewContext(coop2,sandbox);
const perspectiveScale=sandbox.window.ArenaCoop.perspectiveScale;
const near=(v,e)=>assert.ok(Math.abs(v-e)<1e-9,'expected '+e+' got '+v);
near(perspectiveScale(395),.76);near(perspectiveScale(535),.99);near(perspectiveScale(675),1.22);
near(perspectiveScale(0),.76);near(perspectiveScale(999),1.22);
for(let y=396;y<=675;y++)assert.ok(perspectiveScale(y)>perspectiveScale(y-1),'depth increases smoothly with Y');
assert.match(coop2,/ctx\.translate\(u\.x\+flightX,u\.y\+flightY\*depth\)/);
assert.match(coop2,/ctx\.scale\(depth,depth\)/);
assert.match(coop2,/const z=\.60,depth=perspectiveScale\(u\.y\)/);
assert.match(coop2,/bg\.src='assets\/new-era\/arena\.webp'/);
assert.doesNotMatch(coop2,/CapuaVenue\?\.draw/);
assert.match(html,/arena-coop\.js\?v=corpse-prone-v81/);
console.log('COOP_PERSPECTIVE_PASS: continuous foot-anchored 0.76-1.22 depth scaling');

// Regression: older ten-cell Retiarius graphics must not leave upright corpses in 5v5.
const deathUnit={dead:true,deathAt:0,flight:{at:0,duration:1.16}};
const corpseFall=sandbox.window.ArenaCoop.corpseFall;
near(corpseFall({dead:false},10),0);
near(corpseFall(deathUnit,0),0);
near(corpseFall(deathUnit,1.16),1);
near(corpseFall(deathUnit,10),1);
near(corpseFall({dead:true,deathAt:0},1),1);
for(let t=0;t<=1.16;t+=.02){
 assert.ok(corpseFall(deathUnit,t)>=0&&corpseFall(deathUnit,t)<=1);
}
assert.match(coop2,/const pose=u\.dead\?'hit'/);
assert.match(coop2,/const tick=u\.dead\?0/);
assert.match(coop2,/ctx\.rotate\(-Math\.PI\*\.5\*corpseFall\(u,sim\.time\)\)/);
assert.match(coop2,/const motion=u\.dead\?\{x:0,y:0\}/);
assert.match(html,/arena-coop\.js\?v=corpse-prone-v81/);
assert.match(html,/hero\.appearance==='legacy'[\s\S]{0,120}death:9/);
console.log('COOP_CORPSE_PASS: legacy Retiarius and all 5v5 deaths fall sideways, freeze after landing');

console.log('CAPUA_SECOND_SD_PASS: Capua remains in duels/squad; 5v5 Colosseum depth-lane background restored');
