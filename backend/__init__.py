from flask import Flask
from .app.routes.core import bp as core_bp
from .app.routes.api.v1 import api_v1_bp

def create_app() -> "Flask":
    app = Flask(__name__)

    # Core (no prefix): /health, /version
    app.register_blueprint(core_bp)

    # Versioned API
    app.register_blueprint(api_v1_bp, url_prefix="/api/v1")

    # JSON behavior (optional niceties)
    app.config.update(JSON_SORT_KEYS=False)

    return app
