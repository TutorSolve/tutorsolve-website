/**
 * auth.js — Login, signup, logout, geo-check, password reset.
 */

function hasPendingQuestionDraft() {
    return Boolean(
        localStorage.getItem("ts_pending_order_draft_v1")
        || sessionStorage.getItem("pending_question")
    );
}

async function login(email, password) {
    const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.status === 403 && data.error === "BLOCKED_REGION") {
        if (typeof toast === "function") {
            toast("Access from your region is not permitted.", "error");
        }
        setTimeout(() => { window.location.href = "/"; }, 2000);
        return;
    }

    if (!res.ok) throw new Error(data.error || "Login failed");

    saveAuth(data.token, data.role);

    const studentRedirectUrl = hasPendingQuestionDraft() ? "/student/orders.html" : "/student/dashboard.html";

    const roleRedirects = {
        student: studentRedirectUrl,
        expert: "/expert/dashboard.html",
        employee: "/admin/dashboard.html",
        super_admin: "/super-admin/dashboard.html",
    };
    window.location.href = roleRedirects[data.role] || "/auth/login.html";
}

async function signup(formData) {
    const res = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify(formData)
    });
    const data = await res.json();

    if (res.status === 403 && data.error === "BLOCKED_REGION") {
        // Show a helpful message before redirecting
        if (typeof toast === "function") {
            toast("Student signups aren't available in your region. You can apply as an expert", "info");
        }
        setTimeout(() => {
            window.location.href = "/";
        }, 2000);
        return;
    }
    if (!res.ok) throw new Error(data.error || "Signup failed");

    saveAuth(data.token, data.role);

    // After signup, redirect to student orders if there's a pending question, else dashboard
    const redirectUrl = hasPendingQuestionDraft() ? "/student/orders.html" : "/student/dashboard.html";
    window.location.href = redirectUrl;
}

async function expertApply(formData) {
    // formData is a FormData object (for file uploads)
    const res = await apiFetch("/auth/expert-apply", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Application failed");
    return data;
}

async function forgotPassword(email) {
    const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to request password reset");
    return data;
}

async function resetPassword(email, token, new_password, confirm_password) {
    const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, new_password, confirm_password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reset password");
    return data;
}

function logout() {
    clearAuth();
    window.location.href = "/index.html";
}

async function geoCheck() {
    try {
        const res = await fetch(`${API_BASE}/auth/geo-check`);
        const data = await res.json();
        return data.blocked;
    } catch {
        return false;  // Fail open
    }
}
