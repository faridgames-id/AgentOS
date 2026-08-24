"""Send API — kirim teks/gambar/dokumen dari dashboard chat ke Telegram Bos Farid."""
import os
import urllib.request
import urllib.parse
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel

router = APIRouter()

ENV_PATH = Path.home() / '.hermes' / '.env'


def _env(key: str) -> str:
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(errors='ignore').splitlines():
            if line.startswith(f'{key}='):
                return line.split('=', 1)[1].strip().strip('"').strip("'")
    return ''


class SendText(BaseModel):
    text: str


class SendFile(BaseModel):
    path: str
    caption: str = ''


def _bot_token() -> str:
    token = _env('TELEGRAM_BOT_TOKEN')
    if not token:
        raise HTTPException(500, 'TELEGRAM_BOT_TOKEN tidak ditemukan di ~/.hermes/.env')
    return token


def _chat_id() -> str:
    cid = _env('TELEGRAM_HOME_CHANNEL')
    return cid or '7351829098'


@router.get("/health")
def health():
    return {"bot_configured": bool(_env('TELEGRAM_BOT_TOKEN')), "chat_id": _chat_id()}


@router.post("/text")
def send_text(body: SendText):
    """Kirim pesan teks ke Telegram Bos (sebagai Cozy)."""
    text = body.text.strip()
    if not text:
        raise HTTPException(400, 'teks kosong')
    token = _bot_token()
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({
        'chat_id': _chat_id(),
        'text': text[:4000],
        'parse_mode': 'HTML',
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
    except Exception as e:
        raise HTTPException(502, f'gagal kirim: {e}')
    if not result.get('ok'):
        raise HTTPException(502, f"telegram error: {result.get('description')}")
    return {"ok": True, "message_id": result['result']['message_id']}


UPLOAD_DIR = Path.home() / '.hermes' / 'cache' / 'files'


@router.post("/upload")
async def upload_file(file: UploadFile):
    """Terima file dari dashboard, simpan ke cache, balikin path-nya."""
    ALLOWED_SEND_ROOTS.append  # keep reference
    if not file.filename:
        raise HTTPException(400, 'no file')
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_SEND_EXT:
        raise HTTPException(403, f'ext {ext} not allowed')
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    import time as _t
    dest = UPLOAD_DIR / f"upload_{int(_t.time())}_{file.filename}"
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(413, 'file > 50MB')
    dest.write_bytes(content)
    return {"ok": True, "path": str(dest)}


ALLOWED_SEND_ROOTS = [
    Path.home() / '.hermes' / 'cache' / 'images',
    Path.home() / '.hermes' / 'cache' / 'files',
    Path.home() / 'Downloads',
]
ALLOWED_SEND_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt', '.csv', '.xlsx', '.docx'}


@router.post("/file")
def send_file(body: SendFile):
    """Kirim gambar/dokumen dari server ke Telegram Bos."""
    p = Path(body.path).resolve()
    if not any(p.is_relative_to(root.resolve()) for root in ALLOWED_SEND_ROOTS if root.exists()):
        raise HTTPException(403, 'path not allowed')
    if p.suffix.lower() not in ALLOWED_SEND_EXT:
        raise HTTPException(403, 'ext not allowed')
    if not p.exists():
        raise HTTPException(404, 'file not found')

    token = _bot_token()
    is_image = p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    method = 'sendPhoto' if is_image else 'sendDocument'
    field = 'photo' if is_image else 'document'

    # multipart sederhana tanpa dependency eksternal
    boundary = '----CozyOSBoundary'
    caption = (body.caption or (' dari Agent OS dashboard')).encode()
    with open(p, 'rb') as f:
        file_bytes = f.read()
    fname = p.name

    parts = []
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{_chat_id()}\r\n'.encode()
    )
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n'.encode() + caption + b'\r\n'
    )
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{fname}"\r\n'
        f'Content-Type: application/octet-stream\r\n\r\n'.encode() + file_bytes + b'\r\n'
    )
    parts.append(f'--{boundary}--\r\n'.encode())
    body_bytes = b''.join(parts)

    url = f"https://api.telegram.org/bot{token}/{method}"
    req = urllib.request.Request(url, data=body_bytes, headers={
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
    except Exception as e:
        raise HTTPException(502, f'gagal kirim: {e}')
    if not result.get('ok'):
        raise HTTPException(502, f"telegram error: {result.get('description')}")
    return {"ok": True, "message_id": result['result']['message_id'], "file": fname}
