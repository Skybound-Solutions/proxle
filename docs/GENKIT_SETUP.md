# Proxle AI Setup (Genkit + Gemini)

We have "rigged up" Proxle with a **Firebase Genkit** backend. This allows us to use Google's Gemini models securely and effectively.

## 1. Prerequisites
You need a Google AI Studio API Key (Gemini API).
- Go to [Google AI Studio](https://aistudio.google.com/)
- Click "Get API key"
- Create a key (you can use an existing project or new one)

## 2. Configuration
Create a `.env` file in the `functions` folder:
```bash
cd functions
touch .env
```
Add your key to it:
```
GOOGLE_GENAI_API_KEY=your_key_here
```

## 3. Running the AI Studio (Genkit Developer UI)
To test your prompts and "chat" with your AI game master flow:

```bash
cd functions
npm run genkit:start
```
This will open a browser window (usually http://localhost:4000) where you can input a `targetWord` and `currentGuesses` and see what the AI returns.

## 4. Connecting to the React App
The backend functions are set up to be deployed to Firebase Cloud Functions.
For local development:
1. Start the emulators: `npm run serve` (in functions dir)
2. In your React App, use the Firebase JS SDK to call a "Callable Function" named `evaluateGuess`.

## 5. Deployment
To deploy to production:
```bash
firebase deploy --only functions
```
(Requires `firebase-tools` CLI and being logged in)
