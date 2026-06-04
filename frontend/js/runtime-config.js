/**
 * runtime-config.js
 * Inject backend base URL at runtime for static frontend deployments.
 *
 * On Railway, set FRONTEND_BACKEND_URL on the frontend service and this script
 * will consume it when a tiny env script sets window.__TS_ENV_BACKEND_URL.
 */
(function () {
    const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

    const injected = (window.__TS_ENV_BACKEND_URL || "").toString().trim();
    const normalized = injected ? injected.replace(/\/+$/, "") : "";

    window.__TS_CONFIG__ = window.__TS_CONFIG__ || {};
    window.__TS_CONFIG__.backendBase = normalized || (isLocal ? "http://localhost:5000" : "");
})();
