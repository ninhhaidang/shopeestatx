# Research Report: Shopee User Profile Crawling

## Executive Summary

Shopee không có public API được document chính thức. Tuy nhiên, extension có thể crawl thông tin user từ các endpoint nội bộ mà Shopee sử dụng cho trang web của họ. Các thông tin cần thiết (avatar, tên, uid) có thể lấy từ:

1. **API endpoint** - Gọi trực tiếp từ content script
2. **DOM elements** - Parse từ HTML của Shopee page
3. **Local storage / Cookies** - Shopee lưu thông tin user ở đây

## Research Methodology

- Sources consulted: 3 (GitHub, general web search)
- Date range: Current (2025-2026)
- Key search terms: Shopee API, user profile, web scraping, Chrome extension

## Key Findings

### 1. Shopee Internal APIs

Shopee sử dụng các API endpoint nội bộ:

```javascript
// User info API (có thể thử)
GET https://shopee.vn/api/v4/user/get_user_info
GET https://shopee.vn/api/v4/user/profile
GET https://shopee.vn/api/v4/shop/get_shop_info?shopid={shop_id}
```

**Lưu ý:** Các API này có thể yêu cầu authentication (cookies/session).

### 2. Từ DOM Elements

Shopee lưu thông tin user trong các element:

```html
<!-- Header avatar -->
<div class="shopee-header-section__account">
  <img class="_3or5g7" src="avatar_url">
</div>

<!-- Hoặc từ global state -->
<script>
  window.__INITIAL_STATE__ = { user: { ... } }
</script>
```

### 3. Từ LocalStorage / Cookies

```javascript
// LocalStorage keys (cần verify)
localStorage.getItem('shopee_userid')
localStorage.getItem('username')
```

### 4. Từ Order Data (Hiện có)

Order data đã có thể chứa thông tin shop:

```javascript
// Từ content.js đã parse
orderCard.shop_info = {
  username: 'shop_username',
  shop_name: 'Tên shop',
  shopid: 123456789
}
```

## Implementation Recommendations

### Approach 1: Gọi API trực tiếp (Khuyến nghị)

Thêm function mới vào `content.js`:

```javascript
async function getUserProfile() {
  try {
    // Thử user info API
    const url = `https://${SHOPEE_DOMAIN}/api/v4/user/get_user_info`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data) {
      return {
        userId: data.data.userid,
        username: data.data.username,
        avatar: data.data.avatar,
        name: data.data.name
      };
    }
  } catch (error) {
    console.error('Failed to get user profile:', error);
  }

  return null;
}
```

### Approach 2: Parse từ DOM

```javascript
function getUserFromDOM() {
  // Tìm avatar trong header
  const avatarEl = document.querySelector('.shopee-header-section__account img');
  const nameEl = document.querySelector('.shopee-header-section__account-name');

  return {
    avatar: avatarEl?.src,
    name: nameEl?.textContent?.trim()
  };
}
```

### Approach 3: Từ LocalStorage

```javascript
function getUserFromStorage() {
  // Thử các keys khác nhau
  const keys = ['shopee_userid', 'SPCPICKER', '__cart_count'];
  // Cần debug để tìm exact key
}
```

## Next Steps

1. **Kiểm tra thực tế các API** - Mở DevTools trên shopee.vn, vào Network tab, tìm các request liên quan đến user
2. **Test với content.js** - Thêm function getUserInfo() và test trực tiếp
3. **Cập nhật data flow** - Gửi user info cùng với orders về dashboard

## Unresolved Questions

1. API endpoint chính xác cho user profile là gì? (Cần verify qua DevTools)
2. Có cần authentication token không?
3. Avatar URL có expire không?

## References

- Shopee website (DevTools analysis)
- Chrome Extension content script patterns
