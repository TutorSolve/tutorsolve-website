from flask import Flask
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge
from config import Config
from app.extensions import init_db, jwt, mail, socketio
from app.celery_app import make_celery

celery = None  # module-level reference

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS — allow frontend origin to call the API
    CORS(app, resources={r"/api/*": {
        "origins": "*",  # For development, allow all to bypass localhost/127.0.0.1 issues
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }}, supports_credentials=True)

    # Init extensions
    init_db(app)
    jwt.init_app(app)
    mail.init_app(app)

    global celery
    celery = make_celery(app)

    # SocketIO init — allow all origins in development.
    # CRITICAL: message_queue is REQUIRED when emitting socket events from HTTP routes
    # (like notification_service does during create_order). Without it, emitting
    # from a different greenlet corrupts the socketio gevent loop, permanently
    # breaking chat until restart.
    socketio.init_app(
        app,
        cors_allowed_origins="*",
        async_mode="gevent",
        message_queue=app.config.get("REDIS_SOCKETIO_URL", "redis://localhost:6379/0"),
        logger=False,
        engineio_logger=False,
        ping_timeout=60,
        ping_interval=25
    )

    # Register blueprints — all routes are under /api/
    from app.blueprints.auth       import auth_bp
    from app.blueprints.student    import student_bp
    from app.blueprints.expert     import expert_bp
    from app.blueprints.admin      import admin_bp
    from app.blueprints.super_admin import super_admin_bp
    from app.blueprints.api        import api_bp

    app.register_blueprint(auth_bp,         url_prefix="/api/auth")
    app.register_blueprint(student_bp,      url_prefix="/api/student")
    app.register_blueprint(expert_bp,       url_prefix="/api/expert")
    app.register_blueprint(admin_bp,        url_prefix="/api/admin")
    app.register_blueprint(super_admin_bp,  url_prefix="/api/superadmin")
    app.register_blueprint(api_bp,          url_prefix="/api")

    app.register_blueprint(abstract_admin_bp, url_prefix="/api/admin") if 'abstract_admin_bp' in locals() else None

    # Register SocketIO event handlers
    from app.sockets import chat  # noqa
    from app.sockets import notifications  # noqa

    @app.get("/")
    def root_ok():
        return {"status": "ok", "service": "tutorsolve-backend"}, 200

    @app.get("/health")
    def health_ok():
        return {"status": "healthy"}, 200

    @app.errorhandler(RequestEntityTooLarge)
    def file_too_large(_err):
        max_mb = int((app.config.get("MAX_CONTENT_LENGTH") or 0) / (1024 * 1024))
        return {"error": f"File too large. Maximum allowed size is {max_mb}MB."}, 413

    return app
