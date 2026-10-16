const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync, statSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..', 'public');
const load = name => readFileSync(join(root, name), 'utf8');
const html = load('index.html');
const scene = load('ludus-scene.js');
const css = load('ludus-scene.css');

test('Ludus visual screen JS parses and is linked from the game', () => {
  assert.doesNotThrow(() => new Function(scene));
  assert.match(html, /<script src="ludus-scene\.js\?v=\d+"><\/script>/);
  assert.match(html, /ludus-scene\.css\?v=\d+/);
  assert.match(scene, /window\.LudusScene\s*=/);
  assert.match(html, /window\.LudusBridge\s*=/);
});
test('Approved live art is in the repository, not an obsolete PNG reference', () => {
  const imageDir = join(root, 'assets', 'ludus');
  const files = ['ludus_ui.webp','domina_blink.webp',...Array.from({length:6},(_,i)=>`domina_${i}.webp`),...Array.from({length:12},(_,i)=>`fighter_${Math.floor(i/4)}_${i%4}.webp`)];
  for(const f of files){ const file = join(imageDir,f); assert.ok(existsSync(file),`Missing ${f}`); assert.ok(statSync(file).size>1000,`Empty ${f}`); }
  assert.doesNotMatch(scene, /(?:ludus_ui|sprite_sheet)\.png/);
});
test('Career state, transactions, arena, roster and return route are connected', () => {
  const market = load('market-scene.js');
  assert.match(scene, /\[data-roster-count\]/);
  assert.match(scene, /\[data-roster-page\]/);
  assert.match(scene, /a\.state\(\)\.roster/);
  assert.match(scene, /a\.market\(\)/);
  assert.match(scene, /a\.fight\(\)/);
  assert.match(scene, /\.injury/);
  assert.match(market, /gmConfirm/);
  assert.match(html, /window\.LudusScene\?\.open\(\)/);
  assert.match(html, /returnToCareer/);
});
test('Actual roster covers the concept illustration demo portraits', () => {
  assert.match(css,/\.ll-has-art \.ll-bottom \.ll-roster/);
  assert.match(css,/\.ll-hitbuttons button:hover/);
  assert.match(css,/\.ll-wallet/);
});
