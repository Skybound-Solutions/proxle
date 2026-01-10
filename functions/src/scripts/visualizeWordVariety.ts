import { getWordForDate, calculateWordSimilarity } from '../wordList';

console.log('=== WORD VARIETY VISUALIZATION ===\n');

// Function to create a visual bar chart
function createBar(value: number, max: number = 1, width: number = 40): string {
    const filled = Math.floor((value / max) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

// Analyze a 30-day period
const startDate = new Date('2025-12-15');
const days = 30;
const words: Array<{ date: string; word: string; similarity: number }> = [];

console.log('📅 30-DAY WORD VARIETY ANALYSIS (Dec 15, 2025 - Jan 13, 2026)\n');
console.log('Date       | Word      | Length | Similarity to Previous Day');
console.log('-----------|-----------|--------|' + '-'.repeat(42));

let prevWord = '';
let totalSimilarity = 0;
let highSimilarityCount = 0;

for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const word = getWordForDate(date.toLocaleDateString('en-CA'));
    const dateStr = date.toISOString().split('T')[0];

    let similarity = 0;
    if (prevWord) {
        similarity = calculateWordSimilarity(prevWord, word);
        totalSimilarity += similarity;
        if (similarity > 0.6) {
            highSimilarityCount++;
        }
    }

    words.push({ date: dateStr, word, similarity });

    const similarityBar = prevWord ? createBar(similarity, 1, 30) : 'N/A'.padEnd(30);
    const similarityText = prevWord ? similarity.toFixed(3) : 'N/A';
    const warning = similarity > 0.6 ? ' ⚠️' : '';

    console.log(
        `${dateStr} | ${word.padEnd(9)} | ${word.length}      | ${similarityBar} ${similarityText}${warning}`
    );

    prevWord = word;
}

// Statistics
console.log('\n📊 STATISTICS:\n');
const avgSimilarity = totalSimilarity / (days - 1);
console.log(`Average Similarity:      ${avgSimilarity.toFixed(3)}`);
console.log(`High Similarity Days:    ${highSimilarityCount}/${days - 1} (${((highSimilarityCount / (days - 1)) * 100).toFixed(1)}%)`);
console.log(`Low Similarity Days:     ${(days - 1 - highSimilarityCount)}/${days - 1} (${(((days - 1 - highSimilarityCount) / (days - 1)) * 100).toFixed(1)}%)`);

// Length distribution
const lengthDist = new Map<number, number>();
words.forEach(({ word }) => {
    lengthDist.set(word.length, (lengthDist.get(word.length) || 0) + 1);
});

console.log('\n📏 LENGTH DISTRIBUTION:\n');
Array.from(lengthDist.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([length, count]) => {
        const bar = createBar(count, days, 30);
        const pct = ((count / days) * 100).toFixed(1);
        console.log(`${length} letters: ${bar} ${count} (${pct}%)`);
    });

// Identify any problem areas
console.log('\n🔍 POTENTIAL ISSUES:\n');
const issues: string[] = [];

for (let i = 0; i < words.length - 2; i++) {
    const sim1 = calculateWordSimilarity(words[i].word, words[i + 1].word);
    const sim2 = calculateWordSimilarity(words[i + 1].word, words[i + 2].word);

    if (sim1 > 0.6 && sim2 > 0.6) {
        issues.push(
            `${words[i].date} - ${words[i + 2].date}: ` +
            `${words[i].word} → ${words[i + 1].word} → ${words[i + 2].word} ` +
            `(${sim1.toFixed(2)}, ${sim2.toFixed(2)})`
        );
    }
}

if (issues.length === 0) {
    console.log('✅ No clusters of 3+ consecutive similar words found!');
} else {
    console.log(`⚠️  Found ${issues.length} potential issue(s):`);
    issues.forEach(issue => console.log(`   ${issue}`));
}

// Quality score
console.log('\n🏆 QUALITY SCORE:\n');
const qualityScore = Math.max(0, 100 - (avgSimilarity * 100) - (highSimilarityCount * 5));
const scoreBar = createBar(qualityScore, 100, 40);

console.log(`${scoreBar} ${qualityScore.toFixed(1)}/100`);

if (qualityScore >= 80) {
    console.log('Grade: A - Excellent variety! ⭐⭐⭐⭐⭐');
} else if (qualityScore >= 60) {
    console.log('Grade: B - Good variety ⭐⭐⭐⭐');
} else if (qualityScore >= 40) {
    console.log('Grade: C - Acceptable ⭐⭐⭐');
} else {
    console.log('Grade: D - Needs improvement ⭐⭐');
}

console.log('\n✅ Analysis complete!');
