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
