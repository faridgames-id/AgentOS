"""Telegram Chat API — sinkron sesi & pesan REAL dari state.db Hermes."""
import sqlite3
import time
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

DB = Path.home() / '.hermes' / 'state.db'

_cache = {"data": None, "ts": 0}
_TTL = 15  # real-time, refresh cepat


def _connect():
    con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True, timeout=5)
    con.row_factory = sqlite3.Row
    return con


@router.get("/sessions")
def get_sessions():
    """Daftar sesi Telegram terakhir + pesan terakhirnya (real-time dari state.db)."""
    now = time.time()
    if _cache["data"] is not None and now - _cache["ts"] < _TTL:
        return _cache["data"]

    if not DB.exists():
        return {"sessions": []}

    con = _connect()
    cur = con.cursor()

    rows = cur.execute("""
        SELECT s.id, s.display_name, s.title, s.started_at, s.message_count,
               MAX(m.id) as last_mid
        FROM sessions s
        LEFT JOIN messages m ON m.session_id = s.id AND m.role IN ('user','assistant') AND m.content != ''
        WHERE s.source = 'telegram' AND COALESCE(s.archived, 0) = 0
        GROUP BY s.id
        ORDER BY last_mid DESC
        LIMIT 12
    """).fetchall()

    sessions = []
    for r in rows:
        # pesan terakhir yang bermakna sebagai preview
        last = cur.execute("""
            SELECT role, content, timestamp FROM messages
            WHERE session_id = ? AND role IN ('user','assistant') AND content != ''
            ORDER BY id DESC LIMIT 1
        """, (r['id'],)).fetchone()

        preview = ''
        last_role = 'user'
        ts = ''
        if last:
            content = last['content'] or ''
            # buang marker gambar/attachment biar preview bersih
            content = content.replace('\n', ' ').strip()
            for marker in ['[Image attached', '[screenshot]', '[OUT-OF-BAND']:
                idx = content.find(marker)
                if idx > 0:
                    content = content[:idx].strip()
            preview = content[:80]
            last_role = last['role']
            raw_ts = last['timestamp'] or ''
            ts = str(raw_ts)[:16]

        # label waktu: pakai session id (YYYYMMDD_HHMMSS)
        sid = r['id']
        try:
            label = f"{int(sid[6:8])}/{int(sid[4:6])} {sid[9:11]}.{sid[11:13]}"
        except Exception:
            label = ''

        sessions.append({
            "id": sid,
            "name": r['title'] or r['display_name'] or 'Chat Telegram',
            "preview": preview or '…',
            "last_role": last_role,
            "time": label,
            "message_count": r['message_count'] or 0,
        })

    con.close()
    data = {"sessions": sessions}
    _cache["data"] = data
    _cache["ts"] = now
    return data


@router.get("/messages/{session_id}")
def get_messages(session_id: str, limit: int = 50):
    """Pesan-pesan dari satu sesi Telegram (user & assistant saja)."""
    if not DB.exists():
        return {"messages": []}

    con = _connect()
    cur = con.cursor()

    rows = cur.execute("""
        SELECT role, content, timestamp FROM (
            SELECT id, role, content, timestamp FROM messages
            WHERE session_id = ? AND role IN ('user','assistant') AND content != ''
            ORDER BY id DESC LIMIT ?
        ) ORDER BY id ASC
    """, (session_id, limit)).fetchall()

    messages = []
    for r in rows:
        content = r['content'] or ''
        # bersihkan marker attachment dari tampilan
        for marker in ['[Image attached', '[screenshot]', '[OUT-OF-BAND USER MESSAGE', '[/OUT-OF-BAND USER MESSAGE]']:
            idx = content.find(marker)
            if idx > 0:
                content = content[:idx]
        content = content.strip()
        if not content:
            continue
        ts_raw = str(r['timestamp'] or '')
        # timestamp kadang aneh (year 2100+) — ambil dari session id kalau begitu
        try:
            if ts_raw[:4] and (int(ts_raw[:4]) > 2027 or int(ts_raw[:4]) < 2020):
                ts_raw = f"{session_id[6:8]}-{session_id[4:6]}-{session_id[0:4]} {session_id[9:11]}:{session_id[11:13]}"
        except Exception:
            pass
        messages.append({
            "role": r['role'],
            "text": content[:2000],
            "time": ts_raw[11:16] if len(ts_raw) >= 16 else '',
        })

    con.close()
    return {"messages": messages}
