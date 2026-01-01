import { WORD_LIST } from '../wordList';

// Seeded random number generator for reproducibility
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

// Calculate similarity between two words
function calculateSimilarity(word1: string, word2: string): number {
    // Calculate based on length difference and shared letters
    const lengthDiff = Math.abs(word1.length - word2.length);

    let sharedLetters = 0;
    const letters1 = word1.split('');
    const letters2 = word2.split('');

    for (const letter of letters1) {
        const index = letters2.indexOf(letter);
        if (index !== -1) {
            sharedLetters++;
            letters2.splice(index, 1);
        }
    }

    const minLength = Math.min(word1.length, word2.length);
    const letterSimilarity = sharedLetters / minLength;

    // Penalize same length words with high letter overlap
    if (lengthDiff === 0) {
        return letterSimilarity * 1.5;
    }

    return letterSimilarity;
}

// Fisher-Yates shuffle with seed
function seededShuffle<T>(array: T[], seed: number): T[] {
    const result = [...array];
    const rng = new SeededRandom(seed);

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// Optimize word list to reduce consecutive similarities
function optimizeWordList(words: string[], seed: number, maxIterations: number = 50): string[] {
    let bestList = seededShuffle(words, seed);
    let bestScore = evaluateList(bestList);

    console.log(`Initial score: ${bestScore.toFixed(2)}`);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        const candidateList = seededShuffle(words, seed + iteration + 1);
        const candidateScore = evaluateList(candidateList);

        if (candidateScore < bestScore) {
            bestScore = candidateScore;
            bestList = candidateList;
            console.log(`Iteration ${iteration + 1}: Improved score to ${bestScore.toFixed(2)}`);
        }
    }

    return bestList;
}

// Evaluate how good a word list is (lower is better)
function evaluateList(words: string[]): number {
    let totalSimilarity = 0;
    let worstCases = 0;

    for (let i = 0; i < words.length - 1; i++) {
        const similarity = calculateSimilarity(words[i], words[i + 1]);
        totalSimilarity += similarity;

        // Penalize very similar consecutive words
        if (similarity > 0.6) {
            worstCases += similarity * 10;
        }
    }

    return totalSimilarity + worstCases;
}

// Generate the shuffled word list
console.log('=== GENERATING OPTIMIZED WORD LIST ===\n');
console.log(`Original word count: ${WORD_LIST.length}`);

const SHUFFLE_SEED = 42069; // Fixed seed for reproducibility
const optimizedList = optimizeWordList(WORD_LIST, SHUFFLE_SEED, 100);

console.log('\nAnalyzing optimized list...');

// Check for problematic clusters
let problematicClusters = 0;
for (let i = 0; i < optimizedList.length - 2; i++) {
    const sim1 = calculateSimilarity(optimizedList[i], optimizedList[i + 1]);
    const sim2 = calculateSimilarity(optimizedList[i + 1], optimizedList[i + 2]);

    if (sim1 > 0.6 && sim2 > 0.6) {
        problematicClusters++;
    }
}

console.log(`Problematic clusters (3+ similar): ${problematicClusters}`);

// Sample next 10 days
console.log('\nSample words for next 10 days:');
const today = new Date('2025-12-31');
const startIndex = Math.floor((today.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)) % optimizedList.length;

for (let i = 0; i < 10; i++) {
    const index = (startIndex + i) % optimizedList.length;
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    console.log(`  ${date.toISOString().split('T')[0]}: ${optimizedList[index]}`);
}

// Format the word list for code
console.log('\n=== FORMATTED WORD LIST (Copy to wordList.ts) ===\n');

// Group by length for better readability
const byLength: { [key: number]: string[] } = {};
optimizedList.forEach(word => {
    if (!byLength[word.length]) {
        byLength[word.length] = [];
    }
    byLength[word.length].push(word);
});

// Calculate words per line based on length
function wordsPerLine(length: number): number {
    if (length <= 3) return 20;
    if (length === 4) return 15;
    if (length === 5) return 12;
    return 8;
}

let output = 'export const WORD_LIST = [\n';

Object.keys(byLength).sort((a, b) => parseInt(a) - parseInt(b)).forEach((lengthStr, idx) => {
    const length = parseInt(lengthStr);
    const words = byLength[length];
    const perLine = wordsPerLine(length);

    if (idx > 0) output += '\n';
    output += `    // ${length}-letter words (${words.length} total)\n`;

    for (let i = 0; i < words.length; i += perLine) {
        const chunk = words.slice(i, i + perLine);
        const line = chunk.map(w => `"${w}"`).join(', ');
        output += `    ${line}${i + perLine < words.length ? ',' : words.length < optimizedList.length ? ',' : ''}\n`;
    }
});

output += '];\n';

// Write to a new file
const fs = require('fs');
const path = require('path');
const outputPath = path.join(__dirname, 'shuffled-word-list.txt');
fs.writeFileSync(outputPath, output);

console.log(`\nShuffled word list written to: ${outputPath}`);
console.log('\n✅ Done! Use this list to replace the current WORD_LIST in wordList.ts');
