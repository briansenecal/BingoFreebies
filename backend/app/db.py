from __future__ import annotations
from sqlalchemy import create_engine, text, event
from sqlalchemy.engine import Engine, Connection
import os

_ENGINE: Engine | None = None

class ConfigError(RuntimeError):
    """Raised when required DB configuration is missing or invalid."""


def get_database_url() -> str:
    """
    Return the SQLAlchemy URL from the environment.
    Fail fast with a clear error if it's not set.
    """
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise ConfigError(
            "DATABASE_URL is not set. Example:\n"
            "mysql+pymysql://bf_app:<URL-ENCODED_PW>@127.0.0.1:3306/bingo_freebies?charset=utf8mb4"
        )
    return url

def get_engine() -> Engine:
    """Create (once) and return the SQLAlchemy Engine."""
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    url = get_database_url()  # expects env var DATABASE_URL

    engine = create_engine(
        url,
        pool_size=5,
        max_overflow=5,
        pool_pre_ping=True,
        pool_recycle=1800,
        future=True,
        echo=False,
    )

    # Force UTC per DB connection
    @event.listens_for(engine, "connect")
    def _set_session_utc(dbapi_conn, _):  # noqa: N802 (callback name)
        with dbapi_conn.cursor() as cur:
            cur.execute("SET time_zone = '+00:00'")

    # Warm-up probe: fail fast if misconfigured
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    _ENGINE = engine
    return engine

def connect() -> Connection:
    """Borrow a DB connection (use as a context manager)."""
    return get_engine().connect()


def transaction():
    """Begin a transaction (context manager: commit on success, rollback on error)."""
    return get_engine().begin()


def check_health() -> dict:
    """Lightweight health probe for /health."""
    with get_engine().connect() as conn:
        ok = conn.execute(text("SELECT 1")).scalar() == 1
        tz = conn.execute(text("SELECT @@time_zone")).scalar()
        ver = conn.execute(text("SELECT VERSION()")).scalar()
    return {"ok": ok, "time_zone": tz, "version": ver}
