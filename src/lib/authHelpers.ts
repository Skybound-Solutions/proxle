/**
 * Enhanced Authentication Utilities
 * Provides robust sign-in with retry logic, fallbacks, and error handling
 */

import {
    type Auth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from 'firebase/auth';
import { getBestAuthMethod, isPrivateBrowsing, getBrowserDisplayName } from './browserDetection';

export type AuthMethod = 'popup' | 'redirect';
export type AuthState = 'idle' | 'detecting' | 'signing-in-popup' | 'signing-in-redirect' | 'processing' | 'error';

export interface EnhancedAuthError extends Error {
    code: string;
    userMessage: string;
    isRetryable: boolean;
}

/**
 * Gets a user-friendly error message for auth errors
 */
export function getAuthErrorMessage(error: any): string {
    const code = error?.code || '';

    switch (code) {
        case 'auth/popup-blocked':
            return 'Pop-up was blocked by your browser. Trying an alternative method...';
        case 'auth/popup-closed-by-user':
            return 'Sign-in was cancelled. Please try again when ready.';
        case 'auth/cancelled-popup-request':
            return 'Another sign-in is in progress. Please wait...';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection and try again.';
        case 'auth/internal-error':
            return 'An unexpected error occurred. Retrying...';
        case 'auth/unauthorized-domain':
            return 'This domain is not authorized. Please contact support.';
        case 'auth/operation-not-allowed':
            return 'Google sign-in is not enabled. Please contact support.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment and try again.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        default:
            if (code.includes('private-browsing') || code.includes('storage')) {
                return `${getBrowserDisplayName()} private browsing may be blocking sign-in. Try regular browsing mode.`;
            }
            return 'Sign-in failed. Please try again.';
    }
}

/**
 * Determines if an auth error is retryable
 */
export function isRetryableError(error: any): boolean {
    const code = error?.code || '';
    const retryableCodes = [
        'auth/network-request-failed',
        'auth/internal-error',
        'auth/timeout',
    ];
    return retryableCodes.includes(code);
}

/**
 * Determines if we should fallback to redirect for this error
 */
export function shouldFallbackToRedirect(error: any): boolean {
    const code = error?.code || '';
    const fallbackCodes = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
    ];
    return fallbackCodes.includes(code);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempts sign-in with popup, with retry logic
 */
async function signInWithPopupRetry(
    auth: Auth,
    provider: GoogleAuthProvider,
    maxAttempts: number = 2
): Promise<void> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await signInWithPopup(auth, provider);
            return; // Success!
        } catch (error: any) {
            lastError = error;
            console.warn(`Sign-in attempt ${attempt} failed:`, error);

            // Don't retry if user cancelled or popup was blocked
            if (!isRetryableError(error)) {
                throw error;
            }

            // Don't retry on last attempt
            if (attempt === maxAttempts) {
                throw error;
            }

            // Exponential backoff: 500ms, 1000ms, 2000ms...
            const delay = 500 * Math.pow(2, attempt - 1);
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Main authentication function with intelligent method selection and fallbacks
 */
export async function signInWithGoogle(
    auth: Auth,
    provider: GoogleAuthProvider,
    onStateChange?: (state: AuthState) => void
): Promise<void> {
    try {
        // Step 1: Detect best method
        onStateChange?.('detecting');
        const preferredMethod = await getBestAuthMethod();
        const isPrivate = await isPrivateBrowsing();

        // Step 2: Warn about private browsing
        if (isPrivate) {
            console.warn('Private browsing detected - using redirect method');
        }

        // Step 3: Try popup first (if preferred), with fallback to redirect
        if (preferredMethod === 'popup') {
            try {
                onStateChange?.('signing-in-popup');
                await signInWithPopupRetry(auth, provider, 2);
                return; // Success!
            } catch (error: any) {
                console.warn('Popup sign-in failed, falling back to redirect:', error);

                // If popup specifically failed and we should fallback, use redirect
                if (shouldFallbackToRedirect(error)) {
                    onStateChange?.('signing-in-redirect');
                    await signInWithRedirect(auth, provider);
                    return; // Redirect initiated (completion happens on page reload)
                }

                // Otherwise, throw the error
                throw error;
            }
        } else {
            // Use redirect directly
            onStateChange?.('signing-in-redirect');
            await signInWithRedirect(auth, provider);
            return; // Redirect initiated
        }
    } catch (error: any) {
        onStateChange?.('error');
        console.error('Sign-in error:', error);

        // Enhance error with user-friendly message
        const enhancedError: any = new Error(getAuthErrorMessage(error));
        enhancedError.code = error.code;
        enhancedError.originalError = error;
        enhancedError.isRetryable = isRetryableError(error);

        throw enhancedError;
    }
}

/**
 * Checks for redirect result on app load
 * Call this once when the app initializes
 */
export async function handleRedirectResult(
    auth: Auth,
    onStateChange?: (state: AuthState) => void
): Promise<boolean> {
    try {
        onStateChange?.('processing');
        const result = await getRedirectResult(auth);

        if (result) {
            // User successfully signed in via redirect
            console.log('Redirect sign-in successful:', result.user);
            return true;
        }

        return false; // No redirect result (normal app load)
    } catch (error: any) {
        console.error('Redirect result error:', error);
        onStateChange?.('error');
        throw error;
    } finally {
        onStateChange?.('idle');
    }
}

/**
 * Gets help text for users experiencing auth issues
 */
export async function getAuthHelpText(): Promise<string> {
    const isPrivate = await isPrivateBrowsing();
    const browserName = getBrowserDisplayName();

    if (isPrivate) {
        return `${browserName} is in private browsing mode, which blocks Google sign-in. Please:\n\n1. Close this private window\n2. Open Proxle in a regular (non-private) window\n3. Try signing in again`;
    }

    return `Having trouble signing in?\n\n1. Make sure pop-ups are allowed for this site\n2. Try disabling browser extensions temporarily\n3. Clear your browser cache and try again\n4. Try a different browser\n\nIf issues persist, contact support.`;
}
