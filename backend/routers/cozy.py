"""Cozy OS live status API — reads REAL data from Hermes runtime on this machine."""
import os
import re
import sqlite3
import subprocess
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter

router = APIRouter()

HERMES_DIR = Path.home() / ".hermes"


def _read_gateway_log_tail(lines: int = 400):
    """Read recent gateway log lines (journalctl user unit) — best effort."""
    try:
        out = subprocess.run(
            ["journalctl", "--user", "-u", "hermes-gateway", "-n", str(lines), "--no-pager", "-o", "short-iso"],
            capture_output=True, text=True, timeout=6,
        )
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip().splitlines()
    except Exception:
        pass
    return []


def _parse_cron_jobs():
    """Parse real cron jobs from ~/.hermes/cron state + config files."""
    jobs = []
    # 1) ticker dirs = jobs that have run
    cron_dir = HERMES_DIR / "cron"
    tickers = {}
    if (cron_dir / "ticker_last_success").exists():
        try:
            for line in (cron_dir / "ticker_last_success").read_text().splitlines():
                parts = line.strip().split("|", 1)
                if len(parts) == 2:
                    tickers[parts[0].strip()] = parts[1].strip()
        except Exception:
            pass
    # 2) jobs defined in cron jobs file(s)
    candidates = [cron_dir / "jobs.json", cron_dir / "jobs.yaml", cron_dir / "jobs.yml"]
    defined = {}
    for c in candidates:
        if c.exists():
            try:
                import json
                data = json.loads(c.read_text())
                if isinstance(data, dict):
                    defined = data.get("jobs", data)
                elif isinstance(data, list):
                    defined = {str(i): j for i, j in enumerate(data)}
                break
            except Exception:
                pass
    # 3) fallback: parse `hermes cron list` output
    if not defined:
        try:
            out = subprocess.run(["hermes", "cron", "list"], capture_output=True, text=True, timeout=8)
            text = out.stdout.strip()
            if text and "No scheduled jobs" not in text:
                # crude parse: lines like "job_id  name  schedule"
                for line in text.splitlines():
                    m = re.match(r"^([a-f0-9-]{8,})\s+(.+?)\s{2,}(.+)$", line.strip())
                    if m:
                        defined[m.group(1)] = {"name": m.group(2), "schedule": m.group(3)}
        except Exception:
            pass

    for job_id, meta in defined.items():
        if isinstance(meta, str):
            meta = {"schedule": meta}
        name = meta.get("name") or meta.get("prompt", "")[:40] or job_id[:8]
        schedule = meta.get("schedule", meta.get("cron", "?"))
        agent = meta.get("agent", "COZY")
        last = tickers.get(job_id, tickers.get(f"{job_id}_last", ""))
        status = "active"
        jobs.append({
            "id": job_id[:8] if len(job_id) > 8 else job_id,
            "name": name,
            "schedule": schedule,
            "agent": agent,
            "status": status,
            "last_run": last or None,
        })
    return jobs


def _recent_activity(limit: int = 8):
    """Build real activity feed from gateway log + cron outputs."""
    activities = []
    # cron outputs
    out_dir = cron_out = HERMES_DIR / "cron" / "output"
    try:
        files = sorted(out_dir.glob("*"), key=lambda p: p.stat().st_mtime, reverse=True)[:limit]
        for f in files:
            if f.is_file():
                activities.append({
                    "agent": "CRON",
                    "task": f.stem.replace("_", " ")[:60],
                    "status": "done",
                    "time": datetime.fromtimestamp(f.stat().st_mtime).strftime("%H:%M"),
                })
    except Exception:
        pass

    # gateway log lines (tool calls, errors, model switches)
    for line in _read_gateway_log_tail(200)[::-1]:
        low = line.lower()
        agent = "COZY"
        for name in ["atlas", "zephra", "cipher", "nova", "sentinel", "phoenix", "oracle", "pixel", "aurora"]:
            if name in low:
                agent = name.upper()
                break
        if "tool" in low or "cron" in low or "error" in low or "model" in low or "telegram" in low:
            msg = re.sub(r"^\S+\s*", "", line)[:70]
            status = "done"
            if "error" in low or "fail" in low:
                status = "failed"
            elif "run" in low or "start" in low:
                status = "running"
            activities.append({
                "agent": agent,
                "task": msg,
                "status": status,
                "time": line[11:16] if len(line) > 16 else "",
            })
        if len(activities) >= limit:
            break
    return activities[:limit]


def _system_stats():
    """Real system stats: CPU, RAM, uptime, gateway health."""
    stats = {"cpu": None, "mem": None, "gateway": False, "uptime": None}
    try:
        load1 = os.getloadavg()[0]
        cores = os.cpu_count() or 1
        stats["cpu"] = round(min(100, load1 / cores * 100), 1)
    except Exception:
        pass
    try:
        meminfo = {}
        for line in Path("/proc/meminfo").read_text().splitlines():
            k, v = line.split(":", 1)
            meminfo[k.strip()] = int(v.strip().split()[0])  # kB
        total = meminfo.get("MemTotal", 1)
        avail = meminfo.get("MemAvailable", 0)
        stats["mem"] = round((total - avail) / total * 100, 1)
    except Exception:
        pass
    try:
        out = subprocess.run(["systemctl", "--user", "is-active", "--quiet", "hermes-gateway"], capture_output=True, timeout=4)
        stats["gateway"] = out.returncode == 0
    except Exception:
        pass
    if not stats["gateway"]:
        # fallback: cek proses gateway langsung
        try:
            out = subprocess.run(["pgrep", "-f", "gateway run"], capture_output=True, text=True, timeout=4)
            stats["gateway"] = out.returncode == 0
        except Exception:
            pass
    try:
        out = subprocess.run(["uptime", "-p"], capture_output=True, text=True, timeout=4)
        stats["uptime"] = out.stdout.strip().replace("up ", "")
    except Exception:
        pass
    return stats


@router.get("/cron")
def get_cron_jobs():
    return {"jobs": _parse_cron_jobs(), "stats": _system_stats()}


@router.get("/activity")
def get_activity():
    return {"activities": _recent_activity(), "stats": _system_stats()}
