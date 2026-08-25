"""Sub-agent Brain API — memori & otak per agent (REAL, tersimpan di SQLite).

Setiap sub-agent punya 'otak': memori jangka panjang (fakta, preferensi, hasil task)
+ riwayat percakapan. Data tersimpan di backend/data/agent_brains.db.
Chat agent di-forward ke Cozy (ox-alpha) dengan konteks peran agent — jadi jawaban
real dari LLM, bukan template.
"""
import json
import sqlite3
import time
import urllib.request
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

DB_PATH = Path(__file__).parent.parent / 'data' / 'agent_brains.db'
ENV_PATH = Path.home() / '.hermes' / '.env'

AGENT_CONTEXTS = {
    'cozy': 'Kamu COZY, orchestrator Agent OS. Kamu mengatur workflow 9 sub-agent.',
    'nova': 'Kamu NOVA, spesialis Research & Analysis. Fokusmu: riset pasar, analisis data, insight bisnis akun game FF/ML.',
    'cipher': 'Kamu CIPHER, spesialis Code & Development. Fokusmu: frontend dashboard, backend API, deploy.',
    'atlas': 'Kamu ATLAS, spesialis Finance & Tracking. Kamu kelola income/expense Firestore Bos Farid. Format rupiah selalu.',
    'pixel': 'Kamu PIXEL, spesialis Image & Creative. Fokusmu: desain visual, konten gambar.',
    'oracle': 'Kamu ORACLE, spesialis Insights & Predictions. Fokusmu: prediksi tren, analisis pola penjualan.',
    'sentinel': 'Kamu SENTINEL, spesialis Security & Monitoring. Fokusmu: keamanan, monitoring log, deteksi anomali.',
    'aurora': 'Kamu AURORA, spesialis Content & Writing. Fokusmu: copywriting, konten TikTok @Faridexcelent.',
    'phoenix': 'Kamu PHOENIX, spesialis Automation & Tasks. Fokusmu: automasi workflow, cron, integrasi.',
    'zephra': 'Kamu ZEPHRA, spesialis Stock & Commerce. Kamu kelola 272+ akun game FF/ML (farid-shop-enterprise). Panggil Bos "Bos Farid".',
}


def _db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("""CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'fact',
        content TEXT NOT NULL,
        created_at REAL NOT NULL
    )""")
    con.execute("""CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at REAL NOT NULL
    )""")
    con.execute("""CREATE TABLE IF NOT EXISTS thoughts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_agent TEXT NOT NULL,
        to_agent TEXT NOT NULL,
        topic TEXT NOT NULL,
        message TEXT NOT NULL,
        reply TEXT NOT NULL,
        created_at REAL NOT NULL
    )""")
    return con


def _env(key: str) -> str:
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(errors='ignore').splitlines():
            if line.startswith(f'{key}='):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    return ''


class ChatMsg(BaseModel):
    agent_id: str
    message: str


class MemoryAdd(BaseModel):
    agent_id: str
    content: str
    kind: str = 'fact'


LLM_MODELS = ["stealth/ox-alpha", "deepseek/deepseek-chat"]


def _llm(messages: list, max_tokens: int = 300) -> str:
    """Panggil LLM via OpenRouter — ox-alpha utama, fallback deepseek kalau rate-limit."""
    api_key = _env('OPENROUTER_API_KEY')
    if not api_key:
        return ''
    for model in LLM_MODELS:
        payload = json.dumps({
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
        }).encode()
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            out = (data['choices'][0]['message'].get('content') or '').strip()
            if out:
                return out
        except Exception:
            continue
    return ''



# Topik obrolan antar agent — sesuai bisnis Bos Farid
EXCHANGE_TOPICS = [
    "progress kerja hari ini dan temuan penting",
    "data stok akun FF/ML terbaru dan pergerakan penjualan",
    "rekap keuangan dan profit terbaru",
    "ide konten TikTok untuk akun Faridexcelent",
    "keamanan sistem dan anomali yang terdeteksi",
    "automasi yang bisa menghemat waktu Bos",
    "insight tren pasar akun game",
    "perbaikan dashboard Agent OS",
    "pengalaman menarik dari memori masing-masing",
    "rencana kerja besok",
]


def _run_one_exchange() -> dict | None:
    """Satu siklus tukar pikiran: agent A bertanya ke agent B, jawaban disimpan
    sebagai memori baru di kedua otak. Dipanggil oleh /exchange/tick."""
    import random
    ids = list(AGENT_CONTEXTS.keys())
    a, b = random.sample(ids, 2)
    topic = random.choice(EXCHANGE_TOPICS)

    con = _db()

    def mem_block(x: str) -> str:
        rows = con.execute(
            "SELECT content FROM memories WHERE agent_id=? ORDER BY id DESC LIMIT 6", (x,)
        ).fetchall()
        return '\n'.join(f"- {r['content']}" for r in rows) or '(memori masih kosong)'

    # A bertanya (dengan konteks memorinya)
    q = _llm([
        {"role": "system", "content": (
            f"Kamu {AGENT_CONTEXTS[a]} Rekan kerjamu {b} ({AGENT_CONTEXTS[b]}). "
            f"Memorimu:\n{mem_block(a)}\n\n"
            f"Buat 1-2 kalimat pertanyaan/berita singkat untuk {b} soal: {topic}. "
            "Gaya santai profesional, boleh pakai 1 emoji."
        )},
    ], 150)
    if not q:
        con.close()
        return None

    # B menjawab (dengan konteks memorinya) — jawaban jadi memori baru B & A
    r = _llm([
        {"role": "system", "content": (
            f"Kamu {AGENT_CONTEXTS[b]} Memori kamu:\n{mem_block(b)}\n\n"
            f"Jawab pertanyaan {a} ini singkat (1-3 kalimat) berdasarkan pengetahuanmu. "
            "Kalau ada info penting baru, sebutkan. Boleh 1 emoji."
        )},
        {"role": "user", "content": q},
    ], 250)
    if not r:
        con.close()
        return None

    now = time.time()
    con.execute(
        "INSERT INTO thoughts (from_agent,to_agent,topic,message,reply,created_at) VALUES (?,?,?,?,?,?)",
        (a, b, topic, q, r, now)
    )
    # memori baru: masing-masing mengingat pertukaran ini
    con.execute("INSERT INTO memories (agent_id,kind,content,created_at) VALUES (?,?,?,?)",
                (b, 'exchange', f"[diskusi dengan {a.upper()} soal {topic}] {r[:180]}", now))
    con.execute("INSERT INTO memories (agent_id,kind,content,created_at) VALUES (?,?,?,?)",
                (a, 'exchange', f"[kuberitahu {b.upper()} soal {topic}] {q[:180]}", now))
    con.commit()
    con.close()
    return {"from": a, "to": b, "topic": topic, "message": q, "reply": r}


@router.get("/exchange/recent")
def exchange_recent(limit: int = 12):
    """Riwayat tukar pikiran terakhir (untuk feed live di dashboard)."""
    con = _db()
    rows = con.execute(
        "SELECT from_agent,to_agent,topic,message,reply,created_at FROM thoughts ORDER BY id DESC LIMIT ?",
        (limit,)
    ).fetchall()
    con.close()
    return {"exchanges": [
        {
            "from": r['from_agent'], "to": r['to_agent'], "topic": r['topic'],
            "message": r['message'], "reply": r['reply'],
            "time": time.strftime('%H.%M', time.localtime(r['created_at'])),
        } for r in rows
    ]}


@router.post("/exchange/tick")
def exchange_tick():
    """Jalankan 1 siklus tukar pikiran antar 2 agent acak (memori bertambah)."""
    result = _run_one_exchange()
    if result is None:
        return {"ok": False, "reason": "LLM sibuk / gagal"}
    return {"ok": True, **result}


@router.get("/{agent_id}/memory")
def get_memory(agent_id: str):
    con = _db()
    mems = con.execute(
        "SELECT id, kind, content, created_at FROM memories WHERE agent_id=? ORDER BY id DESC LIMIT 50",
        (agent_id,)
    ).fetchall()
    chats = con.execute(
        "SELECT role, content, created_at FROM chats WHERE agent_id=? ORDER BY id DESC LIMIT 30",
        (agent_id,)
    ).fetchall()
    con.close()
    return {
        "memories": [
            {"id": m['id'], "kind": m['kind'], "content": m['content'],
             "time": time.strftime('%d/%m %H.%M', time.localtime(m['created_at']))}
            for m in mems
        ],
        "chats": [
            {"role": c['role'], "text": c['content']}
            for c in reversed(chats)
        ],
    }


@router.post("/memory")
def add_memory(body: MemoryAdd):
    if body.agent_id not in AGENT_CONTEXTS:
        raise HTTPException(404, 'agent tidak dikenal')
    con = _db()
    con.execute(
        "INSERT INTO memories (agent_id, kind, content, created_at) VALUES (?,?,?,?)",
        (body.agent_id, body.kind, body.content.strip(), time.time())
    )
    con.commit()
    con.close()
    return {"ok": True}


@router.post("/chat")
def agent_chat(body: ChatMsg):
    """Chat real dengan otak agent — forward ke LLM (ox-alpha via OpenRouter) + memori."""
    if body.agent_id not in AGENT_CONTEXTS:
        raise HTTPException(404, 'agent tidak dikenal')
    msg = body.message.strip()
    if not msg:
        raise HTTPException(400, 'pesan kosong')

    con = _db()
    # simpan pesan user
    con.execute("INSERT INTO chats (agent_id, role, content, created_at) VALUES (?,?,?,?)",
                (body.agent_id, 'user', msg, time.time()))

    # konteks: memori teratas + chat terakhir
    mems = con.execute(
        "SELECT content FROM memories WHERE agent_id=? ORDER BY id DESC LIMIT 10", (body.agent_id,)
    ).fetchall()
    hist = con.execute(
        "SELECT role, content FROM chats WHERE agent_id=? ORDER BY id DESC LIMIT 12", (body.agent_id,)
    ).fetchall()

    memory_block = '\n'.join(f"- {m['content']}" for m in mems) or '(belum ada memori)'
    messages = [
        {"role": "system", "content": (
            f"{AGENT_CONTEXTS[body.agent_id]} Bismillah, jawab ringkas & sopan, sebut 'Bos' untuk user. "
            f"Memori jangka panjangmu:\n{memory_block}"
        )},
    ] + [
        {"role": c['role'], "content": c['content']}
        for c in reversed(hist)
    ]

    # panggil LLM via OpenRouter (kredensial dari env Hermes)
    api_key = _env('OPENROUTER_API_KEY')
    reply = ''
    if api_key:
        try:
            payload = json.dumps({
                "model": "stealth/ox-alpha",
                "messages": messages,
                "max_tokens": 500,
            }).encode()
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            reply = (data['choices'][0]['message'].get('content') or '').strip()
        except Exception as e:
            reply = f"⚠️ Otak sedang sibuk ({e.__class__.__name__}). Coba lagi sebentar, Bos."
    else:
        reply = "⚠️ OPENROUTER_API_KEY tidak tersedia — otak agent butuh kunci itu untuk berpikir."
    reply = reply or "(otak sempat blank, coba tanya lagi Bos)"

    con.execute("INSERT INTO chats (agent_id, role, content, created_at) VALUES (?,?,?,?)",
                (body.agent_id, 'assistant', reply, time.time()))
    con.commit()
    con.close()
    return {"ok": True, "reply": reply}
