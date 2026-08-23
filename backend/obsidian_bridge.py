from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Hermes Obsidian Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

APIKEY_PATH = Path.home() / ".hermes" / "obsidian_mcp" / "apikey.txt"
VAULT_PATH = Path.home() / "obsidian-vault"

class NoteRequest(BaseModel):
    title: str
    content: str
    folder: str = "Inbox"
    tags: List[str] = []

class TransactionNote(BaseModel):
    amount: float
    type: str
    category: str
    date: str
    description: str = ""

@app.get("/")
def read_root():
    return {"status": "ok", "service": "hermes-obsidian-bridge"}

@app.get("/health")
def health_check():
    return {"ready": True}

@app.get("/apikey")
def get_apikey():
    if APIKEY_PATH.exists():
        return {"apikey": APIKEY_PATH.read_text().strip()}
    raise HTTPException(404, "apikey not found")

@app.get("/vault/status")
def vault_status():
    if not VAULT_PATH.exists():
        return {"exists": False, "note_count": 0}
    
    notes = list(VAULT_PATH.glob("*.md"))
    last_updated = None
    if notes:
        mtime = max(n.stat().st_mtime for n in notes)
        last_updated = datetime.fromtimestamp(mtime).isoformat()
    
    return {
        "exists": True,
        "path": str(VAULT_PATH),
        "note_count": len(notes),
        "last_updated": last_updated
    }

@app.get("/vault/notes")
def list_notes():
    if not VAULT_PATH.exists():
        return []
    
    notes = []
    for md_file in VAULT_PATH.glob("*.md"):
        content = md_file.read_text()
        title = content.split("\n")[0].replace("# ", "").strip() if content.startswith("#") else md_file.stem
        notes.append({
            "filename": md_file.name,
            "title": title,
            "updated": datetime.fromtimestamp(md_file.stat().st_mtime).isoformat(),
            "size": md_file.stat().st_size
        })
    
    return sorted(notes, key=lambda x: x["updated"], reverse=True)

@app.get("/vault/notes/{filename}")
def get_note(filename: str):
    note_path = VAULT_PATH / filename
    if not note_path.exists():
        raise HTTPException(404, "Note not found")
    
    return {
        "filename": filename,
        "content": note_path.read_text(),
        "updated": datetime.fromtimestamp(note_path.stat().st_mtime).isoformat()
    }

@app.post("/vault/notes")
def create_note(note: NoteRequest):
    folder_path = VAULT_PATH / note.folder
    folder_path.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_title = "".join(c if c.isalnum() else "_" for c in note.title)[:50]
    filename = f"{timestamp}_{safe_title}.md"
    
    content = f"# {note.title}\n\n"
    content += f"Created: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    
    if note.tags:
        content += "Tags: " + " ".join(f"#{tag}" for tag in note.tags) + "\n\n"
    
    content += note.content + "\n"
    
    note_path = folder_path / filename
    note_path.write_text(content)
    
    return {"success": True, "filename": filename, "path": str(note_path)}

@app.post("/vault/finance/tracking")
def add_finance_tracking(tx: TransactionNote):
    folder_path = VAULT_PATH / "Finance"
    folder_path.mkdir(parents=True, exist_ok=True)
    
    date_str = tx.date or datetime.now().strftime("%Y-%m-%d")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    type_icon = "🟢" if tx.type == "income" else "🔴"
    sign = "+" if tx.type == "income" else "-"
    
    content = f"# {tx.category} - {tx.type.title()}\n\n"
    content += f"**Amount:** {type_icon} Rp {tx.amount:,}\n"
    content += f"**Date:** {date_str}\n"
    content += f"**Type:** {tx.type.title()}\n\n"
    
    if tx.description:
        content += f"**Description:** {tx.description}\n\n"
    
    content += f"---\n*Added by Hermes Vision OS at {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n"
    
    filename = f"{timestamp}_{tx.type}_{tx.category.replace(' ', '_')}.md"
    note_path = folder_path / filename
    note_path.write_text(content)
    
    return {"success": True, "filename": filename, "path": str(note_path)}

@app.post("/vault/finance/summary")
def add_finance_summary(income: float, expense: float, net: float, month: str = ""):
    folder_path = VAULT_PATH / "Finance"
    folder_path.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    month_label = month or datetime.now().strftime('%B %Y')
    
    content = f"# Finance Summary - {month_label}\n\n"
    content += "| Metric | Amount |\n"
    content += "|--------|--------|\n"
    content += f"| 💰 Income | Rp {income:,} |\n"
    content += f"| 💸 Expense | Rp {expense:,} |\n"
    content += f"| 📈 Net Profit | Rp {net:,} |\n\n"
    content += "---\n*Auto-generated by Hermes Vision OS*\n"
    
    filename = f"{timestamp}_summary_{month or datetime.now().strftime('%Y_%m')}.md"
    note_path = folder_path / filename
    note_path.write_text(content)
    
    return {"success": True, "filename": filename}

@app.get("/vault/agents")
def get_agents_status():
    return {
        "agents": [
            {"name": "NOVA", "status": "idle", "role": "Research"},
            {"name": "CIPHER", "status": "idle", "role": "Development"},
            {"name": "ATLAS", "status": "idle", "role": "Finance"},
            {"name": "PIXEL", "status": "idle", "role": "Creative"},
            {"name": "ORACLE", "status": "idle", "role": "Insights"},
            {"name": "SENTINEL", "status": "idle", "role": "Security"},
            {"name": "AURORA", "status": "idle", "role": "Content"},
            {"name": "PHOENIX", "status": "idle", "role": "Automation"},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=27125)
