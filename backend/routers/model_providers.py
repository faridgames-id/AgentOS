"""Tambah endpoint providers & budget untuk AI Models dashboard."""
import re
import time
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

_cfg_cache = {"providers": None, "ts": 0}
_TTL = 60


def _parse_providers():
    """Parse config.yaml: provider aktif + custom endpoints."""
    cfg = Path.home() / '.hermes' / 'config.yaml'
    try:
        text = cfg.read_text(errors='ignore')
    except Exception:
        return []

    providers = []

    # provider utama
    m = re.search(r'^model:\s*\n\s*provider:\s*(\S+)', text, re.M)
    main_provider = m.group(1) if m else 'custom'
    m2 = re.search(r'^model:\s*\n\s*provider:\s*\S+\s*\n\s*model:\s*(\S+)', text, re.M)
    main_model = m2.group(1) if m2 else None

    # custom providers
    customs = re.findall(
        r'- name:\s*(\S+)\n\s*base_url:\s*(\S+)\n(?:.*?\n)*?\s+model:\s*(\S+)',
        text
    )
    for name, url, model in customs:
        # label endpoint yang rapi
        host = url.replace('https://', '').replace('http://', '').split('/')[0]
        providers.append({
            "name": name,
            "endpoint": host,
            "model": model,
            "type": "custom_endpoint",
        })

    # openrouter selalu tersedia kalau ada API key di .env
    env = Path.home() / '.hermes' / '.env'
    has_or = False
    if env.exists():
        try:
            has_or = 'OPENROUTER_API_KEY' in env.read_text(errors='ignore')
        except Exception:
            pass

    # provider utama (bukan custom)
    if main_provider == 'openrouter' or has_or:
        providers.insert(0, {
            "name": "OpenRouter",
            "endpoint": "openrouter.ai/api",
            "model": main_model or "stealth/ox-alpha",
            "type": "main" if main_provider == 'openrouter' else "api_key",
        })
    elif main_provider == 'custom' and customs:
        # provider utama = custom pertama
        pass

    return providers


# Estimasi biaya per juta token (USD) — perkiraan publik
COST_PER_MTOK = {
    'agnes': {"in": 0.10, "out": 0.40},      # murah, flash-tier
    'deepseek': {"in": 0.14, "out": 0.28},   # deepseek flash-tier
    'ox-alpha': {"in": 2.00, "out": 6.00},   # stealth flagship-tier
    'gpt': {"in": 0.15, "out": 0.60},
    'default': {"in": 0.50, "out": 1.50},
}

# rata-rata token per call (estimasi konservatif)
AVG_TOK_IN = 1500
AVG_TOK_OUT = 600


def _model_cost_key(model_name: str) -> str:
    low = model_name.lower()
    for k in COST_PER_MTOK:
        if k in low:
            return k
    return 'default'


@router.get("/providers")
def get_providers():
    """Daftar endpoint/provider yang dipakai (REAL dari config.yaml)."""
    global _cfg_cache
    now = time.time()
    if _cfg_cache["providers"] is not None and now - _cfg_cache["ts"] < _TTL:
        return {"providers": _cfg_cache["providers"]}
    provs = _parse_providers()
    _cfg_cache["providers"] = provs
    _cfg_cache["ts"] = now
    return {"providers": provs}


@router.get("/budget")
def get_budget():
    """Estimasi biaya bulan ini per model (dari jumlah calls di log)."""
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from routers.models import _scan  # reuse scanner

    counts, _ = _scan()
    rows = []
    total_cost = 0.0
    for label, calls in counts.most_common():
        key = _model_cost_key(label)
        rates = COST_PER_MTOK.get(key, COST_PER_MTOK['default'])
        tok_in = calls * AVG_TOK_IN
        tok_out = calls * AVG_TOK_OUT
        cost = (tok_in / 1_000_000 * rates['in']) + (tok_out / 1_000_000 * rates['out'])
        total_cost += cost
        rows.append({
            "model": label,
            "calls": calls,
            "tokens_in": tok_in,
            "tokens_out": tok_out,
            "est_cost_usd": round(cost, 2),
            "rate_in": rates['in'],
            "rate_out": rates['out'],
        })

    return {
        "rows": rows,
        "total_est_usd": round(total_cost, 2),
        "note": "estimasi dari rata-rata token/call; biaya aktual cek di provider masing-masing",
    }
