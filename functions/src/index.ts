import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";

// Define secret for production
const geminiApiKey = defineSecret("GEMINI_API_KEY");

import { getWordForDate } from './wordList';

export const evaluateGuess = onCall({
    cors: true,
    secrets: [geminiApiKey],
    // Increase memory and timeout to prevent "AI Offline" (cold start) errors
    memory: "512MiB",
    timeoutSeconds: 60
}, async (request) => {
    logger.info("Evaluating guess (Real AI)", request.data);
    const { guessWord, previousHints = [] } = request.data;
    const input = guessWord.toUpperCase();
    // Get the hidden target word server-side
    const target = getWordForDate(new Date()).toUpperCase();
    const hintsToExclude = [...(previousHints as string[]), input, target].join(', ');

    // Calculate Orthographic Match Pattern (Green/Yellow/Gray)
    const letterStatus: ('correct' | 'present' | 'absent')[] = Array(5).fill('absent');
    const targetArr = target.split('');
    const inputArr = input.split('');

    // First pass: Find greens (correct position)
    inputArr.forEach((char: string, i: number) => {
        if (char === targetArr[i]) {
            letterStatus[i] = 'correct';
            targetArr[i] = '#'; // Mark as used
        }
    });

    // Second pass: Find yellows (present but wrong spot)
    inputArr.forEach((char: string, i: number) => {
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
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());

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
3. If similarity < 60, provide a one-word thematic hint about the target.
   - The hint MUST be a single word.
   - The hint MUST NOT be in the "Forbidden hints" list.
   - The hint MUST NOT be the target word itself.

Return ONLY valid JSON in this exact format:
{"isValidWord": boolean, "similarity": number, "hint": string}

Example: {"isValidWord": true, "similarity": 85, "hint": "Nautical"}`;

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
            isValidWord: data.isValidWord ?? true,
            similarity: Math.min(100, Math.max(0, data.similarity ?? 0)),
            hint: data.hint || "",
            letterStatus
        };

    } catch (error: any) {
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
export { onUserUpdate } from './notifications';

// Ko-fi Integration
export { kofiWebhook } from './kofi';
