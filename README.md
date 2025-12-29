# Proxle

A hybrid word-guessing game that combines **semantic discovery** (like Semantle) with **orthographic feedback** (like Wordle).

## 🎮 Game Overview

**Proxle** challenges players to guess a hidden word by providing two types of feedback:

- **Semantic Similarity**: AI-powered hints about how close your guess is in meaning to the target word
- **Orthographic Feedback**: Traditional Wordle-style color coding for letter positions (green/yellow/gray)

The unique twist? The target word's length is hidden, creating a "positional confusion" challenge that makes the game more strategic and engaging.

## 🚀 Features

- **AI-Powered Hints**: Uses Google's Gemini AI to evaluate semantic similarity
- **Hybrid Feedback System**: Combines meaning-based and letter-based clues
- **Variable Word Length**: Words can be 3-5 letters long
- **Share Results**: Share your game results with friends
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Free to Play**: Supported by tasteful, non-intrusive ads

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase Functions
- **AI**: Google Gemini (via Firebase Genkit)
- **Animations**: Framer Motion

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Phrasle

# Install dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

## 🔧 Configuration

1. Create a `.env` file in the `functions` directory with your Google AI API key:
   ```
   GOOGLE_AI_API_KEY=your_api_key_here
   ```

2. Set up Firebase:
   ```bash
   firebase login
   firebase init
   ```

## 🏃 Running Locally

### Development Mode

1. Start the Vite dev server:
   ```bash
   npm run dev -- --host
   ```

2. In a separate terminal, start the Firebase emulators:
   ```bash
   firebase emulators:start --only functions
   ```

3. Open your browser to the URL shown by Vite (typically `http://localhost:5173`)

## 📚 Documentation

- [Game Design Document](./docs/game_design.md)
- [AI Setup Guide](./docs/GENKIT_SETUP.md)
- [How to Run AI](./docs/RUN_AI.md)
- [Monetization Strategy](./docs/MONETIZATION.md)

## 🎯 How to Play

1. Enter a 3-5 letter word guess
2. Receive semantic similarity feedback from the AI
3. Use orthographic clues (green/yellow/gray letters) to narrow down the answer
4. Keep guessing until you find the target word!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Inspired by [Semantle](https://semantle.com/) and [Wordle](https://www.nytimes.com/games/wordle/)
- Powered by Google's Gemini AI
- Built with ❤️ by the Proxle team
