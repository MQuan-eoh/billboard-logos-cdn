// Firebase Configuration and Service
class FirebaseService {
  constructor() {
    this.app = null;
    this.storage = null;
    this.firestore = null;
    this.initialized = false;
  }

  // Initialize Firebase
  async initialize() {
    try {
      console.log("Initializing Firebase...");

      // Initialize Firebase App
      this.app = firebase.initializeApp(window.BannerConfig.firebase);

      // Initialize Services
      this.storage = firebase.storage();
      this.firestore = firebase.firestore();

      this.initialized = true;
      console.log("Firebase initialized successfully");

      return true;
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      this.showToast(
        "Firebase initialization failed: " + error.message,
        "error"
      );
      return false;
    }
  }

  // Upload file to Firebase Storage
  async uploadFile(file, progressCallback) {
    if (!this.initialized) {
      throw new Error("Firebase not initialized");
    }

    try {
      const fileName = `banners/${Date.now()}_${file.name}`;
      const storageRef = this.storage.ref(fileName);

      // Start upload
      const uploadTask = storageRef.put(file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          // Progress callback
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (progressCallback) {
              progressCallback(progress);
            }
          },
          // Error callback
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          },
          // Complete callback
          async () => {
            try {
              const downloadURL =
                await uploadTask.snapshot.ref.getDownloadURL();

              // Save metadata to Firestore
              const metadata = {
                name: file.name,
                url: downloadURL,
                size: file.size,
                type: file.type,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                active: true,
              };

              const docRef = await this.firestore
                .collection("banners")
                .add(metadata);

              resolve({
                id: docRef.id,
                url: downloadURL,
                metadata: metadata,
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Upload file error:", error);
      throw error;
    }
  }

  // Get all banners from Firestore
  async getBanners() {
    if (!this.initialized) {
      throw new Error("Firebase not initialized");
    }

    try {
      const snapshot = await this.firestore
        .collection("banners")
        .where("active", "==", true)
        .orderBy("uploadedAt", "desc")
        .get();

      const banners = [];
      snapshot.forEach((doc) => {
        banners.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return banners;
    } catch (error) {
      console.error("Get banners error:", error);
      throw error;
    }
  }

  // Delete banner
  async deleteBanner(bannerId) {
    if (!this.initialized) {
      throw new Error("Firebase not initialized");
    }

    try {
      // Mark as inactive instead of deleting
      await this.firestore.collection("banners").doc(bannerId).update({
        active: false,
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Delete banner error:", error);
      throw error;
    }
  }

  // Get banner settings
  async getSettings() {
    if (!this.initialized) {
      throw new Error("Firebase not initialized");
    }

    try {
      const doc = await this.firestore
        .collection("settings")
        .doc("banner")
        .get();

      if (doc.exists) {
        return doc.data();
      } else {
        // Return default settings
        const defaultSettings = {
          displayMode: "loop",
          loopDuration: 10,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Save default settings
        await this.firestore
          .collection("settings")
          .doc("banner")
          .set(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error("Get settings error:", error);
      throw error;
    }
  }

  // Update banner settings
  async updateSettings(settings) {
    if (!this.initialized) {
      throw new Error("Firebase not initialized");
    }

    try {
      const updatedSettings = {
        ...settings,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await this.firestore
        .collection("settings")
        .doc("banner")
        .set(updatedSettings, { merge: true });
      return true;
    } catch (error) {
      console.error("Update settings error:", error);
      throw error;
    }
  }

  // Show toast notification
  showToast(message, type = "info") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
}

// Create global Firebase service instance
window.FirebaseService = new FirebaseService();
