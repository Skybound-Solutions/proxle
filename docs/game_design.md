# Proxle: Game Design Document

## 1. Executive Summary
**Proxle** is a hybrid word-guessing game that fuses the **Semantic Discovery** of *Semantle* with the **Deductive Reasoning** of *Wordle*.

*   **Core Hook:** You aren't just guessing letters; you are navigating a map of meanings.
*   **The Constraint:** To prevent the game from being "too easy" via simple synonym lookups, the target word's length and position are obscured.

## 2. Core Mechanics

### 2.1 The Grid
*   **Max Width:** 5 Slots (The user's constraint: "5 letters instead of 6").
*   **Target Word:** Can be **3, 4, or 5 letters** long.
*   **Hidden Structure:** The player does not know the length of the target word.
    *   *Visuals:* The grid shows 5 empty tiles. The target structure might be `[ ][ ][T][A][R]` (Right aligned) or `[T][A][R][ ][ ]` (Left aligned) or `[ ][T][A][R][ ]` (Centered).
    *   **The "Blank" Mechanic:** The "Blanks" are part of the puzzle. The player must guess the *word* AND its *alignment* (or at least, the ambiguity of its length).

### 2.2 The Guessing Loop (The Hybrid Engine)
1.  **Input:** Player inputs a valid English word (3 to 5 letters). They must position it within the 5-slot grid.
    *   **Constraint:** Spaces must be **contiguous** on the sides. You can enter `_ _ C A T` or `C A T _ _`, but **NOT** `_ C A _ T`.
    *   *Mechanism:* The player types the word, then uses controls (or arrow keys) to "slide" the entire word Left, Right, or Center within the 5 slots.
2.  **Semantic Feedback (The "Compass")**:
    *   **Trigger:** On every guess.
    *   **Output:** The system reveals **Conceptually Similar Words** (Synonyms/Associations) and a "Temperature" score (Similarity %).
    *   *Purpose:* Tells you *what* exploring (Meaning).
3.  **Orthographic Feedback (The "Map")**:
    *   **Trigger:** On every guess.
    *   **Mechanic:** Standard Wordle Coloring, but applied to the 5-slot grid.
        *   **Green:** Letter is correct and in the correct slot (relative to the invisible target alignment).
        *   **Yellow:** Letter exists in the target word but is in the wrong slot.
        *   **Gray:** Letter does not exist in the target.
    *   *The "Blank" Twist:* If the target is offset (e.g., right-aligned `_ W O R D`) and you guess left-aligned `W O R L D`, the alignment mismatch might turn correct letters Yellow or Gray depending on exact logic.
    *   *Purpose:* Tells you *where* you are (Spelling/Structure).

### 2.3 Winning Condition
*   The player enters the correct letters in the correct slots.

## 3. The Rules of Engagement

### 3.1 Guess Limit
*   **Recommendation: 8 Guesses.**
    *   *Why?* Standard Wordle is 6. With the added complexity of "Hidden Length" and "Variable Alignment" (Blanks), 6 might be too punishing. 8 gives roughly 2 "probe" guesses to find the length/concept, and 6 to narrow it down.
*   *Alternative:* **Infinite Guesses (Score Attack).**
    *   Player is ranked by how few guesses they took. Less "Game Over" frustration, but less tension.
*   *Decision:* **We will start with a hard limit of 8.** This preserves the "Game" stakes.

### 3.2 Difficulty Balancing
1.  **Variable Length (3-5 Letters):**
    *   Target: "LION" (4 letters).
    *   Grid: `[ ][ ][ ][ ][ ]`.
    *   Player doesn't know if it's 3, 4, or 5 letters, OR where it sits (Left/Right/Center).
2.  **The "Blanks" Mechanic:**
    *   Does a "Blank" count as a character?
    *   *Proposed Logic:* No. We only judge the **Letters**.
    *   *Alignment Logic:* The User's guess aligns effectively against the Target. If Target is `_ B I R D` and user guesses `B R E A D` (Left aligned `B R E A D`):
        *   Target Slot 1 (`_`) vs Guess `B`: No Match.
        *   Target Slot 2 (`B`) vs Guess `R`: `R` is in `BIRD` (Slot 4) -> **Yellow**.
        *   ...
    *   This "Positional Confusion" is the unique challenge of Proxle.

## 4. User Interface (UI)
*   **Input Field:** Accepts 3-5 chars.
*   **History Log:** Shows previous guesses + their Semantic Similarity Score (or Top N synonyms).
*   **Themes:** Dark/Light mode (standard).

## 5. Technical Stack (Proposed)
*   **Frontend:** React (Vite) + TailwindCSS.
*   **Backend / Logic:**
    *   **Word2Vec / Embeddings:** Need a lightweight way to calculate similarity client-side OR a serverless function efficiently querying a vector DB (e.g., Supabase pgvector).
    *   **Supabase:** Ideal for storing the Daily Puzzle and the Vector Embeddings of the dictionary.

## 6. Development Roadmap
1.  **Prototype (Concept)**: A simple script to check "Guess" vs "Target" via Vector Similarity.
2.  **Frontend MVP**: The 5-slot grid UI and basic similarity fetch.
3.  **Refinement**: Tuning the "Similar Word" threshold (don't give away the answer immediately).

## 7. Open Questions
*   **Blanks Position:** Confirmed that blanks are strictly **external**. The target is a contiguous block of letters.
    *   *Status:* **Resolved.** The game design strictly enforces contiguous words. `C A T` must be `[C][A][T][ ][ ]`, `[ ][C][A][T][ ]`, or `[ ][ ][C][A][T]`.
