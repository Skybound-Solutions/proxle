# 🔍 GCP Access Fix

## The Issue: "Ghost Project"
Your Firebase CLI sees `proxle-game` (Project Number `890224174750`), but your Google Cloud Console is showing you a different project (`455...`).

This is a common "phantom project" issue. You are accidentally creating keys in a **different project** than the one hosting your app. The keys you make in Project 455 will never work in Project 890.

## The Solution

**Step 1: Use the Direct Link**
Click this link to force the Google Cloud Console to open your ACTUAL project:
👉 **[https://console.cloud.google.com/apis/credentials?project=proxle-game](https://console.cloud.google.com/apis/credentials?project=proxle-game)**

**Step 2: Search by Number (If link fails)**
1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. In the top-center Search Bar, type exactly: `890224174750`.
3. Click the result that appears (it might be named "Proxle" or "proxle-game").

**Step 3: Finding the Key**
Once you are in the correct project (`890...`), go to **APIs & Services > Credentials**.
You should see an **"Auto created"** OAuth client there.
*   **Use THIS Client ID** for your Firebase Auth.
*   **Do NOT** use the keys from the `455...` project.

**Step 4: The "Backdoor" Method (If all else fails)**
1. Go to your [Firebase Console Project Settings](https://console.firebase.google.com/project/proxle-game/settings/serviceaccounts/adminsdk).
2. Click the **Service accounts** tab.
3. Click the link that says **"Manage service account permissions"** on the right side.
4. This will take you deep into the correct Google Cloud project's IAM page. From there, navigate to "APIs & Services > Credentials".
