# ITS Billboard Admin Web - Setup Guide

## 🚀 Trang quản lý banner quảng cáo từ xa cho Billboard Outdoor

Admin web này cho phép upload và quản lý banner quảng cáo cho màn hình billboard outdoor từ bất kỳ đâu thông qua internet.

## ✨ Tính năng

- 🎨 **Glass Effect UI** - Giao diện hiện đại với hiệu ứng kính mờ
- 📁 **Drag & Drop Upload** - Kéo thả file dễ dàng
- ⚡ **Real-time Sync** - Đồng bộ real-time qua MQTT
- 🔥 **Firebase Storage** - Lưu trữ file miễn phí 5GB
- 📱 **Responsive Design** - Hoạt động trên mọi thiết bị
- 🔒 **Secure** - Xác thực và bảo mật

## 🛠️ Setup Instructions

### Bước 1: Setup Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới: `its-billboard-management`
3. Kích hoạt các dịch vụ:

   - **Storage**: Lưu trữ file banner
   - **Firestore**: Database metadata
   - **Authentication** (optional): Bảo mật

4. Lấy Firebase config và cập nhật trong `config.js`:

```javascript
const CONFIG = {
  firebase: {
    apiKey: "your-firebase-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id",
  },
};
```

### Bước 2: Cấu hình Firebase Security Rules

**Storage Rules (`storage.rules`):**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /banners/{allPaths=**} {
      allow read, write: if true; // Hoặc thêm authentication
    }
  }
}
```

**Firestore Rules (`firestore.rules`):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /banners/{document} {
      allow read, write: if true; // Hoặc thêm authentication
    }
    match /settings/{document} {
      allow read, write: if true;
    }
  }
}
```

### Bước 3: Deploy lên GitHub Pages

1. **Enable GitHub Pages** trong repository settings:

   - Settings → Pages
   - Source: GitHub Actions

2. **Push code lên repository**:

   ```bash
   git add .
   git commit -m "Add admin web with banner management"
   git push origin main
   ```

3. **Access admin web** tại: `https://your-username.github.io/your-repo-name/`

### Bước 4: Cấu hình Desktop App

Desktop app đã được tích hợp sẵn banner sync service. Chỉ cần đảm bảo:

1. **MQTT connection** hoạt động (đã dùng HiveMQ free broker)
2. **Downloads folder** tồn tại để cache banner
3. **Config.json** có section `bannerSync` enabled

## 📋 Hướng dẫn sử dụng

### Upload Banner

1. Truy cập admin web
2. Kéo thả file ảnh hoặc click "Chọn Files"
3. Preview và click "Upload Banner"
4. Banner sẽ tự động sync xuống desktop app

### Quản lý Banner

- **Xem danh sách**: Section "Banner Hiện Tại"
- **Xóa banner**: Click nút "Xóa" trên từng banner
- **Cài đặt hiển thị**: Chọn chế độ Loop/Fixed/Scheduled

### Cài đặt đồng bộ

- **Chế độ hiển thị**: Loop (xoay vòng), Fixed (cố định), Scheduled (theo lịch)
- **Thời gian xoay**: 1-60 giây
- Click "Đồng bộ cài đặt" để áp dụng

## 🔧 Technical Architecture

```
Admin Web (GitHub Pages)
    ↓ Upload
Firebase Storage (5GB free)
    ↓ Metadata
Firebase Firestore (1GB free)
    ↓ MQTT Notification
HiveMQ Cloud (100 connections free)
    ↓ Real-time sync
Desktop App (Mini PC)
    ↓ Display
Billboard LED Screen (384x384)
```

## 🎛️ MQTT Topics

- `its/billboard/banner/update` - New banner uploaded
- `its/billboard/banner/delete` - Banner deleted
- `its/billboard/banner/sync` - Settings synchronized

## 📱 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## 🔒 Security Notes

- Sử dụng Firebase Security Rules để bảo vệ
- Có thể thêm Firebase Authentication
- HTTPS mandatory cho GitHub Pages
- MQTT over WSS (encrypted)

## 🆘 Troubleshooting

### Admin Web không kết nối được Firebase

1. Kiểm tra Firebase config trong `config.js`
2. Đảm bảo Firebase project đã enable Storage + Firestore
3. Check console browser cho error details

### Desktop App không nhận được banner mới

1. Kiểm tra MQTT connection status
2. Verify topics configuration
3. Check downloads folder permissions
4. Restart desktop app nếu cần

### Upload file bị lỗi

1. File size < 5MB
2. Format hỗ trợ: PNG, JPG, JPEG, GIF
3. Stable internet connection
4. Firebase quota chưa vượt limit

## 📞 Support

Nếu gặp vấn đề, check:

1. Browser console logs
2. Desktop app logs
3. Firebase console
4. Network connectivity

---

**🎯 Mục tiêu**: Zero-cost solution với 99.9% uptime cho billboard management!
