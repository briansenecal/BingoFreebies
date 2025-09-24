from flask import request, jsonify
from datetime import datetime
from . import api_v1_bp as bp

def _parse_iso8601(s: str | None):
    if not s:
        return None
    # Accept trailing 'Z' (UTC) and convert to a Python-aware datetime
    return datetime.fromisoformat(s.replace("Z", "+00:00"))

@bp.post("/freebies/ingest")
def ingest_freebie():
    """Accept a freebie JSON payload, validate it, and acknowledge receipt."""
    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"ok": False, "error": "InvalidJSON"}), 400

    # Required top-level fields
    required = ["title", "source", "posted_at_utc", "links"]
    missing = [k for k in required if k not in (payload or {})]
    if missing:
        return jsonify({"ok": False, "error": "MissingFields", "fields": missing}), 400

    # Validate dates
    try:
        posted = _parse_iso8601(payload["posted_at_utc"])
        expires = _parse_iso8601(payload.get("expires_at_utc"))
    except Exception:
        return jsonify({"ok": False, "error": "BadDateFormat", "hint": "Use ISO-8601, e.g. 2025-08-15T07:00:00Z"}), 400

    # Validate links array
    links = payload["links"]
    if not isinstance(links, list) or not links:
        return jsonify({"ok": False, "error": "LinksMustBeNonEmptyArray"}), 400
    for i, item in enumerate(links):
        if not isinstance(item, dict) or "url" not in item or "variant" not in item:
            return jsonify({"ok": False, "error": "BadLinkItem", "index": i}), 400

    # Skeleton: no DB yet — just acknowledge
    variants = sorted({str(x.get("variant")) for x in links if isinstance(x, dict)})
    return jsonify({
        "ok": True,
        "received": {
            "title": payload["title"],
            "source": payload["source"],
            "posted_at_utc": posted.isoformat().replace("+00:00", "Z") if posted else None,
            "expires_at_utc": expires.isoformat().replace("+00:00", "Z") if expires else None,
            "recurring_interval_hours": payload.get("recurring_interval_hours"),
            "links_count": len(links),
            "variants": variants,
        }
    }), 202  # 202 Accepted since we didn't persist anything yet
