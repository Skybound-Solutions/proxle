import { WORD_LIST } from '../wordList';

// Seeded random number generator
class SeededRandom {
    private seed: number;
    constructor(seed: number) { this.seed = seed; }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

// Calculate similarity
function calculateSimilarity(word1: string, word2: string): number {
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

    const letterSimilarity = sharedLetters / Math.max(word1.length, word2.length);
    const sameLengthBonus = (lengthDiff === 0) ? 0.2 : 0;

    return Math.max(0, Math.min(1, letterSimilarity + sameLengthBonus - lengthDiff * 0.2));
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

// Evaluate quality
function evaluateList(words: string[]): number {
    let totalSimilarity = 0;
    let worstCases = 0;

    for (let i = 0; i < words.length - 1; i++) {
        const similarity = calculateSimilarity(words[i], words[i + 1]);
        totalSimilarity += similarity;
        if (similarity > 0.6) worstCases += similarity * 10;
    }

    return totalSimilarity + worstCases;
}

// Optimize
function optimizeWordList(words: string[], seed: number, iterations: number = 50): string[] {
    let bestList = seededShuffle(words, seed);
    let bestScore = evaluateList(bestList);

    console.log(`Initial score: ${bestScore.toFixed(2)}`);

    for (let iteration = 0; iteration < iterations; iteration++) {
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

console.log('=== CREATING BALANCED WORD LIST (80% 5-letter, 20% 4-letter) ===\n');

// Separate words by length
const byLength = new Map<number, string[]>();
WORD_LIST.forEach(word => {
    if (!byLength.has(word.length)) byLength.set(word.length, []);
    byLength.get(word.length)!.push(word);
});

console.log('Current word list breakdown:');
Array.from(byLength.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([length, words]) => {
        console.log(`  ${length} letters: ${words.length} words`);
    });

// Get all 5-letter words
const fiveLetterWords = byLength.get(5) || [];
console.log(`\nUsing all ${fiveLetterWords.length} 5-letter words`);

// Calculate how many 4-letter words we need for 80/20 split
// If 5-letter = 80%, then 4-letter = 20%
// 5-letter count / 0.8 = total
// 4-letter count = total * 0.2
const totalWords = Math.floor(fiveLetterWords.length / 0.8);
const fourLetterTarget = Math.floor(totalWords * 0.2);

console.log(`Target: ${totalWords} total words`);
console.log(`  - ${fiveLetterWords.length} 5-letter (${((fiveLetterWords.length / totalWords) * 100).toFixed(1)}%)`);
console.log(`  - ${fourLetterTarget} 4-letter (${((fourLetterTarget / totalWords) * 100).toFixed(1)}%)`);

// Randomly select 4-letter words
const fourLetterWords = byLength.get(4) || [];
const rng = new SeededRandom(42069);
const selectedFourLetter: string[] = [];

// Create a shuffled copy and take the first N
const shuffledFourLetter = [...fourLetterWords];
for (let i = shuffledFourLetter.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffledFourLetter[i], shuffledFourLetter[j]] = [shuffledFourLetter[j], shuffledFourLetter[i]];
}
selectedFourLetter.push(...shuffledFourLetter.slice(0, fourLetterTarget));

console.log(`\nSelected ${selectedFourLetter.length} 4-letter words from ${fourLetterWords.length} available`);

// Combine and optimize
const balancedList = [...fiveLetterWords, ...selectedFourLetter];
console.log(`\nTotal words in balanced list: ${balancedList.length}`);
console.log(`  - 5-letter: ${fiveLetterWords.length} (${((fiveLetterWords.length / balancedList.length) * 100).toFixed(1)}%)`);
console.log(`  - 4-letter: ${selectedFourLetter.length} (${((selectedFourLetter.length / balancedList.length) * 100).toFixed(1)}%)`);

console.log('\nOptimizing word order...');
const optimized = optimizeWordList(balancedList, 42069, 100);

// Verify distribution in a 30-day sample
console.log('\n30-day sample from optimized list:');
const sampleIndices = Array.from({ length: 30 }, (_, i) => (730 + i) % optimized.length);
const lengthCounts = new Map<number, number>();

sampleIndices.forEach(idx => {
    const word = optimized[idx];
    lengthCounts.set(word.length, (lengthCounts.get(word.length) || 0) + 1);
});

lengthCounts.forEach((count, length) => {
    console.log(`  ${length}-letter: ${count}/30 (${((count / 30) * 100).toFixed(1)}%)`);
});

// Write output
const fs = require('fs');
const path = require('path');

let output = '// Balanced word list: 80% 5-letter, 20% 4-letter words\n';
output += `// Total: ${optimized.length} words\n`;
output += '// Optimized for variety using seeded shuffle (seed: 42069)\n\n';
output += 'export const WORD_LIST = [\n';

// Group by length for output
const fiveLetter = optimized.filter(w => w.length === 5);
const fourLetter = optimized.filter(w => w.length === 4);

output += `    // 5-letter words (${fiveLetter.length} total - ${((fiveLetter.length / optimized.length) * 100).toFixed(1)}%)\n`;
for (let i = 0; i < fiveLetter.length; i += 12) {
    const chunk = fiveLetter.slice(i, i + 12);
    output += `    ${chunk.map(w => `"${w}"`).join(', ')}${i + 12 < fiveLetter.length ? ',' : ''}\n`;
}

output += `\n    // 4-letter words (${fourLetter.length} total - ${((fourLetter.length / optimized.length) * 100).toFixed(1)}%)\n`;
for (let i = 0; i < fourLetter.length; i += 15) {
    const chunk = fourLetter.slice(i, i + 15);
    output += `    ${chunk.map(w => `"${w}"`).join(', ')}${i + 15 < fourLetter.length ? ',' : ''}\n`;
}

output += '];\n';

const outputPath = path.join(__dirname, 'balanced-word-list.txt');
fs.writeFileSync(outputPath, output);

console.log(`\n✅ Balanced word list written to: ${outputPath}`);
console.log('\nNow re-shuffling for optimal distribution...');

// Create the actual optimized list preserving the balanced distribution
const finalOutput = 'export const WORD_LIST = [\n' +
    optimized.map(w => `    "${w}"`).join(',\n') +
    '\n];\n';

const finalPath = path.join(__dirname, 'balanced-shuffled-list.txt');
fs.writeFileSync(finalPath, finalOutput);

console.log(`✅ Final shuffled list written to: ${finalPath}`);
console.log('\n📊 SUMMARY:');
console.log(`   Total words: ${optimized.length}`);
console.log(`   5-letter: ${fiveLetter.length} (${((fiveLetter.length / optimized.length) * 100).toFixed(1)}%)`);
console.log(`   4-letter: ${fourLetter.length} (${((fourLetter.length / optimized.length) * 100).toFixed(1)}%)`);
