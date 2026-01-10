"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wordList_1 = require("../wordList");
// Helper function to calculate Levenshtein distance (edit distance)
function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[str2.length][str1.length];
}
// Calculate shared letters between two words
function sharedLetters(word1, word2) {
    const letters1 = word1.split('');
    const letters2 = word2.split('');
    let shared = 0;
    for (const letter of letters1) {
        const index = letters2.indexOf(letter);
        if (index !== -1) {
            shared++;
            letters2.splice(index, 1); // Remove to avoid double counting
        }
    }
    return shared;
}
// Analyze word similarity
function analyzeWordSimilarity(word1, word2) {
    const distance = levenshteinDistance(word1, word2);
    const shared = sharedLetters(word1, word2);
    const minLength = Math.min(word1.length, word2.length);
    const similarityScore = (minLength - distance) / minLength;
    return {
        distance,
        shared,
        similarityScore: similarityScore.toFixed(2),
        lengthDiff: Math.abs(word1.length - word2.length)
    };
}
// Get words for date range
function getWordsForDateRange(startDate, days) {
    const words = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const word = (0, wordList_1.getWordForDate)(date.toLocaleDateString('en-CA'));
        words.push({
            date: date.toISOString().split('T')[0],
            word,
            index: Math.floor((date.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24)) % wordList_1.WORD_LIST.length
        });
    }
    return words;
}
console.log('=== PROXLE WORD SELECTION ANALYSIS ===\n');
// Analysis 1: Check recent words (last 7 days)
console.log('1. RECENT WORDS (Last 7 Days):');
const today = new Date('2025-12-31'); // Current date
const recentWords = getWordsForDateRange(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), 7);
recentWords.forEach(({ date, word, index }) => {
    console.log(`  ${date}: ${word} (index: ${index})`);
});
console.log('\n2. SIMILARITY ANALYSIS (Last 3 Days):');
if (recentWords.length >= 3) {
    const last3 = recentWords.slice(-3);
    console.log(`  Words: ${last3.map(w => w.word).join(', ')}`);
    for (let i = 0; i < last3.length - 1; i++) {
        const word1 = last3[i].word;
        const word2 = last3[i + 1].word;
        const analysis = analyzeWordSimilarity(word1, word2);
        console.log(`\n  ${word1} → ${word2}:`);
        console.log(`    - Edit Distance: ${analysis.distance}`);
        console.log(`    - Shared Letters: ${analysis.shared}/${Math.min(word1.length, word2.length)}`);
        console.log(`    - Similarity Score: ${analysis.similarityScore}`);
        console.log(`    - Length Difference: ${analysis.lengthDiff}`);
    }
}
console.log('\n\n3. WORD LIST STATISTICS:');
console.log(`  Total Words: ${wordList_1.WORD_LIST.length}`);
// Analyze length distribution
const lengthDistribution = {};
wordList_1.WORD_LIST.forEach(word => {
    lengthDistribution[word.length] = (lengthDistribution[word.length] || 0) + 1;
});
console.log('\n  Length Distribution:');
Object.keys(lengthDistribution).sort((a, b) => parseInt(a) - parseInt(b)).forEach(length => {
    const count = lengthDistribution[parseInt(length)];
    const percentage = ((count / wordList_1.WORD_LIST.length) * 100).toFixed(1);
    console.log(`    ${length} letters: ${count} words (${percentage}%)`);
});
console.log('\n4. CHECKING FOR CLUSTERS OF SIMILAR WORDS IN THE LIST:');
// Find consecutive similar words in the list
const clusters = [];
for (let i = 0; i < wordList_1.WORD_LIST.length - 2; i++) {
    const word1 = wordList_1.WORD_LIST[i];
    const word2 = wordList_1.WORD_LIST[i + 1];
    const word3 = wordList_1.WORD_LIST[i + 2];
    const sim1 = analyzeWordSimilarity(word1, word2);
    const sim2 = analyzeWordSimilarity(word2, word3);
    const avgSimilarity = (parseFloat(sim1.similarityScore) + parseFloat(sim2.similarityScore)) / 2;
    // If average similarity is high and they're similar length
    if (avgSimilarity > 0.5 && word1.length === word2.length && word2.length === word3.length) {
        clusters.push({
            start: i,
            words: [word1, word2, word3],
            avgSimilarity
        });
    }
}
console.log(`  Found ${clusters.length} clusters of 3+ consecutive similar words:`);
clusters.slice(0, 5).forEach(cluster => {
    console.log(`    Index ${cluster.start}: ${cluster.words.join(', ')} (avg similarity: ${cluster.avgSimilarity.toFixed(2)})`);
});
if (clusters.length > 5) {
    console.log(`    ... and ${clusters.length - 5} more`);
}
// Find the POND, PONY, POOL cluster specifically
const pondIndex = wordList_1.WORD_LIST.indexOf('POND');
const ponyIndex = wordList_1.WORD_LIST.indexOf('PONY');
const poolIndex = wordList_1.WORD_LIST.indexOf('POOL');
console.log('\n5. SPECIFIC ISSUE - POND, PONY, POOL:');
console.log(`  POND is at index: ${pondIndex}`);
console.log(`  PONY is at index: ${ponyIndex}`);
console.log(`  POOL is at index: ${poolIndex}`);
console.log(`  These are consecutive in the list! (indexes ${pondIndex}-${poolIndex})`);
if (pondIndex === 157 && ponyIndex === 158 && poolIndex === 159) {
    console.log(`  ⚠️  FOUND THE PROBLEM: These three similar words are sequential in the array!`);
}
console.log('\n6. RECOMMENDATIONS:');
console.log('  ✓ Shuffle the word list to distribute similar words');
console.log('  ✓ Implement a similarity check to avoid consecutive similar words');
console.log('  ✓ Consider using a seeded random shuffle for reproducibility');
console.log('  ✓ Add metadata tracking for word characteristics (letter patterns, difficulty)');
console.log('  ✓ Implement a validation function to check for problematic clusters');
//# sourceMappingURL=analyzeWords.js.map