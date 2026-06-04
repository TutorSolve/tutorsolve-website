/**
 * pending-question.js
 * Persists a pre-auth question draft (including files) so it can be auto-submitted
 * after a student logs in or signs up.
 */

(function () {
  const DRAFT_KEY = "ts_pending_order_draft_v1";
  const DB_NAME = "ts_pending_order_draft_db";
  const STORE_NAME = "files";

  function hasIndexedDb() {
    return typeof window !== "undefined" && "indexedDB" in window;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!hasIndexedDb()) {
        reject(new Error("IndexedDB is not supported in this browser."));
        return;
      }

      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("Failed to open draft DB"));
    });
  }

  async function clearFiles() {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to clear draft files"));
    });
    db.close();
  }

  async function saveFiles(files) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();

      files.forEach((file, idx) => {
        store.put({
          id: idx + 1,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          lastModified: file.lastModified || Date.now(),
          blob: file,
        });
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Failed to save draft files"));
    });
    db.close();
  }

  async function getFiles() {
    if (!hasIndexedDb()) return [];

    const db = await openDb();
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error || new Error("Failed to read draft files"));
    });
    db.close();

    return rows
      .sort((a, b) => a.id - b.id)
      .map((row) => {
        try {
          return new File([row.blob], row.name, {
            type: row.type || "application/octet-stream",
            lastModified: row.lastModified || Date.now(),
          });
        } catch (_err) {
          const fallbackBlob = row.blob instanceof Blob
            ? row.blob
            : new Blob([row.blob], { type: row.type || "application/octet-stream" });
          fallbackBlob.name = row.name;
          fallbackBlob.lastModified = row.lastModified || Date.now();
          return fallbackBlob;
        }
      });
  }

  function readDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_err) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
  }

  async function saveDraft(payload, files) {
    const cleanPayload = {
      title: (payload.title || "").trim(),
      domain_id: payload.domain_id || "",
      description: (payload.description || "").trim(),
      deadline: payload.deadline || null,
      created_at: new Date().toISOString(),
    };

    if (!cleanPayload.title) {
      throw new Error("Title is required.");
    }
    if (!cleanPayload.domain_id) {
      throw new Error("Domain is required.");
    }

    const fileList = Array.isArray(files) ? files : [];
    if (!hasIndexedDb() && fileList.length > 0) {
      throw new Error("Your browser cannot persist files before login. Please use a modern browser.");
    }

    localStorage.setItem(DRAFT_KEY, JSON.stringify(cleanPayload));
    if (hasIndexedDb()) {
      await saveFiles(fileList);
    }
    return cleanPayload;
  }

  async function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    if (!hasIndexedDb()) return;
    try {
      await clearFiles();
    } catch (_err) {
      // Ignore cleanup failures to avoid blocking UI.
    }
  }

  function hasDraft() {
    return !!readDraft();
  }

  window.PendingQuestionDraft = {
    DRAFT_KEY,
    hasDraft,
    getDraft: readDraft,
    getFiles,
    saveDraft,
    clearDraft,
  };
})();
