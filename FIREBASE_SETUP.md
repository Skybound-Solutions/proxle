# Firebase Functions Environment Setup

## Setting Up Your Gemini API Key for Production

### Step 1: Get Your Google AI API Key

If you don't have one yet:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### Step 2: Set the Environment Variable in Firebase

You have two options:

#### Option A: Using Firebase CLI (Recommended)

```bash
# Make sure you're in your project directory
cd /Users/razma/Projects/Phrasle

# Set the API key
firebase functions:config:set gemini.api_key="YOUR_API_KEY_HERE"
```

Replace `YOUR_API_KEY_HERE` with your actual API key.

#### Option B: Using Firebase Console (Web UI)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`phrasle-dev`)
3. Go to **Functions** in the left sidebar
4. Click on the **three dots** menu → **Manage environment variables**
5. Add a new variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your API key

### Step 3: Update Your Function Code (If Using Option B)

If you use the Firebase Console method, you need to update how the function reads the key:

**Current code** (in `functions/src/index.ts`):
```typescript
const apiKey = process.env.GOOGLE_AI_API_KEY;
```

**Would need to change to:**
```typescript
const apiKey = process.env.GEMINI_API_KEY;
```

**OR** stick with Option A (CLI) which matches your current code.

### Step 4: Verify the Configuration

Check that your config was set:

```bash
firebase functions:config:get
```

You should see:
```json
{
  "gemini": {
    "api_key": "YOUR_API_KEY"
  }
}
```

### Step 5: Deploy Your Functions

```bash
firebase deploy --only functions
```

## Important Notes

### Local Development (Emulator)
For local development, you're already using a `.env` file in the `functions` folder:

**File: `functions/.env`**
```
GOOGLE_AI_API_KEY=your_api_key_here
```

This is loaded automatically by the emulator and works great for testing!

### Production vs Development

- **Local Emulator**: Uses `functions/.env` file
- **Production**: Uses Firebase Functions config (set via CLI or Console)

### Security

⚠️ **Never commit your API keys to Git!**

Your `.gitignore` should include:
```
functions/.env
.env
*.local
```

## Troubleshooting

### Error: "API key not found"

If you get this error in production:

1. Verify the config is set:
   ```bash
   firebase functions:config:get
   ```

2. Make sure you deployed after setting the config:
   ```bash
   firebase deploy --only functions
   ```

3. Check the function code reads from the correct environment variable

### Error: "Invalid API key"

1. Verify your API key is correct in Google AI Studio
2. Make sure there are no extra spaces or quotes when setting it
3. Try regenerating the API key

### Functions Not Updating

If changes aren't appearing:

1. Clear the build:
   ```bash
   cd functions
   npm run build
   cd ..
   ```

2. Redeploy:
   ```bash
   firebase deploy --only functions
   ```

## Complete Deployment Command

Once your API key is set, deploy everything:

```bash
# Build the frontend
npm run build

# Deploy hosting and functions
firebase deploy

# Or deploy separately
firebase deploy --only hosting
firebase deploy --only functions
```

## Verify Production Deployment

After deploying, test the function:

1. Open your deployed site
2. Make a guess
3. Check if you get AI hints
4. If not, check the Firebase Console → Functions → Logs for errors

---

**Quick Reference:**

```bash
# Set API key
firebase functions:config:set gemini.api_key="YOUR_KEY"

# Check config
firebase functions:config:get

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log
```
