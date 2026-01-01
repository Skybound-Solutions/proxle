# Keyboard Layout Fix

## Problem
The keyboard was previously "way too high" (likely floating in the middle of the screen because the game board content was short and not expanding) after an attempt to fix it being "too low".

## Solution
1. **Push to Bottom**: Changed the `<main>` game board container from `flex-shrink` to `flex-1`. This forces it to occupy all available vertical space between the header and the keyboard, effectively pushing the keyboard to the bottom of the viewport.
2. **Maximize Game Area**: Removed the `max-h-[20vh]` constraint from the guesses list. It now uses `flex-1` to fill the expanded `<main>` area, showing more guesses and utilizing the empty space better.
3. **Safe Area**: Increased the keyboard footer's bottom padding from `pb-4` to `pb-8`. This ensures it clears the native home indicator on modern mobile devices ("mobile keyboard feel") while staying anchored to the bottom.

## Technical Details
- **File**: `src/App.tsx`
- **Main Change**: `<main className="flex-1 ...">` (Line 818)
- **Guesses Change**: Removed `max-h-[20vh]` (Line 915)
- **Footer Change**: `pb-8` (Line 974)

## Result
- Layout is robust: `Header - Flexible Game Board - Fixed Keyboard`.
- Keyboard sits at bottom.
- No scroll required to access controls.
- Game content uses available space.
