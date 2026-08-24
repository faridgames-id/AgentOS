"""AI Models API — usage & context per model dari log gateway Hermes (REAL data)."""
import re
import time
from collections import Counter, defaultdict
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

HERMES_LOGS = Path.home() / '.hermes' / 'logs'
LOG_FILES = [HERMES_LOGS / 'gateway.log', HERMES_LOGS / 'agent.log']

MODEL_PATTERNS = {
    'ox-alpha (OpenRouter)': r'ox[-_]?alpha',
    'DeepSeek v4 Flash': r'deepseek[-_]?v4',
    'Agnes 2.5 Flash': r'agnes[-_]?2\.?5',
    'OpenAI Studio': r'\bgpt\b|openai\s*studio|o[34]-mini',
}

# context window tiap model (token)
CONTEXT_WINDOWS = {
    'ox-alpha (OpenRouter)': 200_000,
    'DeepSeek v4 Flash': 128_000,
    'Agnes 2.5 Flash': 1_000_000,
    'OpenAI Studio': 128_000,
}

_cache = {"data": None, "ts": 0}
_TTL = 30  # detik


def _scan():
    counts = Counter()
    daily = defaultdict(Counter)
    for path in LOG_FILES:
        if not path.exists():
            continue
        try:
            text = path.read_text(errors='ignore')
        except Exception:
            continue
        for line in text.splitlines():
            low = line.lower()
            m = re.match(r'^(\d{4}-\d{2}-\d{2})', line)
            day = m.group(1) if m else None
            for label, pat in MODEL_PATTERNS.items():
                if re.search(pat, low):
                    counts[label] += 1
                    if day:
                        daily[day][label] += 1
                    break
    return counts, daily


def _current_model():
    """Baca model aktif dari config.yaml."""
    cfg = Path.home() / '.hermes' / 'config.yaml'
    try:
        text = cfg.read_text(errors='ignore')
        m = re.search(r'model:\s*([a-zA-Z0-9/._-]+)', text)
        if m and m.group(1) not in ('base',):
            return m.group(1)
        m2 = re.search(r'custom_providers:.*?model:\s*([a-zA-Z0-9/._-]+)', text, re.S)
        return m2.group(1) if m2 else 'unknown'
    except Exception:
        return 'unknown'


@router.get("/usage")
def get_model_usage():
    """Usage + context per model — REAL dari log, cache 30s."""
    now = time.time()
    if _cache["data"] is not None and now - _cache["ts"] < _TTL:
        _cache["data"]["current"] = _current_model()  # current selalu fresh
        return _cache["data"]

    counts, daily = _scan()

    total_calls = sum(counts.values()) or 1
    models = []
    for label, calls in counts.most_common():
        ctx = CONTEXT_WINDOWS.get(label, 128_000)
        # estimasi context terpakai: rata-rata ~2k token/call
        used_tokens = calls * 2000
        models.append({
            "name": label,
            "calls": calls,
            "share": round(calls / total_calls * 100, 1),
            "context_window": ctx,
            "context_used_tokens": used_tokens,
            "context_used_pct": round(min(100, used_tokens / ctx * 100), 1),
        })

    # daily series 14 hari terakhir untuk sparkline
    days = sorted(daily.keys())[-14:]
    series = [
        {"day": d, **{m.split(' ')[0]: daily[d].get(m, 0) for m in MODEL_PATTERNS}}
        for d in days
    ]

    data = {
        "models": models,
        "total_calls": sum(counts.values()),
        "active_days": len(days),
        "series": series,
        "current": _current_model(),
    }
    _cache["data"] = data
    _cache["ts"] = now
    return data
