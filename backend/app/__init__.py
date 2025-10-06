from flask import Flask

def create_app() -> "Flask":
    app = Flask(__name__)

    print(">>> Entering create_app")

    try:
        from .routes.core import bp as core_bp
        app.register_blueprint(core_bp)
        print(">>> core_bp registered")
    except Exception as e:
        print("!!! core_bp failed:", e)

    try:
        from .routes.api.v1 import api_v1_bp
        app.register_blueprint(api_v1_bp, url_prefix="/api/v1")
        print(">>> api_v1_bp registered")
    except Exception as e:
        print("!!! api_v1_bp failed:", e)

    app.config.update(JSON_SORT_KEYS=False)

    return app

