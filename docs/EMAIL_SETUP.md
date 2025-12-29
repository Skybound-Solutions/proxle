# Setting Up support@proxle.app Email

## Why You Need This

Google OAuth verification requires:
- ✅ A **User support email** in the OAuth consent screen
- ✅ A **Developer contact email** for Google to reach you
- ✅ Contact information in your Privacy Policy

While you *can* use `razma@skyboundmi.com`, having `support@proxle.app` looks more professional and keeps your personal email separate.

---

## Option 1: Cloudflare Email Routing (Recommended) ⭐

**Benefits:**
- ✅ **100% Free** (no hidden costs)
- ✅ **5 minutes to set up**
- ✅ Forwards to your existing email
- ✅ SPF/DKIM configured automatically
- ✅ Can send FROM support@proxle.app later (with Email Workers)

### Setup Steps:

1. **Go to Cloudflare Dashboard**
   - Visit: [dash.cloudflare.com](https://dash.cloudflare.com)
   - Select: **proxle.app** domain

2. **Navigate to Email Routing**
   - Sidebar: **Email** → **Email Routing**
   - Click: **Get started** (if first time)

3. **Add Destination Address**
   - Click: **Destination addresses** tab
   - Click: **Add destination address**
   - Enter: `razma@skyboundmi.com`
   - Click: **Send verification email**
   - Check your inbox and click the verification link

4. **Create Routing Rule**
   - Click: **Routing rules** tab
   - Click: **Create routing rule**
   - **Custom address**: `support@proxle.app`
   - **Action**: Send to → `razma@skyboundmi.com`
   - Click: **Save**

5. **Verify DNS Records**
   Cloudflare automatically adds these records:
   ```
   MX    @    route1.mx.cloudflare.net (Priority: 58)
   MX    @    route2.mx.cloudflare.net (Priority: 24)
   MX    @    route3.mx.cloudflare.net (Priority: 82)
   TXT   @    v=spf1 include:_spf.mx.cloudflare.net ~all
   ```

6. **Test It!**
   - Send a test email to: `support@proxle.app`
   - Should arrive at: `razma@skyboundmi.com`

---

## Option 2: Gmail Alias (Simple)

**Benefits:**
- ✅ Free
- ✅ No extra setup needed
- ❌ Requires manual DNS configuration
- ❌ Can't send FROM support@proxle.app easily

### Setup Steps:

1. **Add DNS Records in Cloudflare**
   ```
   Type: MX
   Name: @
   Content: ASPMX.L.GOOGLE.COM
   Priority: 1
   TTL: Auto
   ```
   
   ```
   Type: MX
   Name: @
   Content: ALT1.ASPMX.L.GOOGLE.COM
   Priority: 5
   TTL: Auto
   ```

2. **Configure Gmail**
   - Go to: Gmail Settings → **Accounts and Import**
   - Click: **Add another email address**
   - Enter: `support@proxle.app`
   - Follow verification steps

---

## Option 3: Just Use Your Personal Email

**Simplest option:**
- Use: `razma@skyboundmi.com` everywhere
- ✅ Zero setup
- ✅ Works perfectly for verification
- ❌ Less professional
- ❌ Mixes personal/business emails

---

## Recommendation for You

### Now (For OAuth Verification)
Use **Cloudflare Email Routing** → Forward to `razma@skyboundmi.com`

**Time**: 5 minutes  
**Cost**: $0  
**Professionalism**: High

### Later (When You Have 1000+ Users)
Consider upgrading to:
- **Google Workspace** ($6/user/month) for full email + send capability
- **SendGrid** (free tier: 100 emails/day) for automated emails (password resets, etc.)

---

## Quick Test

Once set up, send a test email:

```
To: support@proxle.app
Subject: Test
Body: Testing email routing
```

✅ Should arrive at `razma@skyboundmi.com` within seconds.

---

## Using support@proxle.app in Your App

### Privacy Policy (Already Correct!)
```markdown
To exercise any of these rights, contact us at: support@proxle.app
```

### OAuth Consent Screen
- **User support email**: `support@proxle.app`
- **Developer contact**: `razma@skyboundmi.com` (your personal email for Google to contact you)

---

## Sending FROM support@proxle.app (Future Feature)

**If you ever need to send emails** (e.g., password resets, notifications):

### Option A: Cloudflare Email Workers
- **Cost**: $5/month (1M requests)
- Full send/receive capability
- [Guide](https://developers.cloudflare.com/email-routing/email-workers/)

### Option B: SendGrid + Custom Domain
- **Cost**: Free (100 emails/day), then $20/month
- Better for transactional emails
- [Guide](https://sendgrid.com/docs/ui/account-and-settings/custom-domain-authentication/)

**For now, just forwarding is enough!**

---

## Done! ✅

Your `support@proxle.app` email is now live and ready for Google OAuth verification.
