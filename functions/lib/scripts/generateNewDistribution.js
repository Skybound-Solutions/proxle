"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wordList_1 = require("../wordList");
// Seeded random number generator
class SeededRandom {
    constructor(seed) { this.seed = seed; }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}
// Fisher-Yates shuffle with seed
function seededShuffle(array, seed) {
    const result = [...array];
    const rng = new SeededRandom(seed);
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
console.log('=== CREATING NEW BALANCED WORD LIST (50% 5-letter, 30% 4-letter, 20% 3-letter) ===\n');
// Separate words by length
const byLength = new Map();
wordList_1.WORD_LIST.forEach(word => {
    if (!byLength.has(word.length))
        byLength.set(word.length, []);
    byLength.get(word.length).push(word);
});
console.log('Current word list breakdown:');
Array.from(byLength.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([length, words]) => {
    console.log(`  ${length} letters: ${words.length} words`);
});
// Target: 756 total words
// 50% 5-letter = 378
// 30% 4-letter = 227  
// 20% 3-letter = 151
const TOTAL_WORDS = 756;
const TARGET_5_LETTER = Math.round(TOTAL_WORDS * 0.50); // 378
const TARGET_4_LETTER = Math.round(TOTAL_WORDS * 0.30); // 227
const TARGET_3_LETTER = TOTAL_WORDS - TARGET_5_LETTER - TARGET_4_LETTER; // 151
console.log(`\nTarget distribution for ${TOTAL_WORDS} total words:`);
console.log(`  5-letter: ${TARGET_5_LETTER} (${((TARGET_5_LETTER / TOTAL_WORDS) * 100).toFixed(1)}%)`);
console.log(`  4-letter: ${TARGET_4_LETTER} (${((TARGET_4_LETTER / TOTAL_WORDS) * 100).toFixed(1)}%)`);
console.log(`  3-letter: ${TARGET_3_LETTER} (${((TARGET_3_LETTER / TOTAL_WORDS) * 100).toFixed(1)}%)`);
// Get available words
const fiveLetterWords = byLength.get(5) || [];
const fourLetterWords = byLength.get(4) || [];
const threeLetterWords = []; // Will need to add these
// Additional common 4-letter words to supplement existing list
const ADDITIONAL_4_LETTER = [
    "ABLE", "ACHE", "ACID", "ACNE", "ACRE", "AIDE", "AJAR", "AKIN", "ALLY", "ALSO", "ALTO", "AMID", "ANEW",
    "ANTE", "AUTO", "AWAY", "AXLE", "BABY", "BAIL", "BAIT", "BAKE", "BALD", "BALE", "BANG", "BARE", "BARK",
    "BASE", "BASH", "BASS", "BATH", "BAWL", "BEAD", "BEAK", "BEAM", "BEAN", "BEAT", "BEEN", "BELL", "BEND",
    "BENT", "BIAS", "BIKE", "BILE", "BIND", "BITE", "BLAH", "BLED", "BLEW", "BLOB", "BLOW", "BLUR", "BOAR",
    "BOIL", "BOLT", "BOMB", "BOND", "BOOM", "BOOT", "BORE", "BOTH", "BOUT", "BOWL", "BRAD", "BRAG", "BRAN",
    "BRAT", "BRAY", "BRED", "BREW", "BRIM", "BROW", "BUCK", "BULB", "BUMP", "BUNK", "BURN", "BURP", "BURY",
    "BUSH", "BUST", "BUSY", "BUTT", "BUZZ", "BYTE", "CAFE", "CAGE", "CALF", "CALL", "CALM", "CAME", "CANE",
    "CAPE", "CARP", "CART", "CASE", "CASK", "CAST", "CAVE", "CELL", "CENT", "CHAP", "CHAR", "CHEW", "CHIN",
    "CHOP", "CHOW", "CHUG", "CHUM", "CITE", "CITY", "CLAD", "CLAM", "CLAN", "CLAP", "CLAW", "CLAY", "CLIP"
];
// Combine existing 4-letter words with additional ones
const all4LetterWords = [...fourLetterWords, ...ADDITIONAL_4_LETTER];
console.log(`\nAvailable words:`);
console.log(`  5-letter: ${fiveLetterWords.length} available`);
console.log(`  4-letter: ${all4LetterWords.length} available (${fourLetterWords.length} existing + ${ADDITIONAL_4_LETTER.length} additional)`);
console.log(`  3-letter: ${threeLetterWords.length} available`);
// Common 3-letter words to add
const COMMON_3_LETTER = [
    "ACE", "ACT", "ADD", "AGE", "AGO", "AID", "AIM", "AIR", "ALL", "AND", "ANT", "ANY", "APE", "ARC", "ARE", "ARK",
    "ARM", "ART", "ASH", "ASK", "ATE", "AWE", "AXE", "AYE", "BAD", "BAG", "BAN", "BAR", "BAT", "BAY", "BED", "BEE",
    "BET", "BID", "BIG", "BIN", "BIT", "BOW", "BOX", "BOY", "BUD", "BUG", "BUM", "BUN", "BUS", "BUT", "BUY", "CAB",
    "CAN", "CAP", "CAR", "CAT", "COB", "COD", "COG", "COP", "COT", "COW", "CRY", "CUB", "CUD", "CUE", "CUP", "CUR",
    "CUT", "DAB", "DAD", "DAM", "DAY", "DEN", "DEW", "DID", "DIE", "DIG", "DIM", "DIN", "DIP", "DOC", "DOE", "DOG",
    "DOT", "DRY", "DUB", "DUD", "DUE", "DUG", "DYE", "EAR", "EAT", "EEL", "EGG", "ELF", "ELK", "ELM", "END", "ERA",
    "ERR", "EVE", "EWE", "EYE", "FAD", "FAN", "FAR", "FAT", "FAX", "FED", "FEE", "FEW", "FIG", "FIN", "FIR", "FIT",
    "FIX", "FLU", "FLY", "FOB", "FOE", "FOG", "FOR", "FOX", "FRY", "FUN", "FUR", "GAB", "GAG", "GAL", "GAP", "GAS",
    "GAY", "GEL", "GEM", "GET", "GIG", "GIN", "GNU", "GOB", "GOD", "GOT", "GUM", "GUN", "GUT", "GUY", "GYM", "HAD",
    "HAM", "HAS", "HAT", "HAY", "HEM", "HEN", "HER", "HEW", "HEX", "HID", "HIM", "HIP", "HIS", "HIT", "HOB", "HOD",
    "HOE", "HOG", "HOP", "HOT", "HOW", "HUB", "HUE", "HUG", "HUM", "HUT", "ICE", "ICY", "ILL", "IMP", "INK", "INN"
];
// Use the common 3-letter words and shuffle to select what we need
const shuffled3Letter = seededShuffle(COMMON_3_LETTER, 42069);
const selected3Letter = shuffled3Letter.slice(0, TARGET_3_LETTER);
// Shuffle and select from existing 5-letter words
const shuffled5Letter = seededShuffle(fiveLetterWords, 42069);
const selected5Letter = shuffled5Letter.slice(0, TARGET_5_LETTER);
// Shuffle and select from combined 4-letter words
const shuffled4Letter = seededShuffle(all4LetterWords, 42069);
const selected4Letter = shuffled4Letter.slice(0, TARGET_4_LETTER);
// Combine all words
const newWordList = [...selected5Letter, ...selected4Letter, ...selected3Letter];
// Shuffle the combined list
const finalList = seededShuffle(newWordList, 42069);
console.log(`\nFinal word list:`);
console.log(`  Total: ${finalList.length} words`);
const final5 = finalList.filter(w => w.length === 5).length;
const final4 = finalList.filter(w => w.length === 4).length;
const final3 = finalList.filter(w => w.length === 3).length;
console.log(`  5-letter: ${final5} (${((final5 / finalList.length) * 100).toFixed(1)}%)`);
console.log(`  4-letter: ${final4} (${((final4 / finalList.length) * 100).toFixed(1)}%)`);
console.log(`  3-letter: ${final3} (${((final3 / finalList.length) * 100).toFixed(1)}%)`);
// Write output
const fs = require('fs');
const path = require('path');
let output = '// Balanced word list: 50% 5-letter, 30% 4-letter, 20% 3-letter\n';
output += `// Total: ${finalList.length} words (${final5} 5-letter, ${final4} 4-letter, ${final3} 3-letter)\n`;
output += '// Optimized for variety using seeded shuffle (seed: 42069)\n';
output += 'export const WORD_LIST = [\n';
// Write all words in shuffled order, 12 per line
for (let i = 0; i < finalList.length; i += 12) {
    const chunk = finalList.slice(i, i + 12);
    output += `    ${chunk.map(w => `"${w}"`).join(', ')}${i + 12 < finalList.length ? ',' : ''}\n`;
}
output += '];\n';
const outputPath = path.join(__dirname, 'new-balanced-word-list.txt');
fs.writeFileSync(outputPath, output);
console.log(`\n✅ New word list written to: ${outputPath}`);
console.log('\nCopy this list to replace WORD_LIST in functions/src/wordList.ts');
console.log('Also update src/lib/wordUtils.ts with the same list');
//# sourceMappingURL=generateNewDistribution.js.map