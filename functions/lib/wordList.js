"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORD_LIST = void 0;
exports.getWordMetadata = getWordMetadata;
exports.calculateWordSimilarity = calculateWordSimilarity;
exports.getWordForDate = getWordForDate;
exports.validateWordList = validateWordList;
// Balanced word list: 80% 5-letter words, 20% 4-letter words
// Total: 756 words (605 5-letter, 151 4-letter)
// Optimized for variety using seeded shuffle (seed: 42069)
exports.WORD_LIST = [
    "PIECE", "SHAPE", "AGREE", "NOVEL", "DEALT", "NEWLY", "PEACE", "ENTRY", "QUEST", "TRIED", "ADMIT", "MORAL",
    "STAFF", "FLUID", "TOPIC", "BRASS", "GIANT", "RATIO", "WHICH", "EARTH", "CHART", "DRILL", "CLICK", "HENRY",
    "PETAL", "LABEL", "BLANK", "VENUS", "ROUND", "GROSS", "PINE", "VIDEO", "SHOCK", "LIGHT", "STORM", "DAILY",
    "FIRST", "FOOL", "CREAM", "MOUNT", "COMET", "LUCKY", "COUNT", "CATCH", "USAGE", "WHILE", "BREAD", "TRUNK",
    "LIVE", "GRANT", "GAVE", "LOOSE", "LUNCH", "REST", "FLED", "ARENA", "QUIT", "SOFT", "FULLY", "TOOK",
    "GROUP", "MOTOR", "SINCE", "SMALL", "PEARL", "OCEAN", "STILL", "LAUGH", "FIBER", "BOOTH", "BRAVE", "LYING",
    "CAUSE", "THEFT", "ANGRY", "OATH", "WOMAN", "TASK", "HEART", "ISSUE", "WEEK", "MATCH", "UNTIL", "SMITH",
    "TOUGH", "LIMIT", "DRONE", "MUSIC", "BRAND", "RICE", "COACH", "LONG", "HOTEL", "FRAME", "SPORT", "PLACE",
    "CLOSE", "WRONG", "ENTER", "BOARD", "STONE", "JOKE", "FIRM", "VERSE", "PHOTO", "ALTER", "AGED", "PRIDE",
    "HONOR", "DATED", "MAJOR", "LEAST", "WORRY", "BREED", "TRUTH", "THREE", "POINT", "AGENT", "SHARE", "FIELD",
    "DOZEN", "BACK", "THEIR", "ADULT", "PROOF", "DRAFT", "BRIEF", "WATER", "HOUSE", "NEED", "TANGO", "FAITH",
    "MARCH", "SERVE", "ACID", "ASIDE", "ECHO", "DUKE", "PRIDE", "DRAWN", "CHILD", "SIXTH", "TRIAL", "URBAN",
    "ALARM", "FALSE", "STORY", "WORE", "TAXES", "TERRY", "RAGE", "DOUBT", "TITLE", "ARISE", "GIVEN", "FLEET",
    "ENEMY", "TRADE", "WHOSE", "TWICE", "MOUNT", "DRIVE", "STORM", "TILL", "ADOPT", "BASIS", "AFTER", "FOUND",
    "RIGHT", "TOUCH", "FENCE", "EARLY", "SHEET", "MENU", "EASEL", "OTHER", "SIXTY", "SHORT", "BRUSH", "SPENT",
    "SMOKE", "SELF", "GREAT", "READY", "FORTY", "PROVE", "AGAIN", "CARE", "MAGIC", "SPEAK", "BOUND", "SHELL",
    "FORUM", "STEEL", "FIGHT", "MICE", "SURE", "COAT", "THIRD", "BELOW", "SPEC", "LIVES", "LEWIS", "SOLID",
    "MESS", "CHOSE", "STEAM", "START", "LIGHT", "NEEDS", "ROMAN", "SPEND", "LARGE", "OCEAN", "FIVE", "PRAY",
    "WATCH", "TREND", "BRAIN", "SWORD", "DROVE", "RENT", "BUILD", "CHAIR", "FRESH", "ARMOR", "SIZE", "VOICE",
    "LINKS", "DENSE", "GOAL", "TABLE", "EQUAL", "PLAY", "BEST", "STORY", "ALBUM", "SMART", "PEACE", "CHIP",
    "POUND", "THEME", "AWARD", "HINT", "EIGHT", "SUPER", "ALLOW", "DISC", "VERY", "YOUTH", "NAME", "NOTED",
    "FORCE", "ELITE", "THESE", "FUEL", "STONE", "SOLE", "WARD", "SPARK", "BELT", "TRUST", "TAKEN", "ROYAL",
    "DEBUT", "SORRY", "GRACE", "TURN", "EMPTY", "MAIN", "STUDY", "FRAME", "TRUST", "MIGHT", "UNDER", "CHASE",
    "LANCE", "WORTH", "LEVEL", "GRASS", "THING", "ALONE", "BULK", "QUICK", "SPLIT", "OUGHT", "CHAOS", "TIMES",
    "OFFER", "ALIVE", "SLEEP", "CRASH", "MEDIA", "AVOID", "TROT", "STAGE", "REFER", "WHITE", "EVENT", "FAULT",
    "LEAP", "CHECK", "OPEN", "BEGAN", "CHEAP", "SOUND", "YEAH", "SHELF", "SOUTH", "HIRE", "SHUT", "TEACH",
    "LOGO", "ROBIN", "DEATH", "VISIT", "ALERT", "MANOR", "BLACK", "ROYAL", "CROWN", "VALID", "SENSE", "COVER",
    "GLOBE", "GROWN", "AUDIT", "BREAK", "SEAL", "ALONG", "MOVIE", "LEASE", "SHINE", "STEEL", "CHARM", "LEAVE",
    "STRIP", "CROWN", "HEAVY", "GULF", "SCENE", "EXIST", "THANK", "MAYBE", "DUTY", "DRANK", "SPAN", "PITCH",
    "CARRY", "YIELD", "FIELD", "SWEET", "ARRAY", "CLOCK", "SHOOT", "THAN", "ALIEN", "MIXED", "RODE", "BEGIN",
    "TOWER", "MAKER", "TRULY", "MOTH", "ANGER", "GRAND", "COAST", "FROM", "MOVED", "PEACE", "SPARE", "DEPTH",
    "DREAM", "BOOST", "THOSE", "BOSS", "GOLF", "EDGE", "JUDGE", "ROUGH", "BLOOD", "THORN", "CRAZY", "CRIME",
    "DANCE", "SPOKE", "KNOWN", "STUCK", "BEACH", "CLASS", "LOCAL", "PRIZE", "CAKE", "CURVE", "BRAVE", "CIVIL",
    "FOCUS", "WORST", "TRAIL", "SIGHT", "WASH", "TIGHT", "THAT", "APART", "ZERO", "ASSET", "MUSIC", "MOUSE",
    "THERE", "GUEST", "DELTA", "MOUTH", "INPUT", "WEST", "BUYER", "POWER", "CLEAR", "KNIT", "BUILT", "FALL",
    "LAMP", "ROUTE", "WORLD", "LEAN", "FRANK", "SPEED", "EAGLE", "WASTE", "TERM", "CHEST", "MODEL", "BADLY",
    "ABOVE", "TREE", "WHEN", "CYCLE", "CROSS", "KEEP", "SWING", "SWIM", "LINE", "CRAFT", "TRIBE", "STOCK",
    "DOING", "LOVE", "SHARK", "JONES", "STOOD", "BLAME", "RACE", "TOMB", "TASTE", "PASS", "TROOP", "DANCE",
    "FIXED", "ANGEL", "HORN", "LIGHT", "APPLY", "INNER", "HARRY", "GONE", "ROGER", "SKILL", "HELL", "TRIES",
    "JIMMY", "DRINK", "WHEEL", "ARROW", "RANGE", "HUMAN", "FRONT", "SLIDE", "BLEED", "SHADE", "ENJOY", "BLOCK",
    "ZOOM", "TRAIN", "PLATE", "PROBE", "REACH", "BLADE", "OFTEN", "GRAND", "UPPER", "WHERE", "PHONE", "PROSE",
    "NORTH", "CLEAN", "TEXAS", "JUMP", "ELECT", "BROAD", "TEMPO", "SHARP", "POPE", "CHAIN", "AREA", "ALIKE",
    "DENY", "ABUSE", "BENCH", "HAPPY", "ROBOT", "VALUE", "FIFTH", "MAGIC", "UPSET", "CORAL", "KISS", "PRINT",
    "BAKER", "TOWER", "LIAR", "IMAGE", "FUNNY", "GRADE", "NIGHT", "RAVEN", "LEST", "POLL", "GUESS", "GRACE",
    "LOGIC", "EARTH", "NOISE", "PARTY", "OCCUR", "SCORE", "WORSE", "UNION", "DRAMA", "DELAY", "SOLVE", "GATE",
    "FORTH", "SCOPE", "AUDIO", "STORE", "PANEL", "LOWER", "PLAIN", "QUEEN", "BODY", "BLAZE", "BEING", "MAYOR",
    "BASIC", "WILD", "SIZED", "PUSH", "WERE", "FINAL", "ALIGN", "STUFF", "HOOD", "PROUD", "PATH", "EXACT",
    "TRUCK", "BRING", "JOINT", "POWER", "SPED", "THINK", "EXTRA", "DRESS", "STEP", "EVERY", "FLAME", "LEARN",
    "JAPAN", "WOMEN", "BROWN", "WHOLE", "MEANT", "FLOOR", "AWARE", "EAGER", "DYING", "BLIND", "BLESS", "CROWD",
    "FROST", "LEGAL", "IDEAL", "TENT", "NEVER", "JUNE", "SMILE", "SHOW", "VIRUS", "WALTZ", "FRUIT", "GREEN",
    "BIRTH", "MINOR", "THREW", "GRAY", "BLOOM", "THICK", "SOIL", "LEMON", "CRACK", "GLASS", "SHIFT", "PRESS",
    "METAL", "GREY", "RIDE", "SHOWN", "CLOUD", "RIVER", "BROKE", "SCALE", "SUITE", "DARK", "LASER", "LAYER",
    "TRUTH", "BOOK", "HORSE", "LOAD", "GOING", "PAGE", "APPLE", "YOUNG", "PILOT", "CARD", "STYLE", "ARGUE",
    "BASES", "MARIA", "GUIDE", "THROW", "SUGAR", "VITAL", "TREAT", "FATE", "CRUDE", "SPACE", "RAPID", "MANY",
    "CALIF", "LATER", "ROOT", "FRAUD", "BLAST", "STATE", "SEVEN", "REPLY", "CLIMB", "HYDRA", "FOUR", "MONEY",
    "FIFTY", "RELAX", "NOBLE", "BILLY", "UNDUE", "SHIRT", "GRAIN", "THEN", "COPY", "CALM", "WOULD", "GENE",
    "ORBIT", "HALL", "AHEAD", "ERROR", "WOUND", "VOCAL", "VOID", "MONTH", "UNITY", "RADIO", "JAIL", "NURSE",
    "GIVE", "THEM", "DREAM", "FADE", "QUIET", "CHINA", "COURT", "STICK", "SWIFT", "VETO", "GRAVE", "CHIEF",
    "SINK", "ABLE", "PHASE", "QUITE", "KENT", "PRIOR", "TRACK", "JACK", "RAISE", "CAMP", "RIVER", "PAPER",
    "INDEX", "STAKE", "HENCE", "WROTE", "WHALE", "ACTOR", "PLANT", "CABLE", "ORDER", "WIRE", "COULD", "PAINT",
    "RIVAL", "LORE", "SHALL", "GRIM", "CLAIM", "SPACE", "TODAY", "RURAL", "FORCE", "ABOUT", "RANK", "WRITE",
    "PAINT", "VILLA", "GUARD", "TIGER", "MINUS", "STAND", "FLASH", "PRICE", "PRIME", "MERCY", "ACUTE", "TRICK",
    "TOTAL", "WRITE", "THIS", "PLANE", "WHAT", "WILL", "MARK", "FAITH", "NOVA", "USUAL", "ANGLE", "PETER"
];
// Calculate metadata for a word
function getWordMetadata(word) {
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    const letterFreq = new Map();
    let vowelCount = 0;
    let consonantCount = 0;
    for (const letter of word) {
        letterFreq.set(letter, (letterFreq.get(letter) || 0) + 1);
        if (vowels.has(letter)) {
            vowelCount++;
        }
        else {
            consonantCount++;
        }
    }
    return {
        length: word.length,
        vowelCount,
        consonantCount,
        uniqueLetters: letterFreq.size,
        letterFrequency: letterFreq
    };
}
// Calculate similarity between two words (0-1, higher = more similar)
function calculateWordSimilarity(word1, word2) {
    // Length difference penalty
    const lengthDiff = Math.abs(word1.length - word2.length);
    const lengthPenalty = lengthDiff * 0.2;
    // Calculate shared letters
    const letters1 = word1.split('');
    const letters2 = [...word2.split('')]; // Make a copy for splicing
    let sharedLetters = 0;
    for (const letter of letters1) {
        const index = letters2.indexOf(letter);
        if (index !== -1) {
            sharedLetters++;
            letters2.splice(index, 1); // Remove to avoid double counting
        }
    }
    const letterSimilarity = sharedLetters / Math.max(word1.length, word2.length);
    // Additional penalty for same-length words with high overlap
    const sameLengthBonus = (lengthDiff === 0) ? 0.2 : 0;
    return Math.max(0, Math.min(1, letterSimilarity + sameLengthBonus - lengthPenalty));
}
// Get word for a specific date (deterministic)
function getWordForDate(date) {
    const startDate = new Date('2024-01-01');
    const diffTime = Math.abs(date.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const index = diffDays % exports.WORD_LIST.length;
    return exports.WORD_LIST[index];
}
// Validate word list for problematic clusters (for testing/validation)
function validateWordList() {
    const issues = [];
    let totalSimilarity = 0;
    let maxSimilarity = 0;
    let problematicPairs = 0;
    const SIMILARITY_THRESHOLD = 0.65;
    const lengthDistribution = {};
    // Calculate length distribution
    exports.WORD_LIST.forEach(word => {
        lengthDistribution[word.length] = (lengthDistribution[word.length] || 0) + 1;
    });
    for (let i = 0; i < exports.WORD_LIST.length - 1; i++) {
        const similarity = calculateWordSimilarity(exports.WORD_LIST[i], exports.WORD_LIST[i + 1]);
        totalSimilarity += similarity;
        maxSimilarity = Math.max(maxSimilarity, similarity);
        if (similarity > SIMILARITY_THRESHOLD) {
            problematicPairs++;
            issues.push(`Words at index ${i}-${i + 1} are too similar: ` +
                `"${exports.WORD_LIST[i]}" -> "${exports.WORD_LIST[i + 1]}" ` +
                `(similarity: ${similarity.toFixed(2)})`);
        }
    }
    const avgSimilarity = totalSimilarity / (exports.WORD_LIST.length - 1);
    return {
        valid: problematicPairs === 0,
        issues: issues.slice(0, 10), // Only return first 10 issues
        stats: {
            totalWords: exports.WORD_LIST.length,
            avgSimilarity,
            maxConsecutiveSimilarity: maxSimilarity,
            problematicPairs,
            lengthDistribution
        }
    };
}
//# sourceMappingURL=wordList.js.map