# ITS Billboard Admin Web - GitHub CDN Setup Guide

## 🚀 Trang quản lý banner quảng cáo từ xa cho Billboard Outdoor

Admin web này cho phép upload và quản lý banner quảng cáo cho màn hình billboard outdoor từ bất kỳ đâu thông qua internet.

## ✨ Tính năng

- 🎨 **Glass Effect UI** - Giao diện hiện đại với hiệu ứng kính mờ
- 📁 **Drag & Drop Upload** - Kéo thả file dễ dàng
- ⚡ **Real-time Sync** - Đồng bộ real-time qua MQTT
- � **GitHub CDN** - Lưu trữ và sync qua GitHub Pages (miễn phí unlimited)
- 📱 **Responsive Design** - Hoạt động trên mọi thiết bị
- 🔒 **Secure** - Xác thực qua GitHub Personal Access Token

## 🛠️ Setup Instructions

### Bước 1: Setup GitHub Repository

1. Tạo repository mới: `billboard-logos-cdn`
2. Đặt repository là **Public** (để sử dụng GitHub Pages miễn phí)
3. Enable GitHub Pages trong Settings → Pages → Source: GitHub Actions
4. Tạo GitHub Personal Access Token với quyền `repo`

### Bước 2: Cấu hình GitHub Token

1. Truy cập [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Chọn scopes: `repo` (full control of private repositories)

### Bước 3: Cấu hình GitHub Actions Workflow

Repository sẽ tự động tạo GitHub Actions workflow để build manifest khi có upload mới:

1. File `.github/workflows/deploy-manifest.yml` đã được tạo sẵn
2. Workflow sẽ tự động chạy khi có file mới được upload
3. Manifest sẽ được deploy lên GitHub Pages

### Bước 4: Cấu hình Desktop App

Desktop app đã được tích hợp sẵn logo sync service. Chỉ cần đảm bảo:

1. **MQTT connection** hoạt động (đã dùng HiveMQ free broker)
2. **Logo manifest service** đã enable để poll GitHub CDN
3. **GitHub Pages URL** được cấu hình đúng trong logoManifestService.ts

## 📋 Hướng dẫn sử dụng

### Upload Logo với GitHub CDN

1. **Mở admin web**: `admin-web/index.html`
2. **Test GitHub Connection**: Bấm "🔍 Test GitHub Connection" để kiểm tra
3. **Chọn logo files**: Drag & drop hoặc click để chọn
4. **Upload**: Bấm "📤 Upload to GitHub"
5. **Kiểm tra**: Logo sẽ hiển thị trên desktop app sau ~30 giây

6. Truy cập admin web
7. Kéo thả file ảnh hoặc click "Chọn Files"
8. Preview và click "Upload Banner"
9. Banner sẽ tự động sync xuống desktop app

### Quản lý Logo

- **Xem danh sách**: Section "Banner Hiện Tại" sẽ load từ GitHub CDN
- **Upload mới**: Sử dụng GitHub Upload section
- **Cài đặt hiển thị**: Chọn chế độ Loop/Fixed/Scheduled (lưu local)

### Cài đặt đồng bộ

- **Chế độ hiển thị**: Loop (xoay vòng), Fixed (cố định), Scheduled (theo lịch)
- **Thời gian xoay**: 1-60 giây
- Click "Đồng bộ cài đặt" để áp dụng via MQTT

## 🔧 Technical Architecture

```
Admin Web (Local/GitHub Pages)
    ↓ Upload via GitHub API
GitHub Repository (billboard-logos-cdn)
    ↓ GitHub Actions build manifest
GitHub Pages CDN (Free, unlimited)
    ↓ Logo Manifest Service polls every 30s
Desktop App (logoManifestService.ts)
    ↓ Hot-reload display
Billboard LED Screen (384x384)
```

## 🎛️ MQTT Topics

- `its/billboard/banner/update` - New logo uploaded
- `its/billboard/banner/delete` - Logo deleted
- `its/billboard/banner/sync` - Settings synchronized
- `its/billboard/status` - App status updates

## 📱 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## 🔒 Security Notes

- GitHub Personal Access Token authentication
- Repository access controls
- HTTPS mandatory cho GitHub Pages
- MQTT over WSS (encrypted)

## 🆘 Troubleshooting

### Admin Web không upload được lên GitHub

1. Kiểm tra GitHub token có quyền `repo`
2. Đảm bảo repository `billboard-logos-cdn` tồn tại và accessible
3. Check console browser cho error details
4. Test GitHub connection trước khi upload

### Desktop App không nhận được logo mới

1. Kiểm tra logoManifestService.ts đã chạy
2. Verify GitHub Pages URL trong service
3. Check manifest polling interval (30s default)
4. Restart desktop app nếu cần

### Upload file bị lỗi

1. File size hợp lý (< 10MB)
2. Format hỗ trợ: PNG, JPG, JPEG, GIF
3. Stable internet connection
4. GitHub API rate limit chưa vượt

## 📞 Support

Nếu gặp vấn đề, check:

1. Browser console logs
2. Desktop app logs (logoManifestService)
3. GitHub repository access
4. Network connectivity
5. GitHub Actions workflow status

---

**🎯 Mục tiêu**: Zero-cost solution với 99.9% uptime cho billboard management!
