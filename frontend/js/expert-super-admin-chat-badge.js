(function () {
  function normalizeRole(role) {
    const value = (role || "").toString().trim().toLowerCase();
    if (value === "superadmin" || value === "super-admin" || value === "super admin") {
      return "super_admin";
    }
    return value;
  }

  const currentRole =
    typeof getRole === "function"
      ? getRole()
      : normalizeRole(localStorage.getItem("ts_role"));

  if (currentRole !== "expert") return;

  const badgeEl = document.getElementById("sa-chat-unread-badge");
  if (!badgeEl) return;

  const token = localStorage.getItem("ts_token");
  if (!token) return;

  const onChatPage = window.location.pathname.includes("/expert/super-admin-chat");
  let knownThreadId = null;
  let pollTimer = null;
  let isRefreshing = false;
  let standaloneSocket = null;

  function setBadge(count) {
    const n = Number(count) || 0;
    if (onChatPage) {
      badgeEl.textContent = "0";
      badgeEl.classList.remove("show");
      return;
    }

    if (n > 0) {
      badgeEl.textContent = n > 99 ? "99+" : String(n);
      badgeEl.classList.add("show");
    } else {
      badgeEl.textContent = "0";
      badgeEl.classList.remove("show");
    }
  }

  async function refreshUnreadCount() {
    if (isRefreshing) return;
    isRefreshing = true;
    try {
      const res = await apiFetch("/expert/super-admin-chat/unread-count");
      if (!res || !res.ok) return;

      const payload = await res.json();
      knownThreadId = payload.thread_id || knownThreadId;
      setBadge(payload.unread_count || 0);
    } catch (_err) {
      // Best-effort feature. Ignore transient failures.
    } finally {
      isRefreshing = false;
    }
  }

  function scheduleRefresh(delayMs) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(refreshUnreadCount, delayMs || 100);
  }

  function onSocketNotification(data) {
    if (!data || data.type !== "new_message") return;
    if (knownThreadId && data.thread_id && data.thread_id !== knownThreadId) return;
    scheduleRefresh(onChatPage ? 250 : 120);
  }

  function attachSocketListeners(sock) {
    if (!sock) return;
    sock.off("notification", onSocketNotification);
    sock.on("notification", onSocketNotification);
  }

  function setupSocket() {
    if (typeof io === "undefined") return;

    if (typeof getChatSocket === "function") {
      const chatSocketPoll = setInterval(function () {
        const sock = getChatSocket();
        if (!sock) return;

        if (sock.connected) {
          clearInterval(chatSocketPoll);
          attachSocketListeners(sock);
          return;
        }

        clearInterval(chatSocketPoll);
        sock.once("connect", function () {
          attachSocketListeners(sock);
        });
      }, 250);
      return;
    }

    if (standaloneSocket) return;

    const runtimeBackendBase =
      window.__TS_CONFIG__ && window.__TS_CONFIG__.backendBase
        ? String(window.__TS_CONFIG__.backendBase).replace(/\/+$/, "")
        : "";
    const socketBase = runtimeBackendBase ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "https://YOUR_RAILWAY_BACKEND_URL");

    standaloneSocket = io(socketBase, {
      auth: { token: token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    standaloneSocket.on("connect", function () {
      attachSocketListeners(standaloneSocket);
    });
  }

  refreshUnreadCount();
  setupSocket();

  setInterval(refreshUnreadCount, 45000);
  window.addEventListener("focus", function () {
    scheduleRefresh(150);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      scheduleRefresh(150);
    }
  });
})();
