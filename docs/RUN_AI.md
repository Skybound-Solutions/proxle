# Proxle AI: How to Run

You now have a full-stack AI application running locally!

## 1. Start the Backend (Firebase Emulators)
This runs the "Cloud Functions" on your machine so you don't have to deploy for every test.

Open a new terminal tab and run:
```bash
cd functions
npm run serve
```
*Wait for it to say `All emulators ready`.*

## 2. Start the Frontend
In your main terminal:
```bash
npm run dev
```

## 3. Play!
Go to `http://localhost:5174`.
1. Type a word.
2. Hit ENTER.
3. The app will send your word to the local emulator -> which sends it to Gemini -> which calculates the similarity score -> and returns it to the game.

## Troubleshooting
- **Permission Denied?** Ensure `GOOGLE_GENAI_API_KEY` is in `functions/.env`.
- **Connection Refused?** Ensure `npm run serve` is actually running in the background.
- **"Failed to contact AI judge"?** Check the browser console. If it says `ERR_CONNECTION_REFUSED`, the emulator isn't running on port 5001.
