#!/usr/bin/env python3
"""SpriteForge Agent v2: machine-run generation-time gate and connected-alpha extractor.

Nine actions exactly match NEW CHAMPION MURMILLO; wolf 'roar' is optional special,
NEVER a substitute for 'guard'. One source sheet per animation, 8 frames each.
This tool does not invent missing drawings or call an image generation API.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ACTIONS=("idle","walk","slash","sweep","thrust","heavy","guard","hit","death")
ALIASES={"attack1":"slash","attack_bite":"slash","bite":"slash",
         "attack2":"sweep","attack_claw":"sweep","claw":"sweep",
         "attack3":"thrust","attack_leap":"thrust","leap":"thrust",
         "attack4":"heavy","attack_dash":"heavy","defeat":"death",
         "special_roar":"roar"}
WOLF={"idle":"대기","walk":"이동","slash":"물기 공격1","sweep":"할퀴기 공격2",
      "thrust":"도약 공격3","heavy":"돌진 강공격4","guard":"웅크려 방어",
      "hit":"피격","death":"죽음","roar":"포효 (선택 특수, 방어 아님)"}
FPS={"idle":6,"walk":10,"slash":14,"sweep":14,"thrust":14,
     "heavy":12,"guard":7,"hit":10,"death":10,"roar":8}
# Root-motion in screen pixels at the 430px fighter art size; dx follows facing.
# These are game-art starting curves. Authors may revise them per character.
MOTION={
 "idle":[(0,0)]*8,
 "walk":[(0,0),(2,0),(4,-1),(5,0),(3,0),(0,0),(-2,-1),(-1,0)],
 "slash":[(0,0),(-5,0),(8,-1),(25,-2),(38,-1),(25,0),(7,0),(0,0)],
 "sweep":[(0,0),(-4,0),(8,-2),(23,-1),(36,0),(26,0),(8,0),(0,0)],
 "thrust":[(0,0),(-9,6),(8,-19),(26,-41),(46,-49),(33,-22),(13,-5),(0,0)],
 "heavy":[(0,0),(-12,8),(-20,10),(4,-17),(38,-42),(59,-19),(32,-4),(0,0)],
 "guard":[(0,0),(0,2),(0,3),(0,4),(0,3),(0,3),(0,2),(0,0)],
 "hit":[(0,0),(-5,0),(-15,0),(-18,1),(-12,0),(-7,0),(-3,0),(0,0)],
 "death":[(0,0),(-2,0),(-5,3),(-7,6),(-9,8),(-9,9),(-9,9),(-9,9)],
 "roar":[(0,0),(0,-2),(0,-6),(0,-7),(0,-7),(0,-4),(0,-1),(0,0)]}
ALPHA=30; PAD=12; OUTPUT=(960,720)

def canonical(value):return ALIASES.get(value,value)

def contract(character):
    return {"version":2,"character":character,"canonicalActions":list(ACTIONS),
            "optionalActions":["roar"],"framesPerAction":8,"sourceGrid":[4,2],
            "oneActionPerSheet":True,"approvedModelOnly":True,
            "transparentBackground":True,"noOverlappingCells":True,
            "preserveNativeDetail":True,"expandSourceCanvasForLargeLeaps":True,
            "wolfRoleMapping":WOLF if character=="wolf" else {},
            "postGeneration":"run SpriteForge Agent --only ACTION after each generation",
            "failedFrames":"regenerate affected action only; never composite all actions"}

def selection(sheet,index):
    """Alpha CC selection; a rectangular CELL is just a hint, never the mask.
    Far-away disconnected silhouette fragments are excluded. Ambiguous connected
    bodies across cell seams cause BLOCKED, not speculative fake restoration.
    """
    w,h=sheet.size
    cw,ch=w/4,h/2
    row,col=divmod(index,4)
    bx=round(col*cw);by=round(row*ch)
    bx1=round((col+1)*cw);by1=round((row+1)*ch)
    px,py=round(cw*.13),round(ch*.09)
    x0,y0,x1,y1=max(0,bx-px),max(0,by-py),min(w,bx1+px),min(h,by1+py)
    arr=np.asarray(sheet.crop((x0,y0,x1,y1)).convert("RGBA")).copy()
    regions,n=ndimage.label(arr[:,:,3]>=ALPHA,structure=np.ones((3,3),dtype=np.uint8))
    if n==0:raise ValueError("EMPTY_SPRITE")
    size=np.bincount(regions.ravel(),minlength=n+1);size[0]=0
    yy,xx=np.ogrid[y0:y1,x0:x1]
    central=(xx>=bx+cw*.17)&(xx<=bx+cw*.83)&(yy>=by+ch*.12)&(yy<=by+ch*.90)
    preferred=np.bincount(regions[np.broadcast_to(central,regions.shape)].ravel(),minlength=n+1)
    preferred[0]=0
    key=int(np.argmax(preferred+.055*size))
    if not key or size[key]<min(160,cw*ch*.003):raise ValueError("NO_CENTRAL_CHARACTER")
    keep=(regions==key)
    sy,sx=np.where(keep)
    issues=[];notes=[]
    if (sx.min()+x0<bx-cw*.085 or sx.max()+x0>bx1+cw*.085 or
        sy.min()+y0<by-ch*.07 or sy.max()+y0>by1+ch*.075):
        issues.append("MERGED_ACTORS_ACROSS_CELL__REGENERATE")
    if (sx.min()+x0<bx+PAD or sx.max()+x0>bx1-PAD or
        sy.min()+y0<by+PAD or sy.max()+y0>by1-PAD):
        notes.append("CELL_SEAM_TOUCH__ARTIST_REVIEW")
    core=(int(sx.min()),int(sx.max()),int(sy.min()),int(sy.max()))
    removed=0;kept_extra=0
    for k in range(1,n+1):
        if k==key or size[k]<8:continue
        ys,xs=np.where(regions==k)
        if not len(xs):continue
        a,b,c,d=int(xs.min()),int(xs.max()),int(ys.min()),int(ys.max())
        centerx=x0+(a+b)/2;centery=y0+(c+d)/2
        within=(bx+cw*.03<centerx<bx1-cw*.03 and by+ch*.01<centery<by1-ch*.01)
        nearby=(a<=core[1]+14 and b>=core[0]-14 and c<=core[3]+14 and d>=core[2]-14)
        if within and nearby and size[k]<max(100,size[key]*.2):
            keep|=(regions==k);kept_extra+=1
        else:
            removed+=int(size[k])
            if within and size[k]>size[key]*.16:
                notes.append("LARGE_DISCONNECTED_SHAPE__CHECK_CLONE")
    edge=ndimage.binary_dilation(keep,iterations=2)
    arr[:,:,3]=np.where(edge,arr[:,:,3],0).astype(np.uint8)
    y,x=np.where(arr[:,:,3]>=ALPHA)
    if not len(x):raise ValueError("EMPTY_AFTER_MASK")
    ux0,uy0,ux1,uy1=int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)
    body=Image.fromarray(arr[uy0:uy1,ux0:ux1],"RGBA")
    fy,fx=np.where(keep)
    planted=fy>=np.quantile(fy,.965)
    footx=float(np.median(fx[planted]));footy=float(np.quantile(fy,.997))
    return {"body":body,"sourceBox":[x0+ux0,y0+uy0,x0+ux1,y0+uy1],
            "foot":[footx-ux0,footy-uy0],"issues":issues,"notes":notes,
            "removedForeignPixels":removed,"retainedNearbyParts":kept_extra}

def sources(value,root):
    if isinstance(value,str):
        im=Image.open(root/value).convert("RGBA")
        if min(im.size)<650 or im.width<1000:raise ValueError("LOW_RESOLUTION_REGENERATE_SOURCE")
        return [selection(im,i) for i in range(8)]
    if not isinstance(value,list) or len(value)!=8:raise ValueError("SUPPLY_ONE_4x2_SHEET_OR_EIGHT_PNGS")
    result=[]
    for file in value:
        im=Image.open(root/file).convert("RGBA")
        mask=np.asarray(im.getchannel("A"))>=ALPHA
        y,x=np.where(mask)
        if not len(x):raise ValueError("EMPTY_INDEPENDENT_FRAME")
        a,b,c,d=int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)
        planted=y>=np.quantile(y,.965)
        edge=min(a,b,im.width-c,im.height-d)
        result.append({"body":im.crop((a,b,c,d)),"sourceBox":[a,b,c,d],
                       "foot":[float(np.median(x[planted])-a),float(np.quantile(y,.997)-b)],
                       "issues":["INDEPENDENT_SOURCE_TOUCHES_BORDER"] if edge<PAD else [],
                       "notes":[],"removedForeignPixels":0,"retainedNearbyParts":0})
    return result

def render(parts,name,location,scale):
    location.mkdir(parents=True,exist_ok=True)
    metadata=[];images=[]
    for i,part in enumerate(parts):
        image=Image.new("RGBA",OUTPUT)
        art=part["body"]
        if scale!=1:
            art=art.resize((round(art.width*scale),round(art.height*scale)),Image.Resampling.LANCZOS)
        x=round(OUTPUT[0]/2-part["foot"][0]*scale)
        y=round(OUTPUT[1]-36-part["foot"][1]*scale)
        errors=list(part["issues"])
        if x<PAD or y<PAD or x+art.width>OUTPUT[0]-PAD or y+art.height>OUTPUT[1]-PAD:
            errors.append("OVERFLOW_EXPORT_CANVAS__ENLARGE_CANVAS")
        else:image.alpha_composite(art,(x,y))
        image.save(location/f"{i:02}.png",compress_level=5)
        images.append(image)
        dx,dy=MOTION.get(name,[(0,0)]*8)[i]
        metadata.append({"frame":i,"sourceBBox":part["sourceBox"],
         "nativeBodySize":list(part["body"].size),
         "footSource":part["foot"],"footExport":[OUTPUT[0]//2,OUTPUT[1]-36],
         "scaleFactorIdenticalAcrossAllFrames":scale,
         "rootMotion":{"dx":dx,"dy":dy},"errors":errors,
         "warnings":part["notes"],"foreignPixelsRemoved":part["removedForeignPixels"],
         "retainedNearbyPieces":part["retainedNearbyParts"]})
    # QC preview only; never invent sprites by making a visual montage.
    preview=Image.new("RGB",(1280,680),(35,29,26));painter=ImageDraw.Draw(preview)
    for i,im in enumerate(images):
        thumb=im.copy();thumb.thumbnail((320,320))
        base=Image.new("RGBA",(320,320),(35,29,26,255))
        base.alpha_composite(thumb,((320-thumb.width)//2,(320-thumb.height)//2))
        cx=(i%4)*320;cy=(i//4)*340
        preview.paste(base.convert("RGB"),(cx,cy))
        painter.text((cx+8,cy+4),f"{name} {i+1}/8",fill=(255,220,165))
    preview.save(location.parent.parent/f"{name}_contact.jpg",quality=86)
    # Render the 8 authored root-motion offsets into the ACTUAL GIF preview.
    # This checks forward/back/airborne timing before the game consumes metadata.
    animated=[]
    for i,im in enumerate(images):
        dx,dy=MOTION.get(name,[(0,0)]*8)[i]
        motionImg=Image.new("RGBA",OUTPUT,(0,0,0,0))
        motionImg.alpha_composite(im,(int(dx),int(dy)))
        small=motionImg.copy()
        small.thumbnail((480,360),Image.Resampling.LANCZOS)
        bg=Image.new("RGB",(480,360),(39,32,28))
        bg.paste(small,((480-small.width)//2,(360-small.height)//2),small)
        animated.append(bg)
    animated[0].save(location.parent.parent/f"{name}_motion.gif",
                     save_all=True,append_images=animated[1:],
                     duration=round(1000/FPS[name]),loop=0,optimize=True)
    return images,metadata

def execute(manifest,out,only=None):
    manifest=Path(manifest).resolve()
    spec=json.loads(manifest.read_text(encoding="utf8"))
    root=manifest.parent;out=Path(out);out.mkdir(parents=True,exist_ok=True)
    kind=spec.get("character","wolf")
    (out/"generation_contract.json").write_text(json.dumps(contract(kind),ensure_ascii=False,indent=2),encoding="utf8")
    declared={}
    for name,value in spec.get("actions",{}).items():
        n=canonical(name)
        if n not in (*ACTIONS,"roar") or n in declared:raise ValueError("INVALID_OR_REPEATED_ACTION:"+name)
        declared[n]=value
    needs=list(only) if only else list(ACTIONS)+(["roar"] if "roar" in declared else [])
    issues=[];actions={}
    for action in needs:
        if action not in declared:continue
        try:
            parts=sources(declared[action],root)
            scale=float(spec.get("scale",1.0))
            if not 0<scale<=1:raise ValueError("NO_UNCONTROLLED_UPSCALE")
            images,meta=render(parts,action,out/"frames"/action,scale)
            # Size consistency. Do not 'fix' a mysteriously rescaled frame by
            # stretching it; request a new correctly-sized source drawing.
            if action in ("idle","walk","guard"):
                heights=[p["body"].height for p in parts]
                median=float(np.median(heights))
                for idx,height in enumerate(heights):
                    if height<median*.56 or height>median*1.65:
                        meta[idx]["warnings"].append("BODY_SIZE_JUMP__REGENERATE_OR_EXPLAIN")
            # Duplicates are a production error even when all sprites lie
            # neatly inside their boundaries.
            hashes=[hashlib.sha256(p["body"].tobytes()).hexdigest() for p in parts]
            for j in range(8):
                for i in range(j):
                    if parts[i]["body"].size==parts[j]["body"].size and hashes[i]==hashes[j]:
                        meta[j]["errors"].append("DUPLICATED_POSE_NOT_AN_ANIMATION")
            bad=[{"frame":m["frame"]+1,"errors":m["errors"],"warnings":m["warnings"]}
                 for m in meta if m["errors"] or m["warnings"]]
            actions[action]={"status":"BLOCKED" if bad else "MACHINE_PASS",
                 "fps":FPS[action],"frameCount":8,"meaning":WOLF.get(action,action) if kind=="wolf" else action,
                 "frames":meta,"reviewNeeded":True}
            if bad:issues.append({"action":action,"status":"REGENERATE_ONLY_THIS_ACTION",
              "frames":bad,"generationFeedback":
              "Regenerate only "+action+": one approved character per frame; enlarge cell width and height; "+
              "no seams, no double silhouettes, no lost limbs, no neighbor fragments, transparent RGBA."})
        except Exception as error:
            actions[action]={"status":"BLOCKED","reason":str(error)}
            issues.append({"action":action,"status":"REGENERATE_ONLY_THIS_ACTION","error":str(error)})
    missing=[a for a in ACTIONS if a not in declared]
    output={"agent":"SpriteForge v2","character":kind,"standard":"New Champion Murmillo, 9 actions × 8 frames",
         "requiredActions":list(ACTIONS),"optional":"roar is independent special, never guard",
         "missing":missing,"actions":actions,"generationIssues":issues,
         "mayReplaceGameArt":False,"reason":"No art is released without all 9 actions, visual review and combat test."}
    (out/"qa.json").write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding="utf8")
    (out/"regeneration_requests.json").write_text(json.dumps(issues,ensure_ascii=False,indent=2),encoding="utf8")
    print(json.dumps({"machinePass":[k for k,v in actions.items() if v["status"]=="MACHINE_PASS"],
         "blocked":[k for k,v in actions.items() if v["status"]=="BLOCKED"],"missing":missing},ensure_ascii=False))
    return output

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--manifest",help="input sources JSON, used after generation")
    p.add_argument("--out",required=True)
    p.add_argument("--plan-only",action="store_true",help="prepare one-pose-at-a-time generation contracts BEFORE making art")
    p.add_argument("--character",default="wolf",help="wolf or other character variant")
    p.add_argument("--only",help="One action, directly after each image generation")
    p.add_argument("--allow-partial",action="store_true")
    args=p.parse_args()
    if args.plan_only:
        out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
        rules=contract(args.character)
        instructions=[]
        for action in (*ACTIONS,"roar"):
            instructions.append({"action":action,"required":action in ACTIONS,
                "semantic":WOLF.get(action,action) if args.character=="wolf" else action,
                "style":"Exactly ONE character action, 8 distinct sequential high-resolution fully drawn poses, "
                  "4 columns x 2 rows on a transparent background; leave large safety gutters in X and Y; "
                  "never create a combined multi-action board; never change approved character anatomy or costume.",
                "afterGenerationCheck":"python scripts/spriteforge_agent_v2.py --manifest SOURCES.json --out QA --only "+action,
                "retryOnlyThisAction":True})
        (out/"generation_contract.json").write_text(json.dumps(rules,ensure_ascii=False,indent=2),encoding="utf8")
        (out/"action_by_action_plan.json").write_text(json.dumps(instructions,ensure_ascii=False,indent=2),encoding="utf8")
        print(json.dumps({"plan":str(out/"action_by_action_plan.json"),
                          "steps":len(instructions),"optional":"roar","required":len(ACTIONS)}))
        raise SystemExit(0)
    if not args.manifest:p.error("--manifest required unless --plan-only is used")
    data=execute(args.manifest,args.out,[canonical(args.only)] if args.only else None)
    blocked=any(v["status"]=="BLOCKED" for v in data["actions"].values())
    raise SystemExit(0 if args.allow_partial or not(data["missing"] or blocked) else 2)
