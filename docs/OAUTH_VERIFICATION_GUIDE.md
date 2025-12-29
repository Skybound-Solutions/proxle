# Google OAuth Verification Checklist

## ✅ What We've Completed

### 1. Legal Documents
- ✅ **Privacy Policy**: `/public/docs/PRIVACY_POLICY.md`
- ✅ **Terms of Service**: `/public/docs/TERMS_OF_SERVICE.md`
- ✅ Both are accessible at:
  - `https://proxle.app/privacy`
  - `https://proxle.app/terms`

### 2. App Integration
- ✅ Privacy & Terms links in the Info modal (ℹ️ icon)
- ✅ Legal pages styled to match app aesthetic
- ✅ Footer with contact information

---

## 📋 Google OAuth Verification Steps

### Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **proxle-game**
3. Navigate to: **APIs & Services** → **OAuth consent screen**
4. Fill out the form:

| Field | Value |
|:------|:------|
| **App name** | Proxle |
| **User support email** | razma@skyboundmi.com (or support@proxle.app) |
| **App logo** | Upload your favicon (512x512px recommended) |
| **App domain** | proxle.app |
| **Authorized domains** | proxle.app<br>proxle-game.firebaseapp.com |
| **Application homepage** | https://proxle.app |
| **Privacy Policy link** | https://proxle.app/privacy |
| **Terms of Service link** | https://proxle.app/terms |
| **Developer contact** | razma@skyboundmi.com |

5. Click **Save and Continue**

---

### Step 2: Configure Scopes

1. Click **Add or Remove Scopes**
2. Select only these basic scopes:
   - ✅ `openid`
   - ✅ `email`
   - ✅ `profile`
3. **Do NOT** add any other scopes
4. Click **Update** → **Save and Continue**

---

### Step 3: Add Test Users (During Review)

While waiting for verification, you can add up to 100 test users:

1. Go to **OAuth consent screen** → **Test users**
2. Click **Add Users**
3. Enter email addresses (one per line)
4. Click **Save**

**Test users can sign in even with the unverified warning.**

---

### Step 4: Submit for Verification

1. Go to **OAuth consent screen**
2. Click **Publish App** button
3. You'll be prompted to complete the verification form:

#### Required Information:

**A. App Information**
- **What does your app do?**
  ```
  Proxle is a daily word-guessing puzzle game that combines semantic 
  discovery with orthographic feedback. Users can optionally sign in 
  with Google to save their game statistics, winning streaks, and 
  achievements across devices.
  ```

- **Why do you need Google user data?**
  ```
  We use Google Sign-In solely for user authentication and to display 
  the user's name/email in their profile. We only request basic scopes 
  (openid, email, profile) to:
  - Identify the user and prevent duplicate accounts
  - Save their game progress and statistics
  - Display their name in the app
  
  We do NOT access Gmail, Drive, Calendar, or any other Google services.
  ```

**B. Video Demo** (Required!)
Create a 1-2 minute screen recording showing:
1. Visit https://proxle.app
2. Click "Sign In with Google" button
3. See the OAuth consent screen
4. Grant permissions
5. Show the authenticated user experience (e.g., stats page)
6. Show where to find Privacy Policy and Terms

**Tools for recording:**
- Mac: QuickTime Player (File → New Screen Recording)
- Chrome Extension: Loom
- Upload to: YouTube (unlisted) or Google Drive (public link)

**C. Restricted Scope Justification**
Even though you're only using basic scopes, explain each:
- **openid**: Required for Google Sign-In authentication
- **email**: To identify users and prevent duplicate accounts
- **profile**: To display user's name in the app interface

**D. Official Link to Privacy Policy**
```
https://proxle.app/privacy
```

---

### Step 5: Wait for Review

- **Timeline**: 3-7 business days (can take up to 6 weeks during holidays)
- **Possible Outcomes**:
  - ✅ **Approved**: You'll receive an email. The warning will disappear.
  - ⚠️ **Questions**: Google may ask for clarifications. Respond promptly.
  - ❌ **Rejected**: Usually due to missing info. Fix and resubmit.

---

## 🎯 What Happens After Approval

Once verified:
- ✅ No more "This app isn't verified" warning
- ✅ Unlimited users (beyond 100 test users)
- ✅ Professional appearance
- ✅ Better user trust and conversion

---

## 🔍 Common Issues & Solutions

### Issue: "Privacy Policy link doesn't load"
**Solution**: Deploy your app with the `/privacy` route BEFORE submitting for verification.

### Issue: "Domain ownership not verified"
**Solution**: 
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `proxle.app`
3. Verify via DNS TXT record (Cloudflare makes this easy)

### Issue: "Video demo rejected"
**Solution**: Make sure the video clearly shows:
- The exact consent screen users will see
- What happens after they grant permissions
- That the app only uses basic profile data

---

## 📧 Support Email Setup

Before submitting, ensure `support@proxle.app` is set up:

**Option 1: Email Forwarding (Recommended for now)**
- Set up in Cloudflare Email Routing (free)
- Forward `support@proxle.app` → `razma@skyboundmi.com`

**Option 2: Use your existing email**
- Just use `razma@skyboundmi.com` in the OAuth form

---

## 🚀 Deployment Checklist

Before submitting for verification, deploy:

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Test the legal pages
open https://proxle.app/privacy
open https://proxle.app/terms
```

Verify:
- ✅ Both legal pages load correctly
- ✅ Links in the Info modal work
- ✅ Content is readable and properly formatted
- ✅ No console errors

---

## 📝 Quick Reference

| Resource | URL |
|:---------|:----|
| **App** | https://proxle.app |
| **Privacy Policy** | https://proxle.app/privacy |
| **Terms of Service** | https://proxle.app/terms |
| **Support Email** | support@proxle.app |
| **Company Website** | https://skyboundmi.com |
| **OAuth Console** | https://console.cloud.google.com/apis/credentials/consent |

---

## ✨ Final Tips

1. **Be patient**: The review process can take time, especially during holidays.
2. **Be thorough**: Answer all questions completely in the verification form.
3. **Be honest**: Don't promise features you haven't built yet.
4. **Be responsive**: Check your email daily for Google's replies.

**Good luck! The verification is straightforward for basic authentication scopes like yours.** 🎉
