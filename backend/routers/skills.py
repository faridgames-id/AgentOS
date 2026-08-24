"""Skills API — daftar skill Hermes REAL dari ~/.hermes/skills/ (real-time)."""
import re
import time
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

SKILLS_DIR = Path.home() / '.hermes' / 'skills'

_cache = {"data": None, "ts": 0}
_TTL = 30  # real-time, cache pendek

# kategori warna untuk galaxy
CATEGORY_COLORS = {
    'finance': '#10B981',
    'firebase': '#FF6B35',
    'dev': '#06B6D4',
    'ai': '#8B5CF6',
    'content': '#EC4899',
    'system': '#F59E0B',
}


def _categorize(name: str, desc: str) -> str:
    low = (name + ' ' + desc).lower()
    if any(k in low for k in ['income', 'finance', 'tracker', 'spreadsheet', 'budget']):
        return 'finance'
    if any(k in low for k in ['firebase', 'firestore']):
        return 'firebase'
    if any(k in low for k in ['github', 'code', 'development', 'debug', 'vision-os', 'agent']):
        return 'dev'
    if any(k in low for k in ['research', 'paper', 'arxiv', 'science']):
        return 'ai'
    if any(k in low for k in ['creative', 'diagram', 'art', 'humanizer']):
        return 'content'
    return 'system'


@router.get("/list")
def get_skills():
    """Semua skill + deskripsi — dibaca langsung dari ~/.hermes/skills/ tiap 30s."""
    now = time.time()
    if _cache["data"] is not None and now - _cache["ts"] < _TTL:
        return _cache["data"]

    skills = []
    if SKILLS_DIR.exists():
        for d in sorted(SKILLS_DIR.iterdir()):
            if not d.is_dir():
                continue
            skill_md = d / 'SKILL.md'
            desc = ''
            version = ''
            if skill_md.exists():
                try:
                    text = skill_md.read_text(errors='ignore')[:3000]
                    m = re.search(r'^description:\s*(.+)$', text, re.M)
                    if m:
                        desc = m.group(1).strip().strip('"')[:120]
                    v = re.search(r'^version:\s*(.+)$', text, re.M)
                    if v:
                        version = v.group(1).strip()
                except Exception:
                    pass
            # sub-skills (folder di dalamnya dengan SKILL.md sendiri)
            subs = [s.name for s in d.iterdir() if s.is_dir() and (s / 'SKILL.md').exists()]
            cat = _categorize(d.name, desc)
            skills.append({
                "name": d.name,
                "description": desc or f"{d.name} skill",
                "version": version,
                "category": cat,
                "color": CATEGORY_COLORS.get(cat, '#94A3B8'),
                "sub_skills": subs,
                "has_docs": skill_md.exists(),
            })

    data = {
        "skills": skills,
        "total": len(skills),
        "categories": list(set(s['category'] for s in skills)),
        "scanned_at": time.strftime('%H:%M:%S'),
    }
    _cache["data"] = data
    _cache["ts"] = now
    return data
