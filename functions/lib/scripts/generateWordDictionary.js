"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Script to generate comprehensive word dictionary from public domain sources
const fs = require("fs");
const https = require("https");
async function fetchWords(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data.split('\n').map(w => w.trim().toUpperCase()).filter(Boolean)));
            res.on('error', reject);
        });
    });
}
async function generateDictionary() {
    console.log('Fetching word lists from public domain sources...\n');
    // Fetch 5-letter words from Wordle (very comprehensive)
    const wordle5 = await fetchWords('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words');
    console.log(`✓ Wordle 5-letter words: ${wordle5.length}`);
    // Fetch Google 10K common words (includes 3-5 letter)
    const googleWords = await fetchWords('https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt');
    const google3to5 = googleWords.filter(w => w.length >= 3 && w.length <= 5);
    console.log(`✓ Google common words (3-5 letters): ${google3to5.length}`);
    // Combine and deduplicate
    const allWords = new Set([...wordle5, ...google3to5]);
    // Also add our game words to ensure they're all valid
    const gameListContent = fs.readFileSync(__dirname + '/../wordList.ts', 'utf8');
    const match = gameListContent.match(/export const WORD_LIST = \[([\s\S]*?)\];/);
    if (match) {
        const gameWordsMatches = match[1].match(/"([A-Z]+)"/g);
        if (gameWordsMatches) {
            const gameWords = gameWordsMatches.map(w => w.replace(/"/g, ''));
            gameWords.forEach(w => allWords.add(w));
            console.log(`✓ Added ${gameWords.length} game words`);
        }
    }
    const sortedWords = Array.from(allWords).sort();
    // Statistics
    const by3 = sortedWords.filter(w => w.length === 3).length;
    const by4 = sortedWords.filter(w => w.length === 4).length;
    const by5 = sortedWords.filter(w => w.length === 5).length;
    console.log(`\nFinal comprehensive dictionary:`);
    console.log(`  3-letter: ${by3} words`);
    console.log(`  4-letter: ${by4} words`);
    console.log(`  5-letter: ${by5} words`);
    console.log(`  Total: ${sortedWords.length} words`);
    // Generate TypeScript output
    let output = `// Comprehensive word dictionary (3-5 letters) from public domain sources
// Generated from Wordle official list + Google 10K common words
// Total: ${sortedWords.length} words (${by3} 3-letter, ${by4} 4-letter, ${by5} 5-letter)
// Generated: ${new Date().toISOString()}

export const COMMON_WORDS = new Set<string>([
`;
    // Write 20 words per line for better formatting
    for (let i = 0; i < sortedWords.length; i += 20) {
        const chunk = sortedWords.slice(i, i + 20);
        output += `    ${chunk.map(w => `"${w}"`).join(', ')}${i + 20 < sortedWords.length ? ',' : ''}\n`;
    }
    output += `]);

/**
 * Check if a word is valid (exists in common dictionary)
 */
export function isValidWord(word: string): boolean {
    return COMMON_WORDS.has(word.toUpperCase());
}
`;
    // Write to file
    const outputPath = __dirname + '/../../src/data/commonWords.ts';
    fs.writeFileSync(outputPath, output);
    console.log(`\n✅ Generated: ${outputPath}`);
    // Verify HELLO is in there
    console.log(`\n✓ Contains "HELLO": ${sortedWords.includes('HELLO')}`);
}
generateDictionary().catch(console.error);
//# sourceMappingURL=generateWordDictionary.js.map