"""Media API — serve gambar/attachment dari cache Hermes untuk chat dashboard."""
import re
import mimetypes
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

ALLOWED_ROOTS = [
    Path.home() / '.hermes' / 'cache' / 'images',
    Path.home() / '.hermes' / 'cache' / 'files',
    Path.home() / 'Downloads',
]
ALLOWED_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt', '.csv', '.xlsx', '.docx'}

# regex path file di dalam konten pesan
PATH_RE = re.compile(r'/home/ubuntu/[^\s\]\[)]+\.(?:jpg|jpeg|png|webp|gif|pdf|txt|csv|xlsx|docx)', re.I)


def extract_media_paths(content: str) -> list[str]:
    """Ambil semua path file dari teks pesan."""
    if not content:
        return []
    seen = set()
    out = []
    for p in PATH_RE.findall(content):
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


@router.get("/file")
def get_file(path: str):
    """Serve file media dengan whitelist direktori & ekstensi."""
    p = Path(path).resolve()
    # keamanan: harus di dalam root yang diizinkan & ekstensi dikenal
    if not any(p.is_relative_to(root.resolve()) for root in ALLOWED_ROOTS if root.exists()):
        raise HTTPException(403, 'path not allowed')
    if p.suffix.lower() not in ALLOWED_EXT:
        raise HTTPException(403, 'ext not allowed')
    if not p.exists():
        raise HTTPException(404, 'file not found')
    mt = mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
    return FileResponse(p, media_type=mt)
