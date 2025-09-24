from flask import Blueprint, jsonify
from pathlib import Path
from sqlalchemy import text
from ..db import check_health, get_engine
from sqlalchemy.exc import DBAPIError

bp = Blueprint("core", __name__)

@bp.get("/health")
def health():
    """Basic liveness check that verifies DB connectivity."""
    try:
        data = check_health()
        return jsonify(data), (200 if data.get("ok") else 500)
    except Exception as exc:
        # Unpack DBAPI error details (e.g., 2003 connect refused, 1045 access denied)
        detail = {"ok": False, "error": type(exc).__name__}
        if isinstance(exc, DBAPIError) and getattr(exc, "orig", None):
            args = getattr(exc.orig, "args", ())
            if isinstance(args, (tuple, list)) and args:
                # MySQL/MariaDB usually: (code, message)
                detail["dbapi_code"] = args[0]
                if len(args) > 1:
                    detail["dbapi_msg"] = str(args[1])[:500]
            else:
                detail["dbapi_orig"] = str(exc.orig)[:500]

        # Show where we tried to connect (no secrets)
        try:
            u = get_engine().url
            detail["target"] = {
                "driver": u.drivername,
                "host": u.host,
                "port": u.port,
                "database": u.database,
            }
        except Exception:
            pass

        return jsonify(detail), 500


@bp.get("/version")
def version():
    # App version from backend/VERSION
    ver_path = Path(__file__).resolve().parents[2] / "VERSION"
    app_ver = ver_path.read_text(encoding="utf-8").strip() if ver_path.exists() else "0.0.0"

    # Alembic schema head (if migrations are set up)
    try:
        with get_engine().connect() as conn:
            db_schema = conn.execute(text("SELECT version_num FROM alembic_version")).scalar() or "unknown"
    except Exception:
        db_schema = "unknown"

    return jsonify({
        "app_version": app_ver,
        "api_version": "v1",
        "db_schema": db_schema,
    })
