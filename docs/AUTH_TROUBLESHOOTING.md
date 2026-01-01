# Authentication Troubleshooting Quick Reference

## 🔍 Diagnosing Auth Issues

### User Reports: "Can't sign in on Safari"

**Quick Diagnosis:**
```bash
# Check if user is in private browsing mode
- Ask: "Are you in Private Browsing or Incognito mode?"
- Check: Any browser extensions blocking third-party cookies?
- Verify: Is the user on iOS and clicking from Messages/Mail app?
```

**Solutions:**
1. ✅ Implement automatic fallback to redirect (see implementation guide)
2. ✅ User opens link in regular Safari (not from another app)
3. ✅ User disables private browsing mode
4. ✅ User allows cookies for proxle.app

### User Reports: "Works on second try"

**Root Cause:**
- Rapid clicks trigger `auth/cancelled-popup-request`
- No cooldown between popup attempts
- Missing error handling

**Solutions:**
1. ✅ Implement cooldown timer (3 seconds)
2. ✅ Auto-fallback to redirect on second attempt
3. ✅ Better error handling (see implementation guide)

## 🛠️ Common Error Codes

| Error Code | Meaning | User-Facing Message | Auto-Retry? |
|------------|---------|-------------------|-------------|
| `auth/popup-blocked` | Browser blocked the popup | "Pop-up blocked. Redirecting..." | Yes ✅ |
| `auth/popup-closed-by-user` | User closed the popup | "Sign-in cancelled" | No ❌ |
| `auth/cancelled-popup-request` | Multiple rapid attempts | "Switching to alternative method..." | Yes ✅ |
| `auth/network-request-failed` | Network issue | "Network error. Check connection" | No ❌ |
| `auth/internal-error` | Safari private mode or similar | "Trying alternative method..." | Yes ✅ |
| `auth/unauthorized-domain` | Domain not in Firebase whitelist | "Not configured for this domain" | No ❌ |

## 🧪 Testing Scenarios

### Test 1: Safari Private Mode
```
1. Safari → File → New Private Window
2. Go to https://proxle.app
3. Click "Sign In"
Expected: Redirect to Google sign-in after 1s delay
```

### Test 2: Rapid Clicks
```
1. Click "Sign In"
2. Close popup immediately
3. Click "Sign In" again within 3 seconds
Expected: Uses redirect method on second attempt
```

### Test 3: Popup Blocker
```
1. Block popups in browser settings
2. Click "Sign In"
Expected: Shows error, then redirects to Google
```

### Test 4: Mobile Safari (iOS)
```
1. Share a link via Messages
2. Recipient clicks link
3. Clicks "Sign In"
Expected: Works even if opened in private mode
```

## 📊 Monitoring Dashboard

### Firebase Console Checks
- **Authentication** → **Users**: Check recent sign-ups
- **Authentication** → **Sign-in method**: Verify Google is enabled
- **Authentication** → **Settings** → **Authorized domains**: Verify proxle.app is listed

### Analytics to Watch
```javascript
// Success rate by method
auth_success: { method: 'popup' | 'redirect' }

// Failure patterns
auth_failure: { 
  error_code: string,
  browser: string,
  fallback_used: boolean 
}

// Conversion funnel
auth_attempt → auth_success/auth_failure
```

## 🚨 Emergency Fixes

### If Authentication is Completely Broken

**Immediate Rollback:**
```bash
# Revert to previous Firebase config
cd /home/razma/Projects/Skybound/Proxle
git log --oneline  # Find last working commit
git revert <commit-hash>
firebase deploy --only hosting
```

**Temporary Disable:**
```typescript
// In App.tsx, temporarily hide sign-in
const DISABLE_AUTH = true;

{!DISABLE_AUTH && (
  <button onClick={signInWithGoogle}>Sign In</button>
)}
```

### If Only Safari/iOS Affected

**Force Redirect for iOS:**
```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

const signInWithGoogle = async () => {
  if (isIOS) {
    // Force redirect for all iOS users
    await signInWithRedirect(auth, googleProvider);
  } else {
    // Try popup for others
    await signInWithPopup(auth, googleProvider);
  }
};
```

## 🔧 Configuration Checklist

### Firebase Console
- [ ] Google auth provider is enabled
- [ ] `proxle.app` in authorized domains
- [ ] No OAuth scopes beyond basic (openid, email, profile)
- [ ] OAuth consent screen is configured

### Code Configuration
- [ ] `authDomain` set to `proxle.app`
- [ ] `GoogleAuthProvider` configured with `prompt: 'select_account'`
- [ ] Imports include `signInWithRedirect` and `getRedirectResult`
- [ ] `useEffect` checks for redirect result on mount

### Deployment
- [ ] Latest code deployed to Firebase Hosting
- [ ] No console errors in production
- [ ] Test on multiple browsers/devices
- [ ] Monitor error rates for 24 hours

## 📞 User Support Template

### For Private Browsing Issues:
```
Hi! Safari's Private Browsing mode restricts some features needed for sign-in.

Please try:
1. Open Safari (not from another app)
2. Turn off Private Browsing
3. Visit proxle.app
4. Click "Sign In"

Alternatively, when you see the error message, click "Try Alternative Sign-In Method" which should work in Private Browsing.
```

### For General Sign-In Issues:
```
Thanks for reporting! Please try:

1. Clear your browser cache and cookies
2. Make sure you're not in Private/Incognito mode
3. Allow popups for proxle.app
4. Try the "Alternative Sign-In Method" if it appears

If issues persist, please share:
- What browser/device you're using
- What error message you see (if any)
- Whether it's your first time signing in or you were previously signed in
```

## 🎓 Prevention Best Practices

### Before Deploying Auth Changes:
1. ✅ Test in Safari private mode
2. ✅ Test on real iOS device (Simulator doesn't replicate all issues)
3. ✅ Test rapid clicking behavior
4. ✅ Verify redirect result handling
5. ✅ Check Firebase Console for errors
6. ✅ Monitor for 24 hours post-deployment

### When Adding New Auth Features:
1. ✅ Always provide fallback methods
2. ✅ Add comprehensive error handling
3. ✅ Include user-visible error messages
4. ✅ Test on all common browsers
5. ✅ Document known limitations

## 📚 Reference Links

- [Firebase Auth Errors](https://firebase.google.com/docs/reference/js/auth#autherrorcodes)
- [Safari ITP Deep Dive](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Proxle Auth Analysis](./AUTHENTICATION_ISSUE_ANALYSIS.md)
- [Implementation Guide](./AUTHENTICATION_FIX_IMPLEMENTATION.md)

---

**Last Updated:** 2025-12-31

**Maintainer:** Skybound Solutions Team
