/**
 * api.js — Central fetch wrapper for all API calls.
 * Handles JWT token injection, 401 redirect, and JSON parsing.
 */

const _runtimeBackendBase =
    (window.__TS_CONFIG__ && window.__TS_CONFIG__.backendBase)
    ? String(window.__TS_CONFIG__.backendBase).replace(/\/+$/, "")
    : "";

const API_BASE = _runtimeBackendBase
    ? `${_runtimeBackendBase}/api`
    : (
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
            ? "http://localhost:5000/api"
            : "https://YOUR_RAILWAY_BACKEND_URL/api"
    );

function normalizeRole(role) {
    const r = (role || "").toString().trim().toLowerCase();
    if (r === "superadmin" || r === "super-admin" || r === "super admin" || r === "super_admin") {
        return "super_admin";
    }
    return r;
}

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("ts_token");
    const headers = {
        ...options.headers
    };

    // Only set Content-Type for JSON bodies
    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchOptions = {
        ...options,
        headers
    };

    const res = await fetch(`${API_BASE}${path}`, fetchOptions);
    if (res.status === 401 && !path.includes("/auth/login")) {
        localStorage.removeItem("ts_token");
        localStorage.removeItem("ts_role");
        window.location.href = "/auth/login.html";
        return;
    }

    return res;
}

function getToken() { return localStorage.getItem("ts_token"); }
function getRole() { return normalizeRole(localStorage.getItem("ts_role")); }
function isLoggedIn() { return !!getToken(); }

function saveAuth(token, role) {
    localStorage.setItem("ts_token", token);
    localStorage.setItem("ts_role", normalizeRole(role));
}

function clearAuth() {
    localStorage.removeItem("ts_token");
    localStorage.removeItem("ts_role");
}

function requireRole(expectedRole) {
    if (!isLoggedIn()) {
        window.location.href = "/auth/login.html";
        return false;
    }
    const role = getRole();
    if (role !== normalizeRole(expectedRole)) {
        window.location.href = "/auth/login.html";
        return false;
    }
    return true;
}

// Initialize Chatwoot SDK globally
(function(d,t) {
    var BASE_URL="https://app.chatwoot.com";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.async = true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: 'EnrgswkA2MhhyTPpNxEU48t5',
        baseUrl: BASE_URL
      })
    }
})(document,"script");
