# Research: Semantle (Word Game)

> **Note:** The user query referred to "Seamantle", which is likely a typo for **Semantle**, a popular semantic word guessing game. This document covers the research for Semantle.

## 1. Overview
**Semantle** is a daily browser-based word guessing game created by David Turner in 2022. Unlike traditional word games like *Wordle* that focus on spelling and letter positioning, Semantle focuses entirely on **meaning** (semantics).

Players must guess a secret word by finding words that are semantically similar to it. The game uses an AI model (Word2Vec) to calculate the "distance" between the user's guess and the secret word in a high-dimensional vector space.

## 2. Rules & Mechanics

### The Goal
- Find the secret word of the day.
- There is no limit to the number of guesses.

### The Feedback Loop
Upon entering a word, the game provides three key pieces of data:
1.  **Similarity Score**: A numerical value (ranging efficiently from -100 to 100).
    -   `100.00`: The exact secret word.
    -   `> ~55.00`: Usually very close.
    -   `Negatives`: The word is completely unrelated semantically (cold).
2.  **Getting Closer (Rank)**:
    -   If a guess is within the **top 1,000** nearest words to the secret word, the game displays a progress bar and a rank integer (e.g., `990/1000`).
    -   `1000/1000` is the secret word itself.
    -   `1/1000` is the 1000th closest word.
3.  **Cold Status**:
    -   If the word is not in the top 1,000, the rank column remains empty or indicates "Cold".

## 3. Intricacies & Design

### The "Engine": Word2Vec
Semantle runs on **Word2Vec**, specifically a model trained on the Google News dataset.
-   **High-Dimensional Space**: Words are mapped as vectors in a 300-dimensional space.
-   **Contextual Learning**: The AI learns meaning by looking at which words appear near each other in sentences.
    -   *Example*: "King" and "Queen" appear in similar contexts, so their vectors are close.
-   **Cosine Similarity**: The "Similarity Score" is actually the **cosine similarity** between the two word vectors.

### Design Aesthetics
-   **Minimalist UI**: The interface is stark and functional.
    -   **Input**: Simple text box.
    -   **Table**: A historical list of guesses, typically sorted by similarity to help the user track their "hottest" trail.
-   **Visual Feedback**:
    -   **Heatmap Colors**:
        -   **Green**: High similarity (often used for top 1000).
        -   **Orange/Red/Blue (Cold)**: Lower similarity tiers (implementation varies slightly by version/spin-off, but usually "Cold" is distinct from "Warm").

## 4. Challenges & "Traps"

The game is notoriously difficult due to specific quirks of the Word2Vec model:

### 1. The Antonym Problem
This is the most common stumbling block for new players.
-   **The Trap**: Antonyms often appear in identical contexts.
    -   *Phrase*: "The water is very [hot/cold]."
-   **The Result**: "Hot" and "Cold" have very high semantic similarity in the eyes of the AI. A player might guess "Hot", get a high score, and assume the answer is related to heat, when the answer is actually "Frozen".

### 2. "Orbiting"
Players often find themselves "orbiting" the answer—finding many words in the top 900-990 range but failing to find the trigger word.
-   This often happens with **categories**.
    -   *Secret Word*: "Spruce"
    -   *Orbiting*: Player guesses "Tree", "Pine", "Forest", "Oak" (all high scores) but cannot pinpoint the specific instance.

### 3. Part of Speech Confusion
Word2Vec does not strictly enforce parts of speech in its proximity.
-   A noun might be closest to an adjective if they are frequently used together, leading players down incorrect grammatical paths.

### 4. Polysemy (Multiple Meanings)
-   If the secret word is "Bank", the close words might mix financial terms ("Money", "Deposit") with river terms ("River", "Water"), confusing the specific context the AI is prioritizing for that vector.

## 5. Strategic Gameplay

### "Probing"
Experienced players start with a standard set of "probe" words to triangulate the general domain.
-   *Examples*: "Person", "Place", "Thing", "Idea", "Work", "Play", "Animal", "Science", "Love".
-   If "Animal" spikes, they abandon "Science" and drill down into biology.

### Lateral Thinking
When stuck on a high-scoring word (e.g., "Happy"), players must think laterally rather than synonymously.
-   Instead of just "Joyful" or "Glad", try "Sad" (antonym check) or "Birthday" (situational check).
