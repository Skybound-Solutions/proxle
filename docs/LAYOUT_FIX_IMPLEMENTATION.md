# Layout Fix: Dynamic Viewport & Safe Areas

## Problem
The previous attempts to position the keyboard resulted in it being either "too high" (floating) or "too low" (obscured by mobile browser navigation bars). The root cause was relying on `h-screen` (100vh), which on mobile browsers often includes the area _behind_ the address bar and navigation toolbar.

## Solution
We have implemented a robust, modern mobile layout fix using **Dynamic Viewport Units** and **Safe Area Insets**.

### 1. Dynamic Viewport Height (`dvh`)
**Change:** Updated root container in `src/App.tsx` and global styles in `src/index.css`.
**Code:** `h-[100dvh]`
**Why:** `dvh` automatically adjusts the container height when the mobile browser's UI (address bar/nav bar) expands or retracts. This ensures the app ALWAYS fits perfectly in the visible space, so the bottom of our app (the keyboard) aligns with the bottom of the visible screen.

### 2. Safe Area Insets
**Change:** Updated footer padding in `src/App.tsx`.
**Code:** `pb-[calc(env(safe-area-inset-bottom)+0.5rem)]`
**Why:**
- `env(safe-area-inset-bottom)`: On iPhones (and some Androids), this returns the height of the home swipe indicator area (approx 34px). This lifts the keyboard up so it's not covered by the OS gesture bar.
- `+0.5rem`: Adds a small buffer (8px) so the keys aren't flush against the bottom edge or the stripe, maintaining a premium feel.
- If `safe-area-inset-bottom` is 0 (desktop/older phones), it falls back to just the 0.5rem padding.

## Result
- **Keyboard stays visible:** It will no longer slide behind the browser nav bar.
- **Keyboard stays grounded:** It won't float in the middle of the screen.
- **Native Feel:** It respects the device's physical safe zones (notch/home bar).
