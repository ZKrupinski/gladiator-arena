#!/usr/bin/env python3
"""Read-only smoke against ACTUAL approved New Champion Murmillo art."""
import json,tempfile
from pathlib import Path
from spriteforge_agent_v2 import execute
root=Path(__file__).resolve().parents[1]
source=root/'public/assets/combat/champion-murmillo/source'
assert (source/'idle.png').exists() and (source/'guard.png').exists()
with tempfile.TemporaryDirectory() as tmp:
    stage=Path(tmp)
    for action in ('idle','guard'):
        spec=stage/(action+'.json')
        spec.write_text(json.dumps({'character':'champion_murmillo',
            'actions':{action:str(source/(action+'.png'))}}))
        report=execute(spec,stage/('out_'+action),only=[action])
        item=report['actions'][action]
        assert item.get('frameCount')==8, (action,item)
        frames=item['frames']
        assert all((stage/('out_'+action)/'frames'/action/(f'{i:02}.png')).exists() for i in range(8))
        assert all('footExport' in f and 'rootMotion' in f for f in frames)
        print('ACTUAL_CHAMPION_ART_SCANNED',action,item['status'],
              'frame_warnings',sum(bool(f['warnings'] or f['errors']) for f in frames))
print('SPRITEFORGE_V2_CHAMPION_SOURCE_READ_ONLY_PASS')
