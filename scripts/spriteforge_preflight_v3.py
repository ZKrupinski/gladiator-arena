#!/usr/bin/env python3
"""SpriteForge V3 mandatory pre-generation briefing.

This is a rule gate, NOT an image model. A trusted generator adapter must read
the briefing and acknowledge ALL blocking rules before it can draw any pixels.
The acknowledgement is bound to the precise job and current policy hash.
"""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
POLICY=ROOT/"config/spriteforge-qc-rules.json"
CHECKS=(
    "original_character_design_locked",
    "exactly_one_action_eight_distinct_poses",
    "exactly_one_native_high_resolution_4x2_sheet",
    "reference_detail_not_artificially_upscaled",
    "native_rgba_with_large_transparent_gutters",
    "only_current_frame_body_parts_no_adjacent_body",
    "full_limbs_head_tail_weapon_never_clipped",
    "consistent_scale_facing_and_ground_anchor",
    "specific_prior_failures_addressed",
    "auto_qc_retry_preview_before_release",
)
MAX_BRIEF_AGE_SECONDS=900

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def make_brief(job_path, out):
    job_path=Path(job_path).resolve()
    job=json.loads(job_path.read_text(encoding="utf8"))
    policy=json.loads(POLICY.read_text(encoding="utf8"))
    rules=policy["rules"]
    policy_sha=sha(POLICY)
    if job.get("protocol")!="spriteforge-v3":
        raise ValueError("INVALID_SPRITEFORGE_JOB")
    if job.get("rulesSha256") != policy_sha:
        raise ValueError("POLICY_CHANGED_REPLAN_AND_REBRIEF")
    if job.get("rules") != [r["id"] for r in rules]:
        raise ValueError("JOB_RULES_NOT_CURRENT_REPLAN")
    if sha(job["reference"])!=job["referenceSha256"]:
        raise ValueError("APPROVED_REFERENCE_CHANGED")
    retry=job.get("retryFailures", [])
    blocking=[{"id":r["id"],"description":r["description"],"mustDo":r["action"]}
              for r in rules if r.get("severity")=="block"]
    brief={
        "protocol":"spriteforge-v3-preflight",
        "character":job["character"],"action":job["action"],
        "jobSha256":sha(job_path),"policySha256":policy_sha,
        "referenceSha256":job["referenceSha256"],
        "createdAtUTC":datetime.now(timezone.utc).isoformat(),
        "validForSeconds":MAX_BRIEF_AGE_SECONDS,
        "requiredFrames":8,"motionsPerJob":1,
        "frameNativeMin":job["nativeFrameMinimum"],"sheetNativeMin":job["nativeSheetMinimum"],
        "requiredGenerationArtifact":"ONE_TRANSPARENT_4x2_SPRITE_SHEET_ONLY",
        "frameExportsAllowed":"ONLY_AFTER_QA_EXTRACTION",
        "noArtificialUpscaling":True,
        "blockingRules":blocking,
        "mustAcknowledgeChecks":list(CHECKS),
        "previousAttemptErrors":retry,
        "briefingKorean":[
            f"작업 대상: {job['character']} / {job['action']}. 다른 동작을 섞지 말고 8개의 서로 다른 연속 포즈만 제작.",
            "승인된 기준 캐릭터의 얼굴·장비·비율·시선·디테일을 고정. 새 디자인으로 변형하지 말 것.",
            f"무조건 캐릭터 하나·동작 하나·순차 포즈 8개·원생성 고해상도 4×2 RGBA 시트 한 장만 제작. 셀당 {job['nativeFrameMinimum'][0]}×{job['nativeFrameMinimum'][1]}픽셀 이상, 시트 {job['nativeSheetMinimum'][0]}×{job['nativeSheetMinimum'][1]}픽셀 이상.",
            "원본 원화의 해상도와 고주파 디테일을 최대한 유지. 작게 뽑은 이미지를 단순 확대하거나 리샘플링해 고해상도라 주장하지 말 것. 8개 개별 PNG는 생성 입력 불허, 검수·커팅 후 출력만 허용.",
            "각 프레임의 머리·손·발·꼬리·무기까지 완전히 포함, 좌우상하 20px 이상의 투명 여백.",
            "가장 중요: 옆 프레임 소속의 머리·발·몸통·꼬리는 크기와 무관하게 모두 제거. 현재 프레임 소속 신체는 절대 잘라내지 말 것.",
            "인접 신체가 붙거나 소속을 확신할 수 없다면 그 동작 8장을 다시 생성. 억지로 컷팅하지 말 것.",
            "카메라 방향·캐릭터 크기·발 접지 및 의도된 전진/도약 궤적을 일관되게.",
            "이전에 실패한 프레임 번호·원인·해결책을 브리핑에서 먼저 확인하고 같은 실수를 반복하지 말 것.",
            "생성 즉시 커팅→알파·중복·경계·해상도 QA→애니메이션 미리보기. 실패 시 동일 동작만 자동 재시도.",
            "검수나 리뷰 없이 기존 게임 리소스를 대체/배포하지 말 것."
        ],
        "productionInstruction":job["instruction"],
        "frameOwnershipPolicy":job.get("frameOwnershipPolicy"),
        "releaseAuthorized":False
    }
    out=Path(out).resolve();out.mkdir(parents=True,exist_ok=True)
    path=out/"briefing.json"
    path.write_text(json.dumps(brief,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    numbered="\n".join(f"{i}. {line}" for i,line in enumerate(brief["briefingKorean"],1))
    failures=json.dumps(retry,ensure_ascii=False,indent=2) if retry else "직전 실패 내역 없음"
    lines=[
        "# SpriteForge V3 | 제작 직전 의무 브리핑",
        f"**캐릭터** {brief['character']} / **동작** {brief['action']}",
        f"**기준 원본** SHA256 {brief['referenceSha256']}",
        f"**작업** 고해상도 투명 4×2 시트 1장(8프레임), 최소 {brief['sheetNativeMin'][0]}×{brief['sheetNativeMin'][1]}px. 생성 입력으로 8개 개별 PNG 불허",
        "## 시작 직전에 숙지할 규칙",numbered,
        "## 지난 검사에서 발견된 문제 (재시도 시 반드시 해결)",failures,
        "## 필수 통과 규정",*[
          f"- [{r['id']}] {r['description']}" for r in blocking
        ],
        "## 실행 잠금",
        "생성기/에이전트는 아래 JSON의 모든 체크항목을 직접 확인하고 acknowledgement.json으로 회신해야 그림 생성이 시작됩니다.",
        f"브리핑 유효 시간: {MAX_BRIEF_AGE_SECONDS//60}분. 정책이나 작업 지시가 바뀌면 처음부터 다시 브리핑합니다."
    ]
    (out/"briefing.md").write_text("\n\n".join(lines)+"\n",encoding="utf8")
    return path

def validate_acknowledgement(job_path, briefing_path, ack_path):
    job_path=Path(job_path).resolve()
    briefing_path=Path(briefing_path).resolve()
    ack_path=Path(ack_path).resolve()
    if not briefing_path.is_file() or not ack_path.is_file():
        raise ValueError("MISSING_MANDATORY_PREGEN_BRIEFING_ACK")
    job=json.loads(job_path.read_text(encoding="utf8"))
    briefing=json.loads(briefing_path.read_text(encoding="utf8"))
    ack=json.loads(ack_path.read_text(encoding="utf8"))
    if (briefing.get("requiredGenerationArtifact")!="ONE_TRANSPARENT_4x2_SPRITE_SHEET_ONLY" or
        briefing.get("frameNativeMin")!=job.get("nativeFrameMinimum") or
        briefing.get("sheetNativeMin")!=job.get("nativeSheetMinimum")):
        raise ValueError("PREFLIGHT_ONE_SHEET_NATIVE_SPEC_MISMATCH")
    if (briefing.get("jobSha256")!=sha(job_path) or
        briefing.get("policySha256")!=sha(POLICY) or
        job.get("rulesSha256")!=sha(POLICY)):
        raise ValueError("PREFLIGHT_JOB_OR_RULES_CHANGED")
    created=datetime.fromisoformat(briefing["createdAtUTC"])
    if created.utcoffset() is None:
        raise ValueError("PREFLIGHT_MISSING_TIMEZONE")
    elapsed=(datetime.now(timezone.utc)-created).total_seconds()
    if elapsed< -30 or elapsed>MAX_BRIEF_AGE_SECONDS:
        raise ValueError("PREFLIGHT_EXPIRED_REBRIEF")
    if (ack.get("briefingSha256")!=sha(briefing_path) or
        ack.get("jobSha256")!=sha(job_path) or
        ack.get("policySha256")!=sha(POLICY) or
        ack.get("referenceSha256")!=job["referenceSha256"]):
        raise ValueError("PREFLIGHT_ACK_NOT_BOUND_TO_THIS_JOB")
    required={r["id"] for r in briefing["blockingRules"]}
    if set(ack.get("understoodRuleIds",[]))!=required:
        raise ValueError("PREFLIGHT_BLOCKING_RULES_NOT_ALL_ACKNOWLEDGED")
    checks=ack.get("checks")
    if not isinstance(checks,dict) or set(checks)!=set(CHECKS) or any(checks[k] is not True for k in CHECKS):
        raise ValueError("PREFLIGHT_OWNERSHIP_OR_CONTRACT_CHECK_UNACKNOWLEDGED")
    if len(str(ack.get("executionPlan","")).strip())<50:
        raise ValueError("PREFLIGHT_EXECUTION_PLAN_MISSING")
    if ack.get("character")!=job["character"] or ack.get("action")!=job["action"]:
        raise ValueError("PREFLIGHT_OTHER_ACTOR_OR_ACTION")
    return {
        "jobSha256":sha(job_path),
        "briefingSha256":sha(briefing_path),
        "policySha256":sha(POLICY),
        "acknowledgedRuleCount":len(required),
        "character":job["character"],"action":job["action"],
        "preflightAccepted":True,
    }
