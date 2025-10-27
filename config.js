// Configuration for Banner Management System
const CONFIG = {
  // Firebase Configuration (disabled for GitHub CDN approach)
  firebase: {
    enabled: false,
    apiKey: "AIzaSyAo2Wk8RHcwWb37lwW7SmTOuHU_Ozi5dUw",
    authDomain: "itsbillboard-transfer.firebaseapp.com",

    projectId: "itsbillboard-transfer",
    storageBucket: "itsbillboard-transfer.firebasestorage.app",
    messagingSenderId: "970392551771",
    appId: "1:970392551771:web:dc79da9f36bd40f4dd9a7e",
  },

  // MQTT Configuration
  mqtt: {
    broker: "wss://broker.hivemq.com:8884/mqtt", // Free HiveMQ broker
    topic: {
      bannerUpdate: "its/billboard/banner/update",
      bannerDelete: "its/billboard/banner/delete",
      bannerSync: "its/billboard/banner/sync",
      status: "its/billboard/status",
    },
    options: {
      connectTimeout: 4000,
      reconnectPeriod: 1000,
      clean: true,
      clientId: null, // Will be generated
    },
  },

  // Upload Settings
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/png", "image/jpeg", "image/jpg", "image/gif"],
    allowedExtensions: [".png", ".jpg", ".jpeg", ".gif"],
  },

  // App Settings
  app: {
    version: "1.0.0",
    name: "ITS Billboard Management",
    maxBanners: 20,
    defaultLoopDuration: 10,
  },
};

// Generate unique client ID for MQTT
CONFIG.mqtt.options.clientId = `banner_admin_${Math.random()
  .toString(16)
  .substr(2, 8)}_${Date.now()}`;

// Export config
window.BannerConfig = CONFIG;
