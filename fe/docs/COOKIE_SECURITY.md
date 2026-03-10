# Cookie-Based Authentication

This application uses **cookies** instead of **localStorage** for storing authentication tokens. This provides better security for the following reasons:

## Security Benefits

### 1. **CSRF Protection with SameSite Attribute**

- Cookies can have the `SameSite` attribute set to `Strict` or `Lax`
- Prevents Cross-Site Request Forgery (CSRF) attacks
- Browser automatically blocks cookies from being sent in cross-site requests

### 2. **HTTPS-Only Transmission with Secure Flag**

- In production, cookies are set with the `Secure` flag
- Ensures tokens are only transmitted over HTTPS connections
- Prevents man-in-the-middle attacks on unencrypted connections

### 3. **Automatic Expiration**

- Cookies have built-in expiration mechanisms
- Tokens automatically expire after 7 days (configurable)
- No manual cleanup or expiration logic needed

### 4. **HttpOnly Option (Future Enhancement)**

- When set server-side, HttpOnly flag prevents JavaScript access
- Protects against XSS (Cross-Site Scripting) attacks
- Even if malicious script runs, it cannot read the token

### 5. **Subdomain Control**

- Domain attribute allows precise control over cookie scope
- Can restrict cookies to specific subdomains
- Better isolation between different parts of the application

## Implementation Details

### Cookie Configuration

```typescript
{
  path: '/',              // Available across entire site
  maxAge: 7,             // Expires after 7 days
  secure: true,          // HTTPS only (production)
  sameSite: 'Strict'     // Strong CSRF protection
}
```

### Security Settings

- **Development**: `secure: false` (allows HTTP on localhost)
- **Production**: `secure: true` (requires HTTPS)
- **SameSite**: Always set to `Strict` for maximum protection

## Usage

All authentication helpers automatically use cookies:

```typescript
import { setAuthToken, getAuthToken, clearAuthToken, isAuthenticated } from '$lib';

// Store token (sets cookie)
setAuthToken(token);

// Check authentication (reads cookie)
if (isAuthenticated()) {
  // User is logged in
}

// Get token for API calls (reads cookie)
const token = getAuthToken();

// Logout (deletes cookie)
clearAuthToken();
```

## Comparison: localStorage vs Cookies

| Feature         | localStorage  | Cookies (Current)     |
| --------------- | ------------- | --------------------- |
| CSRF Protection | ❌ No         | ✅ SameSite attribute |
| HTTPS Only      | ❌ No         | ✅ Secure flag        |
| Expiration      | ❌ Manual     | ✅ Automatic          |
| HttpOnly        | ❌ No         | ✅ Server-side option |
| XSS Protection  | ❌ Vulnerable | ✅ With HttpOnly      |
| Size Limit      | 5-10 MB       | 4 KB (sufficient)     |
| Auto-Send       | ❌ No         | ✅ Yes (convenient)   |

## Future Enhancements

For even better security, the backend should set the auth token cookie with the `HttpOnly` flag:

```javascript
// Backend (Express.js example)
res.cookie('auth_token', token, {
	httpOnly: true, // Prevents JavaScript access
	secure: true, // HTTPS only
	sameSite: 'strict',
	maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

This would make the token completely inaccessible to JavaScript, providing the highest level of security against XSS attacks.

## References

- [MDN: Using HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Cookie Security](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)
