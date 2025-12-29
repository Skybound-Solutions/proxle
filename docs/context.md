# Wordle Research & Context

## 1. Game Overview
Wordle is a web-based word puzzle game where players have six attempts to guess a secret five-letter word. It gained massive popularity due to its simple yet addictive mechanics, social sharing features, and "one puzzle per day" model.

## 2. Core Rules
*   **Objective:** Guess the hidden 5-letter word in 6 tries or fewer.
*   **Word Length:** Strictly 5 letters.
*   **Valid Guesses:** Each guess must be a valid 5-letter word found in the game's dictionary. Nonsense strings are rejected.
*   **Feedback System:** After each guess, the color of the tiles changes to show how close the guess was to the word:
    *   **Green:** The letter is in the word and in the correct position.
    *   **Yellow:** The letter is in the word but in the wrong position.
    *   **Gray:** The letter is not in the word in any spot.
*   **Daily Puzzle:** (Original implementation) usage of a single puzzle that resets daily for all users globally.

## 3. Game Mechanics & Logic
### The Feedback Loop
1.  **Input:** User types a 5-letter word.
2.  **Validation:** System checks if the word exists in the `valid_guesses` list.
3.  **Evaluation:** System compares the guess against the `target_word`.
    *   *Green check:* Exact match of (Char, Index).
    *   *Yellow check:* Remaining characters in guess match remaining characters in target.
    *   *Gray check:* No match.
4.  **State Update:** Keyboard keys are updated to reflect the state of letters (e.g., if a letter is confirmed gray, it is darkened on the on-screen keyboard).
5.  **Win/Loss:**
    *   *Win:* All 5 letters are Green.
    *   *Loss:* 6th guess is incorrect. Target word is revealed.

### Hard Mode
*   Any revealed hints must be used in subsequent guesses (e.g., if 'A' is Green in spot 2, all future guesses must have 'A' in spot 2).

## 4. Key Design Principles
*   **Minimalism:** Clean interface, lack of ads or clutter, focus entirely on the grid.
*   **Desirable Difficulty:** The dictionary of *answers* is curated to common words, avoiding obscure jargon, while the dictionary of *allowed guesses* is broad.
*   **Social Sharing:** The "Emoji Grid" (sharing results without spoilers) was a viral growth vector.
*   **Affordance:** On-screen keyboard updates to show "dead" letters, reducing cognitive load.
*   **Animations:**
    *   *Shake:* On invalid word submission.
    *   *Flip:* Sequential revealing of tile colors after submission.
    *   *Bounce:* On winning.

## 5. Data Structures
*   **Target List (Answers):** Approximately 2,309 curated words. Common English words.
*   **Dictionary (Valid Guesses):** Approximately 12,972 words. Includes obscure words to prevent players from getting stuck if they know a real word that isn't a "common" answer.

## 6. Technical Implementation Details
*   **State Management:**
    *   Current Guess (string, interacting with grid).
    *   Guess History (array of strings).
    *   Game Status (Playing, Won, Lost).
    *   Stats (Streak, Distribution).
*   **Storage:** Typically uses LocalStorage for persisting state across reloads and tracking streaks.
*   **Theme:** High contrast with support for Dark Mode and High Contrast (Colorblind) Mode.
