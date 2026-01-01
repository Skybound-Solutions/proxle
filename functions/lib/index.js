"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kofiWebhook = exports.onUserUpdate = exports.evaluateGuess = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const generative_ai_1 = require("@google/generative-ai");
const params_1 = require("firebase-functions/params");
// Define secret for production
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const wordList_1 = require("./wordList");
exports.evaluateGuess = (0, https_1.onCall)({
    cors: true,
    secrets: [geminiApiKey],
    // Increase memory and timeout to prevent "AI Offline" (cold start) errors
    memory: "512MiB",
    timeoutSeconds: 60
}, async (request) => {
    var _a, _b;
    logger.info("Evaluating guess (Real AI)", request.data);
    const { guessWord, previousHints = [] } = request.data;
    const input = guessWord.toUpperCase();
    // Get the hidden target word server-side
    const target = (0, wordList_1.getWordForDate)(new Date()).toUpperCase();
    const hintsToExclude = [...previousHints, input, target].join(', ');
    // Calculate Orthographic Match Pattern (Green/Yellow/Gray)
    const letterStatus = Array(5).fill('absent');
    const targetArr = target.split('');
    const inputArr = input.split('');
    // First pass: Find greens (correct position)
    inputArr.forEach((char, i) => {
        if (char === targetArr[i]) {
            letterStatus[i] = 'correct';
            targetArr[i] = '#'; // Mark as used
        }
    });
    // Second pass: Find yellows (present but wrong spot)
    inputArr.forEach((char, i) => {
        if (letterStatus[i] !== 'correct') {
            const targetIndex = targetArr.indexOf(char);
            if (targetIndex !== -1) {
                letterStatus[i] = 'present';
                targetArr[targetIndex] = '#'; // Mark as used
            }
        }
    });
    // Check for exact win to bypass AI if needed (optimization)
    if (input === target) {
        return {
            isValidWord: true,
            similarity: 100,
            hint: "Victory!",
            letterStatus
        };
    }
    // Initialize AI with the secret
    const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey.value());
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `You are evaluating a word guessing game called Proxle.

Target word: "${target}"
Guessed word: "${input}"
Forbidden hints (do NOT use): ${hintsToExclude}

Tasks:
1. Determine if "${input}" is a valid, commonly used English word (true/false)
2. If valid, calculate semantic similarity between the guess and target (0-100 scale):
   - 100 = exact match or perfect synonym
   - 80-95 = very close semantic relationship (e.g., BOAT -> SHIP)
   - 60-79 = related concepts (e.g., OCEAN -> SHIP)
   - 40-59 = loosely related
   - 0-39 = unrelated
3. If similarity < 60, provide a **single word** hint that describes a **shared attribute** linking the guess and the target.
   - The hint must be a shared quality, physical property, or abstract concept (e.g. Target: PLANE, Guess: EAGLE -> Hint: "Flight").
   - The hint MUST be a single word.
   - The hint MUST NOT be in the "Forbidden hints" list.
   - The hint MUST NOT be the target word itself.

Return ONLY valid JSON in this exact format:
{"isValidWord": boolean, "similarity": number, "hint": string}

Example: {"isValidWord": true, "similarity": 45, "hint": "Flight"}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Invalid AI response format");
        }
        const data = JSON.parse(jsonMatch[0]);
        return {
            isValidWord: (_a = data.isValidWord) !== null && _a !== void 0 ? _a : true,
            similarity: Math.min(100, Math.max(0, (_b = data.similarity) !== null && _b !== void 0 ? _b : 0)),
            hint: data.hint || "",
            letterStatus
        };
    }
    catch (error) {
        logger.error("AI Error", error);
        // Fallback to basic validation
        const hasVowel = /[AEIOUY]/.test(input);
        const noTripleConsonants = !/[BCDFGHJKLMNPQRSTVWXZ]{3,}/.test(input);
        const isValid = input.length >= 3 && hasVowel && noTripleConsonants;
        if (!isValid) {
            return { isValidWord: false, similarity: 0, hint: "" };
        }
        // Basic similarity fallback
        const similarity = input === target ? 100 : 15;
        return {
            isValidWord: true,
            similarity: similarity,
            hint: "Checking...",
            letterStatus
        };
    }
});
// User Notifications
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "onUserUpdate", { enumerable: true, get: function () { return notifications_1.onUserUpdate; } });
// Ko-fi Integration
var kofi_1 = require("./kofi");
Object.defineProperty(exports, "kofiWebhook", { enumerable: true, get: function () { return kofi_1.kofiWebhook; } });
//# sourceMappingURL=index.js.map