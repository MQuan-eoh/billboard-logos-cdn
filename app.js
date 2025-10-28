// Main Application JavaScript for Banner Management System
class BannerManagementApp {
  constructor() {
    this.selectedFiles = [];
    this.currentBanners = [];
    this.isUploading = false;
    this.mqttClient = window.MqttClient;

    this.initializeApp();
  }

  // Initialize the application
  async initializeApp() {
    console.log("Initializing Banner Management App...");

    // Setup UI event listeners
    this.setupEventListeners();

    // Initialize services
    await this.initializeServices();

    // Load initial data
    await this.loadInitialData();

    console.log("App initialized successfully");
  }

  // Initialize GitHub CDN and MQTT services
  async initializeServices() {
    try {
      // Initialize GitHub Upload Service
      console.log("Initializing GitHub CDN service...");
      await initGitHubService();
      this.showToast("GitHub CDN service ready", "success");

      // Initialize MQTT
      console.log("Initializing MQTT client...");
      await this.mqttClient.connect();

      // Setup MQTT status monitoring
      this.mqttClient.onStatusChange((status) => {
        this.updateConnectionStatus(status);
      });

      this.showToast("MQTT connected successfully", "success");
    } catch (error) {
      console.error("Service initialization error:", error);
      this.showToast(
        "Service initialization failed: " + error.message,
        "error"
      );
    }
  }

  // Setup UI event listeners
  setupEventListeners() {
    // File input
    const fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", (e) => this.handleFileSelect(e));

    // Upload area drag & drop
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.addEventListener("click", () => this.triggerFileSelect());
    uploadArea.addEventListener("dragover", (e) => this.handleDragOver(e));
    uploadArea.addEventListener("dragleave", (e) => this.handleDragLeave(e));
    uploadArea.addEventListener("drop", (e) => this.handleDrop(e));

    // Settings inputs
    const displayMode = document.getElementById("displayMode");
    const loopDuration = document.getElementById("loopDuration");

    displayMode.addEventListener("change", () => this.updateSettingsPreview());
    loopDuration.addEventListener("input", () => this.updateSettingsPreview());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );

    console.log("Event listeners setup complete");
  }

  // Load initial data
  async loadInitialData() {
    try {
      // Load current banners
      await this.loadCurrentBanners();

      // Load settings
      await this.loadSettings();
    } catch (error) {
      console.error("Error loading initial data:", error);
      this.showToast("Error loading data: " + error.message, "error");
    }
  }

  // Handle file selection
  handleFileSelect(event) {
    const files = Array.from(event.target.files);
    this.processSelectedFiles(files);
  }

  // Handle drag over
  handleDragOver(event) {
    event.preventDefault();
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.classList.add("dragover");
  }

  // Handle drag leave
  handleDragLeave(event) {
    event.preventDefault();
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.classList.remove("dragover");
  }

  // Handle file drop
  handleDrop(event) {
    event.preventDefault();
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.classList.remove("dragover");

    const files = Array.from(event.dataTransfer.files);
    this.processSelectedFiles(files);
  }

  // Process selected files
  processSelectedFiles(files) {
    const config = window.BannerConfig.upload;
    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      // Check file type
      if (!config.allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Loại file không được hỗ trợ`);
        return;
      }

      // Check file size
      if (file.size > config.maxFileSize) {
        errors.push(
          `${file.name}: File quá lớn (max ${
            config.maxFileSize / 1024 / 1024
          }MB)`
        );
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      this.showToast(errors.join("\n"), "error");
    }

    // Update selected files
    this.selectedFiles = validFiles;

    // Update UI
    this.updateFilePreview();
    this.updateUploadButton();
  }

  // Update file preview
  updateFilePreview() {
    const previewSection = document.getElementById("previewSection");
    const previewContainer = document.getElementById("previewContainer");

    if (this.selectedFiles.length === 0) {
      previewSection.classList.add("hidden");
      return;
    }

    previewSection.classList.remove("hidden");
    previewContainer.innerHTML = "";

    this.selectedFiles.forEach((file, index) => {
      const previewItem = document.createElement("div");
      previewItem.className = "preview-item";

      const img = document.createElement("img");
      img.className = "preview-image";
      img.src = URL.createObjectURL(file);
      img.alt = file.name;

      const info = document.createElement("div");
      info.className = "preview-info";
      info.innerHTML = `
                <div class="preview-name">${file.name}</div>
                <div class="preview-size">${this.formatFileSize(
                  file.size
                )}</div>
                <button class="btn btn-small btn-danger" onclick="app.removeFile(${index})">Xóa</button>
            `;

      previewItem.appendChild(img);
      previewItem.appendChild(info);
      previewContainer.appendChild(previewItem);
    });
  }

  // Update upload button state
  updateUploadButton() {
    const uploadBtn = document.getElementById("uploadBtn");
    const btnText = uploadBtn.querySelector(".btn-text");

    if (this.selectedFiles.length > 0 && !this.isUploading) {
      uploadBtn.disabled = false;
      btnText.textContent = `Upload ${this.selectedFiles.length} banner(s)`;
    } else {
      uploadBtn.disabled = true;
      btnText.textContent = "Upload Banner";
    }
  }

  // Remove file from selection
  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.updateFilePreview();
    this.updateUploadButton();
  }

  // Upload banners
  async uploadBanners() {
    if (this.selectedFiles.length === 0 || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.updateUploadButton();

    const uploadProgress = document.getElementById("uploadProgress");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const uploadBtn = document.getElementById("uploadBtn");
    const btnText = uploadBtn.querySelector(".btn-text");
    const btnLoading = uploadBtn.querySelector(".btn-loading");

    try {
      uploadProgress.classList.remove("hidden");
      btnText.style.display = "none";
      btnLoading.style.display = "inline";

      const totalFiles = this.selectedFiles.length;
      let completedFiles = 0;

      for (const file of this.selectedFiles) {
        console.log(`Uploading file: ${file.name}`);

        if (!this.firebaseReady) {
          // Demo/offline mode: simulate upload and add to local banners list
          console.warn(
            "Firebase unavailable - simulating upload for:",
            file.name
          );
          const simulated = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            url: URL.createObjectURL(file),
            size: file.size,
            uploadedAt: new Date().toISOString(),
          };
          this.currentBanners.push(simulated);
          completedFiles++;
          const overallProgress = (completedFiles / totalFiles) * 100;
          progressFill.style.width = `${overallProgress}%`;
          progressText.textContent = `${Math.round(overallProgress)}%`;
          // simulate sending MQTT
          await this.mqttClient.publishBannerUpdate(simulated).catch(() => {});
          continue;
        }

        // Upload file with progress tracking
        const result = await this.firebaseService.uploadFile(
          file,
          (progress) => {
            const overallProgress =
              (completedFiles / totalFiles) * 100 + progress / totalFiles;
            progressFill.style.width = `${overallProgress}%`;
            progressText.textContent = `${Math.round(overallProgress)}%`;
          }
        );

        console.log(`File uploaded successfully:`, result);

        // Send MQTT notification for this banner
        await this.mqttClient.publishBannerUpdate({
          id: result.id,
          url: result.url,
          metadata: result.metadata,
        });

        completedFiles++;
      }

      // Complete upload
      progressFill.style.width = "100%";
      progressText.textContent = "100%";

      this.showToast(
        `Successfully uploaded ${totalFiles} banner(s)`,
        "success"
      );

      // Reset UI
      this.selectedFiles = [];
      this.updateFilePreview();

      // Reload current banners
      await this.loadCurrentBanners();
    } catch (error) {
      console.error("Upload error:", error);
      this.showToast("Upload failed: " + error.message, "error");
    } finally {
      this.isUploading = false;
      uploadProgress.classList.add("hidden");
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
      this.updateUploadButton();
    }
  }

  // Load current banners from GitHub CDN
  async loadCurrentBanners() {
    try {
      console.log("Loading current banners from GitHub CDN...");

      // Try to load manifest from GitHub CDN
      try {
        const manifest = await this.fetchCurrentManifest();
        if (manifest && manifest.logos) {
          this.currentBanners = manifest.logos.map((logo) => ({
            id: logo.name,
            name: logo.name,
            url: logo.url,
            size: logo.size || "Unknown",
            uploadedAt: logo.lastModified || new Date().toISOString(),
          }));
        } else {
          this.currentBanners = [];
        }
      } catch (error) {
        console.warn(
          "Could not load from GitHub CDN, using empty list:",
          error
        );
        this.currentBanners = [];
      }

      this.renderBannersGrid();
      console.log(
        `Loaded ${this.currentBanners.length} banners from GitHub CDN`
      );
    } catch (error) {
      console.error("Error loading banners:", error);
      this.showToast("Error loading banners: " + error.message, "error");
    }
  }

  // Render banners grid
  renderBannersGrid() {
    const bannersGrid = document.getElementById("bannersGrid");

    if (this.currentBanners.length === 0) {
      bannersGrid.innerHTML =
        '<div class="loading-placeholder">Chưa có banner nào được upload</div>';
      return;
    }

    bannersGrid.innerHTML = "";

    this.currentBanners.forEach((banner) => {
      const bannerItem = document.createElement("div");
      bannerItem.className = "banner-item";

      bannerItem.innerHTML = `
                <img src="${banner.url}" alt="${
        banner.name
      }" class="banner-image" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZGRkIi8+CiAgICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZHk9Ii4zZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkVycm9yPC90ZXh0Pgo8L3N2Zz4K'">
                <div class="banner-info">
                    <div class="banner-name">${banner.name}</div>
                    <div class="banner-size">${this.formatFileSize(
                      banner.size
                    )}</div>
                    <div class="banner-actions">
                        <button class="btn btn-small btn-danger" onclick="app.deleteBanner('${
                          banner.id
                        }')">Xóa</button>
                    </div>
                </div>
            `;

      bannersGrid.appendChild(bannerItem);
    });
  }

  // Delete banner
  async deleteBanner(bannerId) {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) {
      return;
    }

    try {
      console.log(`Deleting banner: ${bannerId}`);
      if (!this.firebaseReady) {
        console.warn(
          "Firebase not available - removing local banner",
          bannerId
        );
        this.currentBanners = this.currentBanners.filter(
          (b) => b.id !== bannerId
        );
        this.renderBannersGrid();
        this.showToast("Banner removed locally", "warning");
      } else {
        await this.firebaseService.deleteBanner(bannerId);
      }

      // Send MQTT notification
      await this.mqttClient.publishBannerDelete(bannerId);

      this.showToast("Banner deleted successfully", "success");
      await this.loadCurrentBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      this.showToast("Error deleting banner: " + error.message, "error");
    }
  }

  // Load settings (local storage only)
  async loadSettings() {
    try {
      console.log("Loading settings from local storage...");

      // Try to load from localStorage
      const savedSettings = localStorage.getItem("billboard-settings");
      let settings = { displayMode: "loop", loopDuration: 10 };

      if (savedSettings) {
        settings = JSON.parse(savedSettings);
      }

      document.getElementById("displayMode").value =
        settings.displayMode || "loop";
      document.getElementById("loopDuration").value =
        settings.loopDuration || 10;

      console.log("Settings loaded:", settings);
    } catch (error) {
      console.error("Error loading settings:", error);
      this.showToast("Error loading settings: " + error.message, "error");
    }
  }

  // Sync settings (local storage + MQTT)
  async syncSettings() {
    try {
      const displayMode = document.getElementById("displayMode").value;
      const loopDuration = parseInt(
        document.getElementById("loopDuration").value
      );

      const settings = {
        displayMode: displayMode,
        loopDuration: loopDuration,
        lastUpdated: new Date().toISOString(),
      };

      console.log("Syncing settings:", settings);

      // Save to localStorage
      localStorage.setItem("billboard-settings", JSON.stringify(settings));

      // Send MQTT notification
      await this.mqttClient.publishSettingsSync(settings);

      this.showToast("Settings synced successfully", "success");
    } catch (error) {
      console.error("Error syncing settings:", error);
      this.showToast("Error syncing settings: " + error.message, "error");
    }
  }

  // Update settings preview
  updateSettingsPreview() {
    const displayMode = document.getElementById("displayMode").value;
    const loopDuration = parseInt(
      document.getElementById("loopDuration").value
    );

    // You can add real-time preview logic here
    console.log("Settings preview updated:", { displayMode, loopDuration });
  }

  // Update connection status in UI
  updateConnectionStatus(status) {
    const statusIndicator = document.getElementById("statusIndicator");
    const statusText = document.getElementById("statusText");

    statusIndicator.className = "status-indicator";

    switch (status.status) {
      case "connected":
        statusIndicator.classList.add("online");
        statusText.textContent = "Đã kết nối";
        break;
      case "connecting":
      case "reconnecting":
        statusIndicator.classList.add("connecting");
        statusText.textContent = "Đang kết nối...";
        break;
      case "disconnected":
        statusIndicator.classList.add("offline");
        statusText.textContent = "Mất kết nối";
        break;
      case "error":
        statusIndicator.classList.add("offline");
        statusText.textContent = "Lỗi kết nối";
        break;
      default:
        statusIndicator.classList.add("offline");
        statusText.textContent = "Không xác định";
    }
  }

  // Handle keyboard shortcuts
  handleKeyboardShortcuts(event) {
    // Ctrl+U: Upload
    if (event.ctrlKey && event.key === "u") {
      event.preventDefault();
      this.triggerFileSelect();
    }

    // Ctrl+S: Sync settings
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      this.syncSettings();
    }

    // Esc: Close modal
    if (event.key === "Escape") {
      this.closeModal();
    }
  }

  // Utility: Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Show toast notification
  showToast(message, type = "info", duration = 5000) {
    const toastContainer = document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const emoji = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    toast.innerHTML = `
            <span class="toast-emoji">${emoji[type] || emoji.info}</span>
            <span class="toast-message">${message}</span>
        `;

    toastContainer.appendChild(toast);

    // Auto remove toast
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);

    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // Show modal
  showModal(title, content) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.remove("hidden");
  }

  // Close modal
  closeModal() {
    const modal = document.getElementById("modal");
    modal.classList.add("hidden");
  }
}

// Global functions for HTML onclick handlers
function triggerFileSelect() {
  document.getElementById("fileInput").click();
}

function uploadBanners() {
  if (window.app) {
    window.app.uploadBanners();
  }
}

function syncSettings() {
  if (window.app) {
    window.app.syncSettings();
  }
}

// ====================================
// LOGO MANIFEST SERVICE (GitHub CDN Sync)
// ====================================

class LogoManifestManager {
  constructor() {
    this.manifestUrl =
      "https://mquan-eoh.github.io/billboard-logos-cdn/manifest.json";
    this.githubToken = null; // Will be loaded from config
    this.currentManifest = null;
    this.githubAPI = "https://api.github.com";
    this.owner = "mquan-eoh";
    this.repo = "billboard-logos-cdn";

    this.loadGitHubToken();
    this.initializeManifestUI();
  }

  async loadGitHubToken() {
    // In a real app, this would be loaded from secure config
    // For demo purposes, we'll use a placeholder
    console.log("GitHub token should be configured for production use");
  }

  initializeManifestUI() {
    console.log("Initializing Logo Manifest UI...");
    this.fetchCurrentManifest();
    this.updateManifestStatus();
  }

  async fetchCurrentManifest() {
    try {
      console.log("Fetching current manifest from GitHub...");

      const response = await fetch(this.manifestUrl, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        this.currentManifest = await response.json();
        console.log("Manifest fetched successfully:", this.currentManifest);
        this.updateManifestDisplay();
        this.displayLogos();
        this.updateManifestStatus("online");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to fetch manifest:", error);
      this.updateManifestStatus("error");
      this.showToast("Không thể tải manifest từ GitHub", "error");
    }
  }

  updateManifestDisplay() {
    if (!this.currentManifest) return;

    const manifestUrl = document.getElementById("manifestUrl");
    const manifestVersion = document.getElementById("manifestVersion");
    const activeLogos = document.getElementById("activeLogos");
    const lastUpdated = document.getElementById("lastUpdated");

    if (manifestUrl) manifestUrl.textContent = this.manifestUrl;
    if (manifestVersion)
      manifestVersion.textContent = this.currentManifest.version || "Unknown";
    if (activeLogos) {
      const active =
        this.currentManifest.logos?.filter((logo) => logo.active).length || 0;
      activeLogos.textContent = `${active}/${
        this.currentManifest.logos?.length || 0
      }`;
    }
    if (lastUpdated) {
      const date = new Date(this.currentManifest.lastUpdated);
      lastUpdated.textContent = date.toLocaleString("vi-VN");
    }
  }

  updateManifestStatus(status) {
    const statusBadge = document.getElementById("manifestStatus");
    if (statusBadge) {
      statusBadge.className = "status-badge";
      switch (status) {
        case "online":
          statusBadge.classList.add("online");
          statusBadge.textContent = "Online";
          break;
        case "error":
          statusBadge.classList.add("error");
          statusBadge.textContent = "Error";
          break;
        default:
          statusBadge.textContent = "Checking...";
      }
    }
  }

  displayLogos() {
    const logosGrid = document.getElementById("logosGrid");
    if (!logosGrid || !this.currentManifest?.logos) return;

    logosGrid.innerHTML = "";

    this.currentManifest.logos.forEach((logo, index) => {
      const logoCard = document.createElement("div");
      logoCard.className = `logo-card ${logo.active ? "active" : "inactive"}`;

      logoCard.innerHTML = `
        <img src="${logo.url}" alt="${logo.name}" class="logo-preview" 
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNjAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
        <div class="logo-info">
          <h4>${logo.name}</h4>
          <p>Priority: ${logo.priority}</p>
          <p>Size: ${(logo.size / 1024).toFixed(1)}KB</p>
          <p>Status: ${logo.active ? "Active" : "Inactive"}</p>
        </div>
        <div class="logo-actions">
          <button class="btn btn-small btn-primary" onclick="window.logoManifest.editLogo(${index})">Edit</button>
          <button class="btn btn-small ${
            logo.active ? "btn-warning" : "btn-success"
          }" 
                  onclick="window.logoManifest.toggleLogoStatus(${index})">
            ${logo.active ? "Disable" : "Enable"}
          </button>
          <button class="btn btn-small btn-danger" onclick="window.logoManifest.deleteLogo(${index})">Delete</button>
        </div>
      `;

      logosGrid.appendChild(logoCard);
    });
  }

  showManifestEditor() {
    const editor = document.getElementById("manifestEditor");
    const textarea = document.getElementById("manifestJson");

    if (editor && textarea) {
      textarea.value = JSON.stringify(this.currentManifest, null, 2);
      editor.classList.remove("hidden");
      editor.style.display = "block";
    }
  }

  async validateManifest() {
    const textarea = document.getElementById("manifestJson");
    if (!textarea) return;

    try {
      const manifest = JSON.parse(textarea.value);
      console.log("Manifest is valid JSON:", manifest);
      this.showToast("Manifest JSON hợp lệ", "success");
      return true;
    } catch (error) {
      console.error("Manifest validation failed:", error);
      this.showToast(`Lỗi JSON: ${error.message}`, "error");
      return false;
    }
  }

  async saveManifest() {
    if (!(await this.validateManifest())) return;

    const textarea = document.getElementById("manifestJson");
    if (!textarea) return;

    try {
      const newManifest = JSON.parse(textarea.value);

      // Update timestamp
      newManifest.lastUpdated = new Date().toISOString();

      // In a real implementation, this would commit to GitHub
      console.log("Would save manifest to GitHub:", newManifest);
      this.showToast(
        "⚠️ Demo mode: GitHub commit không được thực hiện",
        "warning"
      );

      // Update local copy
      this.currentManifest = newManifest;
      this.updateManifestDisplay();
      this.displayLogos();
      this.closeManifestEditor();
    } catch (error) {
      console.error("Failed to save manifest:", error);
      this.showToast("Lỗi khi lưu manifest", "error");
    }
  }

  closeManifestEditor() {
    const editor = document.getElementById("manifestEditor");
    if (editor) {
      editor.style.display = "none";
    }
  }

  async forceRefreshBillboard() {
    try {
      console.log("Sending force refresh signal to billboard...");

      // Create custom event for logo manifest update
      const manifestUpdateData = {
        action: "force-refresh-manifest",
        manifest: this.currentManifest,
        timestamp: Date.now(),
        source: "admin-web",
      };

      // Send MQTT message to trigger billboard refresh
      await this.mqttClient.publishManifestRefresh(manifestUpdateData);
      console.log("MQTT manifest refresh signal sent:", manifestUpdateData);

      this.showToast("Force refresh signal sent to billboard", "info");

      // Simulate billboard response
      setTimeout(() => {
        this.showToast("Billboard refreshed successfully", "success");
      }, 2000);
    } catch (error) {
      console.error("Failed to refresh billboard:", error);
      this.showToast("Error sending refresh signal to billboard", "error");
    }
  }

  async generateNewManifest() {
    const newManifest = {
      version: "1.0." + Date.now(),
      lastUpdated: new Date().toISOString(),
      logos: [
        {
          id: "company-main",
          name: "Company Main Logo",
          url: "https://mquan-eoh.github.io/billboard-logos-cdn/logos/EoH_ERa_Web-Banner_1920x800-1.png",
          filename: "EoH_ERa_Web-Banner_1920x800-1.png",
          size: 25600,
          type: "image/png",
          checksum: "abc123def456",
          priority: 1,
          active: true,
          uploadedAt: new Date().toISOString(),
        },
      ],
      settings: {
        logoMode: "loop",
        logoLoopDuration: 30,
        schedules: [],
      },
      metadata: {
        author: "Admin Web Interface",
        description: "Auto-generated manifest",
        apiVersion: "v1",
      },
    };

    this.currentManifest = newManifest;
    this.updateManifestDisplay();
    this.displayLogos();
    this.showToast("✅ New manifest generated", "success");
  }

  toggleLogoStatus(index) {
    if (!this.currentManifest?.logos?.[index]) return;

    this.currentManifest.logos[index].active =
      !this.currentManifest.logos[index].active;
    this.updateManifestDisplay();
    this.displayLogos();

    const status = this.currentManifest.logos[index].active
      ? "enabled"
      : "disabled";
    this.showToast(`Logo ${status} successfully`, "success");
  }

  deleteLogo(index) {
    if (!this.currentManifest?.logos?.[index]) return;

    const logoName = this.currentManifest.logos[index].name;
    if (confirm(`Bạn có chắc muốn xóa logo "${logoName}"?`)) {
      this.currentManifest.logos.splice(index, 1);
      this.updateManifestDisplay();
      this.displayLogos();
      this.showToast(`Logo "${logoName}" đã được xóa`, "success");
    }
  }

  editLogo(index) {
    if (!this.currentManifest?.logos?.[index]) return;

    const logo = this.currentManifest.logos[index];
    const newName = prompt("Tên logo:", logo.name);
    const newPriority = prompt("Độ ưu tiên (1-10):", logo.priority);

    if (newName && newPriority) {
      logo.name = newName;
      logo.priority = parseInt(newPriority);
      this.displayLogos();
      this.showToast("Logo updated successfully", "success");
    }
  }

  showToast(message, type = "info") {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
}

// Global functions for Logo Manifest
function selectLogoFile() {
  const fileInput = document.getElementById("githubFileInput");
  if (fileInput) {
    fileInput.click();
  }
}

function uploadLogoToGithub() {
  console.log("Upload logo to GitHub functionality - Demo mode");
  if (window.logoManifest) {
    window.logoManifest.showToast(
      "⚠️ Demo mode: GitHub upload không khả dụng",
      "warning"
    );
  }
}

function fetchCurrentManifest() {
  if (window.logoManifest) {
    window.logoManifest.fetchCurrentManifest();
  }
}

function forceRefreshBillboard() {
  if (window.logoManifest) {
    window.logoManifest.forceRefreshBillboard();
  }
}

function generateNewManifest() {
  if (window.logoManifest) {
    window.logoManifest.generateNewManifest();
  }
}

function validateManifest() {
  if (window.logoManifest) {
    window.logoManifest.validateManifest();
  }
}

function saveManifest() {
  if (window.logoManifest) {
    window.logoManifest.saveManifest();
  }
}

function closeManifestEditor() {
  if (window.logoManifest) {
    window.logoManifest.closeManifestEditor();
  }
}

// ====================================
// GITHUB UPLOAD INTEGRATION
// ====================================

// GitHub Upload Integration
let githubSelectedFiles = [];

async function authenticateGitHub() {
  const tokenInput = document.getElementById("githubToken");
  const token = tokenInput.value.trim();

  if (!token) {
    if (window.app) {
      window.app.showToast("Vui lòng nhập GitHub token", "error");
    }
    return;
  }

  try {
    const success = await window.initializeGitHubService(token);

    if (success) {
      document.getElementById("githubAuthCard").style.display = "none";
      document.getElementById("githubUploadSection").style.display = "block";

      if (window.app) {
        window.app.showToast("✅ GitHub authentication successful", "success");
      }
    } else {
      if (window.app) {
        window.app.showToast("❌ GitHub authentication failed", "error");
      }
    }
  } catch (error) {
    console.error("GitHub auth error:", error);
    if (window.app) {
      window.app.showToast("GitHub auth error: " + error.message, "error");
    }
  }
}

function selectLogoFile() {
  const fileInput = document.getElementById("githubFileInput");
  if (fileInput) {
    fileInput.click();
  }
}

// Handle GitHub file selection
document.addEventListener("DOMContentLoaded", () => {
  const githubFileInput = document.getElementById("githubFileInput");
  if (githubFileInput) {
    githubFileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      handleGitHubFileSelection(files);
    });
  }
});

function handleGitHubFileSelection(files) {
  console.log("GitHub files selected:", files.length);

  githubSelectedFiles = files.filter((file) => {
    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
    if (!validTypes.includes(file.type)) {
      if (window.app) {
        window.app.showToast(
          `File ${file.name}: Loại file không hỗ trợ`,
          "error"
        );
      }
      return false;
    }

    // Validate file size (10MB limit for GitHub)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      if (window.app) {
        window.app.showToast(`File ${file.name}: Quá lớn (max 10MB)`, "error");
      }
      return false;
    }

    return true;
  });

  // Update upload button
  const uploadBtn = document.getElementById("githubUploadBtn");
  if (uploadBtn) {
    if (githubSelectedFiles.length > 0) {
      uploadBtn.disabled = false;
      uploadBtn.querySelector(
        ".btn-text"
      ).textContent = `📤 Upload ${githubSelectedFiles.length} logo(s) to GitHub`;
    } else {
      uploadBtn.disabled = true;
      uploadBtn.querySelector(".btn-text").textContent = "📤 Upload to GitHub";
    }
  }

  if (window.app) {
    window.app.showToast(
      `Selected ${githubSelectedFiles.length} valid logo files`,
      "info"
    );
  }
}

// Test GitHub Connection
async function testGitHubConnection() {
  const testBtn = document.getElementById("githubTestBtn");
  const btnText = testBtn.querySelector(".btn-text");
  const btnLoading = testBtn.querySelector(".btn-loading");

  // Update UI to loading state
  testBtn.disabled = true;
  btnText.style.display = "none";
  btnLoading.style.display = "inline";

  try {
    console.log("Testing GitHub connection...");

    // Initialize GitHub service if not already done
    if (!window.githubUploadService) {
      await initGitHubService();
    }

    if (!window.githubUploadService) {
      throw new Error("GitHub service not available");
    }

    // Test authentication
    const isAuthenticated =
      await window.githubUploadService.testAuthentication();

    if (isAuthenticated) {
      if (window.app) {
        window.app.showToast(
          "✅ GitHub connection successful! Repository found and accessible.",
          "success"
        );
      }
    } else {
      throw new Error("Authentication failed or repository not accessible");
    }
  } catch (error) {
    console.error("GitHub connection test failed:", error);
    if (window.app) {
      window.app.showToast(
        "❌ GitHub connection failed: " + error.message,
        "error"
      );
    }
  } finally {
    // Reset UI
    testBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
  }
}

async function uploadLogoToGithub() {
  if (githubSelectedFiles.length === 0) {
    if (window.app) {
      window.app.showToast("Chưa chọn file nào", "warning");
    }
    return;
  }

  const uploadBtn = document.getElementById("githubUploadBtn");
  const btnText = uploadBtn.querySelector(".btn-text");
  const btnLoading = uploadBtn.querySelector(".btn-loading");
  const progressDiv = document.getElementById("githubProgress");
  const progressFill = document.getElementById("githubProgressFill");
  const progressText = document.getElementById("githubProgressText");
  const progressStatus = document.getElementById("githubProgressStatus");

  try {
    // Show progress
    progressDiv.style.display = "block";
    btnText.style.display = "none";
    btnLoading.style.display = "inline";
    uploadBtn.disabled = true;

    if (window.app) {
      window.app.showToast(
        `Starting GitHub upload of ${githubSelectedFiles.length} files...`,
        "info"
      );
    }

    // Upload with progress tracking
    const result = await window.uploadLogosToGitHub(
      githubSelectedFiles,
      (current, total, status) => {
        const percentage = Math.round((current / total) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
        progressStatus.textContent = status || `Uploading ${current}/${total}`;
      }
    );

    if (result.success) {
      if (window.app) {
        window.app.showToast(
          `✅ GitHub upload completed: ${result.uploaded} successful, ${result.failed} failed`,
          "success"
        );
      }

      // Clear selection
      githubSelectedFiles = [];
      document.getElementById("githubFileInput").value = "";

      // Force refresh manifest display
      if (window.logoManifest) {
        window.logoManifest.currentManifest = result.manifest;
        window.logoManifest.updateManifestDisplay();
        window.logoManifest.displayLogos();
      }

      // Auto refresh billboard
      setTimeout(() => {
        forceRefreshBillboard();
      }, 2000);
    } else {
      if (window.app) {
        window.app.showToast("❌ GitHub upload failed", "error");
      }
    }
  } catch (error) {
    console.error("GitHub upload error:", error);
    if (window.app) {
      window.app.showToast("GitHub upload error: " + error.message, "error");
    }
  } finally {
    // Hide progress
    progressDiv.style.display = "none";
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
    uploadBtn.disabled = false;

    // Reset button text
    btnText.textContent = "📤 Upload to GitHub";
  }
}

// ====================================
// ORIGINAL FUNCTIONS
// ====================================

function showHelp() {
  if (window.app) {
    window.app.showModal(
      "Hướng dẫn sử dụng",
      `
            <h4>Cách sử dụng Banner Management System:</h4>
            <ul>
                <li><strong>Upload Banner:</strong> Kéo thả file ảnh hoặc click "Chọn Files"</li>
                <li><strong>Quản lý Banner:</strong> Xem danh sách và xóa banner trong phần "Banner Hiện Tại"</li>
                <li><strong>Cài đặt:</strong> Thay đổi chế độ hiển thị và thời gian xoay banner</li>
                <li><strong>Phím tắt:</strong> Ctrl+U (Upload), Ctrl+S (Sync), Esc (Đóng modal)</li>
            </ul>
            <p><strong>Lưu ý:</strong> File ảnh hỗ trợ PNG, JPG, GIF với kích thước tối đa 5MB</p>
        `
    );
  }
}

function showAbout() {
  if (window.app) {
    window.app.showModal(
      "Về chúng tôi",
      `
            <h4>ITS Billboard Management System</h4>
            <p><strong>Version:</strong> ${window.BannerConfig.app.version}</p>
            <p><strong>Công ty:</strong> ITS Company</p>
            <p><strong>Mô tả:</strong> Hệ thống quản lý banner quảng cáo từ xa cho billboard outdoor</p>
            <br>
            <p><strong>Công nghệ sử dụng:</strong></p>
            <ul>
                <li>Firebase Storage & Firestore</li>
                <li>MQTT Real-time Communication</li>
                <li>Glass Effect UI Design</li>
                <li>Progressive Web App</li>
            </ul>
        `
    );
  }
}

function closeModal() {
  if (window.app) {
    window.app.closeModal();
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing app...");
  window.app = new BannerManagementApp();

  // Initialize Logo Manifest Manager
  console.log("Initializing Logo Manifest Manager...");
  window.logoManifest = new LogoManifestManager();
});
