# 🔧 GitHub Banner Upload - Troubleshooting & Fix Guide

## 🚨 Vấn đề đã được xác định

**Lỗi chính**: Repository permission mismatch - Token của user `MinhQuan7` không có quyền write vào repository `MQuan-eoh/billboard-logos-cdn`.

```
Error: Repository or path not found. Please check if the repository 'MQuan-eoh/billboard-logos-cdn' exists and you have write access.
```

## ✅ Giải pháp đã implement

### 1. **Auto-fallback Repository Detection**

- Hệ thống tự động detect user đã authenticate
- Nếu không có quyền truy cập repository chính, tự động tạo repository backup
- Fallback repository: `MinhQuan7/billboard-logos-cdn`

### 2. **Enhanced Error Handling**

- Clear error messages với hướng dẫn cụ thể
- Repository information display trong UI
- Automatic repository creation nếu cần

### 3. **Flexible Configuration**

- `github-config.js` - Centralized repository configuration
- Support multiple repository options
- Auto-switch capability

## 🎯 Các cách giải quyết

### **Option 1: Sử dụng Token của MQuan-eoh** ⭐ RECOMMENDED

```
1. Đăng nhập GitHub với account MQuan-eoh
2. Tạo Personal Access Token với scope 'repo'
3. Nhập token vào admin interface
4. System sẽ sử dụng repository MQuan-eoh/billboard-logos-cdn
```

### **Option 2: Auto-create User Repository**

```
1. Sử dụng token của MinhQuan7
2. System tự động tạo repository MinhQuan7/billboard-logos-cdn
3. Enable GitHub Pages automatically
4. CDN URL: https://minhquan7.github.io/billboard-logos-cdn/
```

### **Option 3: Add Collaborator**

```
1. MQuan-eoh add MinhQuan7 as collaborator với write access
2. MinhQuan7 accept invitation
3. Sử dụng token MinhQuan7 với repository MQuan-eoh/billboard-logos-cdn
```

## 🛠️ Files đã được cập nhật

### 1. `github-upload-service.js`

- ✅ Enhanced authentication flow
- ✅ Auto-repository detection & creation
- ✅ Better error handling
- ✅ Fallback mechanism

### 2. `github-config.js` (NEW)

- ✅ Centralized configuration
- ✅ Multiple repository support
- ✅ URL generation helpers

### 3. `index.html`

- ✅ Enhanced authentication instructions
- ✅ Repository information display

### 4. `app.js`

- ✅ Repository status display
- ✅ Enhanced success messages

### 5. `styles.css`

- ✅ Repository information styling

### 6. `test-github-upload.js` (NEW)

- ✅ Comprehensive testing suite
- ✅ Auto-run in development

## 🚀 Cách sử dụng sau khi fix

### Bước 1: Mở Admin Interface

```
file:///f:/EoH%20Company/ITS_OurdoorScreen/admin-web/index.html
```

### Bước 2: Authentication

```
1. Nhập GitHub Personal Access Token
2. Click "Authenticate"
3. Xem thông tin repository được sử dụng
```

### Bước 3: Upload Banner

```
1. Chọn image files
2. Click "Upload Banner"
3. Monitor progress và results
```

## 🧪 Testing

### Manual Testing

```javascript
// Mở browser console và chạy:
testGitHubUpload();
```

### Auto Testing

- Tests chạy tự động trong development environment
- Check console để xem results

## 📊 Expected Behavior

### Với Token MQuan-eoh:

```
✅ Repository: MQuan-eoh/billboard-logos-cdn
✅ CDN: https://mquan-eoh.github.io/billboard-logos-cdn/
✅ Upload success
```

### Với Token MinhQuan7:

```
ℹ️ Repository: MinhQuan7/billboard-logos-cdn (auto-created)
ℹ️ CDN: https://minhquan7.github.io/billboard-logos-cdn/
✅ Upload success
```

## 🔍 Debugging Steps

### 1. Check Console Logs

```javascript
// Authentication status
window.getGitHubServiceStatus();

// Config status
window.GitHubConfig;
```

### 2. Repository Access Test

```bash
curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/repos/MQuan-eoh/billboard-logos-cdn
```

### 3. Manual Repository Creation

```bash
curl -X POST \
     -H "Authorization: token YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"billboard-logos-cdn","auto_init":true,"public":true}' \
     https://api.github.com/user/repos
```

## 💡 Best Practices

1. **Use dedicated service account** cho production
2. **Limit token scope** to 'repo' only
3. **Enable GitHub Pages** for instant CDN
4. **Monitor repository size** (GitHub có limits)
5. **Backup important banners** locally

## 🎯 Next Steps

1. Test với token thực tế
2. Verify GitHub Pages deployment
3. Test MQTT integration với new URLs
4. Monitor error logs
5. Consider implementing webhook notifications

---

**📞 Support**: Nếu vẫn có issues, check browser console và GitHub repository permissions.
