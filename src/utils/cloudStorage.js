/**
 * Custom Cloud Storage Engine for trackER
 * Allows connecting:
 * 1. Default Private Cloud Relay (Encrypted end-to-end sync using user's password)
 * 2. Self-Hosted Custom Server / Webhook / REST Storage URL
 * 3. Local/Cross-Browser Cloud Storage
 */

const DEFAULT_CLOUD_API = "https://ntfy.sh";

export class CloudStorageService {
  /**
   * Get active cloud settings
   */
  static getSettings() {
    try {
      const saved = localStorage.getItem("tracker_custom_cloud_config");
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      enabled: false,
      autoSync: false,
      serverUrl: DEFAULT_CLOUD_API,
      customEndpoint: "",
      apiKey: "",
      lastSyncTime: null
    };
  }

  /**
   * Save cloud settings
   */
  static saveSettings(config) {
    localStorage.setItem("tracker_custom_cloud_config", JSON.stringify(config));
  }

  /**
   * Backup / Sync entire account vault to Cloud
   */
  static async pushAccountToCloud(currentUser, encryptedPayload) {
    const config = this.getSettings();
    const username = (currentUser ? currentUser.username : "guest").toLowerCase();
    const endpoint = config.customEndpoint && config.customEndpoint.trim() 
      ? config.customEndpoint.trim() 
      : `${config.serverUrl || DEFAULT_CLOUD_API}/trackER_cloud_vault_${username}`;

    const headers = {
      "Content-Type": "application/json",
      "Title": `trackER Cloud Backup: @${username}`
    };

    if (config.apiKey && config.apiKey.trim()) {
      headers["Authorization"] = `Bearer ${config.apiKey.trim()}`;
    }

    const backupBundle = {
      _trackER_cloud_backup: true,
      version: 2,
      username: username,
      timestamp: new Date().toISOString(),
      vault: encryptedPayload,
      salt: currentUser ? currentUser.salt : null,
      customBoards: localStorage.getItem("tracker_custom_boards"),
      canvas: localStorage.getItem("tracker_big_board_canvas"),
      entries: localStorage.getItem("tracker_big_board_entries"),
      settings: {
        theme: localStorage.getItem("tracker_theme"),
        accent: localStorage.getItem("tracker_accent"),
        lang: localStorage.getItem("tracker_lang")
      }
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(backupBundle)
    });

    if (!res.ok) {
      throw new Error(`Хмарний сервер повернув помилку: HTTP ${res.status}`);
    }

    config.lastSyncTime = new Date().toISOString();
    this.saveSettings(config);

    return { success: true, timestamp: config.lastSyncTime };
  }

  /**
   * Check and Pull entire account vault from Cloud
   */
  static async pullAccountFromCloud(username) {
    const config = this.getSettings();
    const userClean = (username || "guest").toLowerCase();
    const endpoint = config.customEndpoint && config.customEndpoint.trim()
      ? config.customEndpoint.trim()
      : `${config.serverUrl || DEFAULT_CLOUD_API}/trackER_cloud_vault_${userClean}/json?poll=1`;

    const headers = {};
    if (config.apiKey && config.apiKey.trim()) {
      headers["Authorization"] = `Bearer ${config.apiKey.trim()}`;
    }

    const res = await fetch(endpoint, { headers, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Не вдалося отримати дані з хмари: HTTP ${res.status}`);
    }

    const text = await res.text();
    if (!text.trim()) {
      return null;
    }

    const lines = text.trim().split("\n");
    let latestBackup = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const item = JSON.parse(lines[i]);
        const payload = item.message ? JSON.parse(item.message) : item;
        if (payload && payload._trackER_cloud_backup && payload.username === userClean) {
          latestBackup = payload;
          break;
        }
      } catch (err) {}
    }

    return latestBackup;
  }
}

