/* SPARTACUS ART: true 192x192 raster equipment icons from reviewed Roman atlases.
 * Every catalogue item is assigned a distinct tile; save data remains item-id based.
 * Asset failures keep legacy artwork rather than showing broken inventory images.
 */
(function(root){'use strict';
const catalog=root.ArenaGearCatalog;
if(!catalog)throw Error('Gear catalogue must be loaded before bitmap atlases');
const atlases={
  "conquered": {
    "src": "assets/gear-atlas/conquered_gladiators_atlas_v3_192.webp",
    "columns": 10,
    "rows": 7
  },
  "rarities": {
    "src": "assets/gear-atlas/gladiator_rarities_atlas_v3_192.webp",
    "columns": 12,
    "rows": 6
  }
};
const mapping={
  "wood": [
    "conquered",
    20
  ],
  "iron": [
    "conquered",
    1
  ],
  "bronze_sword": [
    "rarities",
    1
  ],
  "serrated_gladius": [
    "conquered",
    3
  ],
  "falcata": [
    "rarities",
    15
  ],
  "thraex_sica": [
    "conquered",
    4
  ],
  "trainer_blade": [
    "rarities",
    24
  ],
  "venatio_blade": [
    "conquered",
    25
  ],
  "blood_oath": [
    "rarities",
    37
  ],
  "dusk_crescent": [
    "conquered",
    17
  ],
  "execution_greatsword": [
    "rarities",
    48
  ],
  "red_fang": [
    "rarities",
    61
  ],
  "laurel_blade": [
    "rarities",
    50
  ],
  "imperial_aquila": [
    "rarities",
    60
  ],
  "shield": [
    "rarities",
    7
  ],
  "wooden_scutum": [
    "conquered",
    30
  ],
  "aegis_rome": [
    "rarities",
    65
  ],
  "tunic": [
    "rarities",
    10
  ],
  "leather": [
    "conquered",
    50
  ],
  "mars_relic": [
    "rarities",
    71
  ],
  "wolves_oath": [
    "conquered",
    26
  ],
  "mirage_sica": [
    "rarities",
    38
  ],
  "sanguine_edge": [
    "rarities",
    49
  ],
  "mars_judgement": [
    "rarities",
    62
  ],
  "parry_wolf": [
    "conquered",
    36
  ],
  "aegis_rebirth": [
    "rarities",
    54
  ],
  "trainer_favor": [
    "conquered",
    55
  ],
  "laurel_gambit": [
    "conquered",
    58
  ],
  "lionheart_armor": [
    "rarities",
    57
  ],
  "emperors_miracle": [
    "rarities",
    70
  ],
  "worn_cloth_hood": [
    "conquered",
    40
  ],
  "numidian_headwrap": [
    "conquered",
    41
  ],
  "gaul_iron_cap": [
    "conquered",
    42
  ],
  "thracian_plume": [
    "conquered",
    43
  ],
  "celtic_horn_helm": [
    "conquered",
    44
  ],
  "retiarius_mesh_helm": [
    "conquered",
    45
  ],
  "hispanic_falcon_mask": [
    "conquered",
    46
  ],
  "minotaur_helm": [
    "conquered",
    47
  ],
  "champion_crested_helm": [
    "conquered",
    48
  ],
  "apollos_radiance_helm": [
    "conquered",
    49
  ],
  "slave_wrist_wrap": [
    "conquered",
    60
  ],
  "pit_leather_guard": [
    "conquered",
    61
  ],
  "bronze_wrist_plates": [
    "conquered",
    62
  ],
  "numidian_hunter_guard": [
    "conquered",
    63
  ],
  "thracian_layered_guard": [
    "conquered",
    64
  ],
  "retiarius_galerus": [
    "conquered",
    65
  ],
  "gaul_lion_plates": [
    "conquered",
    66
  ],
  "consuls_vambraces": [
    "conquered",
    67
  ],
  "blood_oath_gauntlet": [
    "conquered",
    68
  ],
  "emperor_right_hand": [
    "conquered",
    69
  ],
  "legion_blade": [
    "rarities",
    36
  ],
  "champion_cutter": [
    "rarities",
    39
  ],
  "iron_scutum": [
    "conquered",
    33
  ],
  "reinforced_scutum": [
    "conquered",
    34
  ],
  "agile_buckler": [
    "rarities",
    17
  ],
  "trainer_shield": [
    "rarities",
    29
  ],
  "mirror_shield": [
    "rarities",
    30
  ],
  "venatio_shield": [
    "rarities",
    31
  ],
  "champion_wall": [
    "rarities",
    41
  ],
  "legion_wall": [
    "rarities",
    42
  ],
  "blood_crest": [
    "rarities",
    43
  ],
  "imperial_guard": [
    "rarities",
    53
  ],
  "laurel_shield": [
    "rarities",
    55
  ],
  "bronze_cuirass": [
    "conquered",
    53
  ],
  "iron_cuirass": [
    "conquered",
    54
  ],
  "scale_armor": [
    "rarities",
    20
  ],
  "trainer_armor": [
    "rarities",
    32
  ],
  "venatio_hide": [
    "rarities",
    33
  ],
  "arena_parade": [
    "rarities",
    34
  ],
  "legion_armor": [
    "rarities",
    44
  ],
  "elite": [
    "rarities",
    45
  ],
  "blood_armor": [
    "rarities",
    46
  ],
  "black_war": [
    "rarities",
    56
  ],
  "laurel_armor": [
    "rarities",
    58
  ],
  "arena_fortune": [
    "rarities",
    25
  ],
  "thorax_reflector": [
    "conquered",
    37
  ]
};
let status='loading',error=null;
const drawn=new Map();
function loadImage(url){
 return new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>resolve(image);
  image.onerror=()=>reject(new Error('GEAR_ATLAS_IMAGE_MISSING '+url));
  image.src=url;
 });
}
async function install(){
 try{
  const [conquered,rarities]=await Promise.all([
   loadImage(atlases.conquered.src),loadImage(atlases.rarities.src)
  ]);
  const pictures={conquered,rarities};
  for(const [sheet,spec] of Object.entries(atlases)){
   if(pictures[sheet].naturalWidth!==spec.columns*192||pictures[sheet].naturalHeight!==spec.rows*192){
    throw Error('GEAR_ATLAS_INVALID_GRID '+sheet);
   }
  }
  // Generate true WebP bitmap icon images once and cache by tile.
  // All UI (inventory, equipped slot and match rewards) uses item.icon directly.
  for(const item of catalog.items){
   const ref=mapping[item.id];if(!ref)continue;
   const [sheet,index]=ref,spec=atlases[sheet],key=sheet+':'+index;
   if(!drawn.has(key)){
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('BITMAP_CANVAS_UNAVAILABLE');
    const sx=(index%spec.columns)*192,sy=Math.floor(index/spec.columns)*192;
    ctx.drawImage(pictures[sheet],sx,sy,192,192,0,0,192,192);
    drawn.set(key,canvas.toDataURL('image/webp',.96));
   }
   item.atlasSheet=sheet;item.atlasIndex=index;
   item.legacyIcon=item.icon;
   item.icon=drawn.get(key);
  }
  status='ready';
  root.dispatchEvent(new Event('arena-gear-atlas-ready'));
 }catch(e){
  status='error';error=String(e);console.warn('Roman bitmap atlas fallback',e);
  root.dispatchEvent(new Event('arena-gear-atlas-error'));
 }
 return status;
}
const ready=install();
root.ArenaGearBitmap={atlases,mapping,ready,status:()=>status,error:()=>error,renderedCount:()=>drawn.size};
})(globalThis);
