# Rebranding Summary: Phrasle → Proxle

## Date: December 29, 2025

This document summarizes all changes made during the rebranding from "Phrasle" to "Proxle".

## Files Modified

### 1. Core Application Files

#### `/index.html`
- Updated page title from "Phrasle" to "Proxle"

#### `/package.json`
- Changed package name from "phrasle" to "proxle"

#### `/src/App.tsx`
- Updated share text: `Proxle ${guesses.length}/${guesses.length}`
- Updated share metadata title: `'Proxle'`
- Updated share URL text: `Play Proxle: ${window.location.href}`
- Updated game description: `<strong>Proxle</strong> is a hybrid word-guessing game...`

#### `/src/components/AdSpace.tsx`
- Updated Ko-fi support text: "Keep Proxle free!"

### 2. Backend Files

#### `/functions/src/index.ts`
- Updated AI prompt: `You are evaluating a word guessing game called Proxle.`

### 3. Configuration Files

#### `/.firebaserc`
- Updated Firebase project name from "phrasle-dev" to "proxle-dev"

### 4. Documentation Files

#### `/README.md`
- Completely rewritten with Proxle branding
- Added comprehensive setup and usage instructions
- Updated all references to the new name

#### `/docs/MONETIZATION.md`
- Updated title: "Monetization Strategy for Proxle"

#### `/docs/GENKIT_SETUP.md`
- Updated title: "Proxle AI Setup (Genkit + Gemini)"
- Updated description text to reference Proxle

#### `/docs/game_design.md`
- Updated title: "Proxle: Game Design Document"
- Updated executive summary to reference Proxle
- Updated unique challenge description to reference Proxle

#### `/docs/RUN_AI.md`
- Updated title: "Proxle AI: How to Run"

## Files NOT Modified

The following files were intentionally left unchanged:

- `/docs/context.md` - Contains Wordle research, not project-specific
- Debug logs and compiled files (`.log`, `.js` files in `/functions/lib/`)
- `node_modules/` and other generated files

## Next Steps

To complete the rebranding, you may want to:

1. **Update Firebase Project**: Create a new Firebase project named "proxle-dev" or rename the existing one
2. **Update Domain/Hosting**: If you have a custom domain, consider updating it
3. **Update Social Media**: Update any social media references or links
4. **Update Analytics**: Update any analytics tracking codes with the new name
5. **Rebuild**: Run `npm run build` to ensure all changes are reflected in the production build

## Verification

The rebranding is complete in the codebase. All user-facing text, documentation, and configuration files now reference "Proxle" instead of "Phrasle".
