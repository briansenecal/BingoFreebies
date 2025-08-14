"""
DB Smoke Test for BingoFreebies

Save as: scripts/db_smoketest.py

Usage (preferred: use your .env or OS env var for DATABASE_URL):
  python scripts/db_smoketest.py

Or pass a URL explicitly:
  python scripts/db_smoketest.py --url "mysql+pymysql://bf_app:PW@127.0.0.1:3307/bingo_freebies?charset=utf8mb4"

Tip (SSH tunnel on your laptop):
  ssh -N -L 3307:127.0.0.1:3306 emberbeacon
  # then use port 3307 in the URL above
"""
from __future__ import annotations

import os
import sys
import argparse
from contextlib import suppress

# Optional: load a .env file if python-dotenv is installed
with suppress(Exception):
    # Looks for .env in CWD; adjust path if you keep it elsewhere
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()

def main() -> int:
    parser = argparse.ArgumentParser(description="MariaDB connection smoke test")
    parser.add_argument(
        "--url",
        dest="url",
        default=os.environ.get("DATABASE_URL"),
        help="SQLAlchemy URL. If omitted, reads DATABASE_URL from environment.",
    )
    args = parser.parse_args()

    url = args.url
    print("DATABASE_URL =", url or "<missing>")

    if not url:
        print("ERROR: No URL provided. Set DATABASE_URL or pass --url.", file=sys.stderr)
        return 2

    try:
        from sqlalchemy import create_engine, text
    except Exception as e:
        print("ERROR: sqlalchemy not installed (pip install sqlalchemy pymysql).", file=sys.stderr)
        print(e, file=sys.stderr)
        return 2

    try:
        eng = create_engine(
            url,
            pool_pre_ping=True,     # auto-drop dead connections
            pool_recycle=1800,      # recycle every 30m to avoid stale conns
            future=True,
        )
        with eng.connect() as conn:
            version = conn.execute(text("SELECT VERSION()")).scalar()
            tz      = conn.execute(text("SELECT @@time_zone")).scalar()
            now     = conn.execute(text("SELECT NOW()")).scalar()
            utcnow  = conn.execute(text("SELECT UTC_TIMESTAMP()")).scalar()
            dbname  = conn.execute(text("SELECT DATABASE()")).scalar()

        print("Connected ✅")
        print(f"Server version : {version}")
        print(f"Current DB     : {dbname}")
        print(f"time_zone      : {tz}")
        print(f"NOW()          : {now}")
        print(f"UTC_TIMESTAMP(): {utcnow}")
        return 0

    except Exception as e:
        print("Connection FAILED ❌", file=sys.stderr)
        print(f"{type(e).__name__}: {e}", file=sys.stderr)
        # Common hints
        print(
            "\nHints:\n"
            "- If using an SSH tunnel, is it running (and are you using the right local port, e.g., 3307)?\n"
            "- Does the user have grants for the host you're connecting from (127.0.0.1 vs localhost)?\n"
            "- Is the database name correct (bingo_freebies)?\n"
            "- Driver installed? (pip install sqlalchemy pymysql)\n",
            file=sys.stderr,
        )
        return 3

if __name__ == "__main__":
    sys.exit(main())
