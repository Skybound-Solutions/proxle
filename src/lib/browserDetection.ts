/**
 * Browser and Environment Detection Utilities
 * Used to optimize authentication flow based on browser capabilities
 */

export interface BrowserInfo {
    isSafari: boolean;
    isChrome: boolean;
    isFirefox: boolean;
    isEdge: boolean;
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    version: string;
}

/**
 * Detects the current browser and platform
 */
export function detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent;

    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChrome = /chrome|chromium|crios/i.test(ua) && !/edg/i.test(ua);
    const isFirefox = /firefox|fxios/i.test(ua);
    const isEdge = /edg/i.test(ua);
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    // Extract version (simplified)
    let version = 'unknown';
    const versionMatch = ua.match(/(firefox|chrome|safari|edg)[\s/](\d+)/i);
    if (versionMatch) {
        version = versionMatch[2];
    }

    return {
        isSafari,
        isChrome,
        isFirefox,
        isEdge,
        isMobile,
        isIOS,
        isAndroid,
        version,
    };
}

/**
 * Detects if the browser is in private/incognito mode
 * Returns a promise that resolves to true if private browsing is detected
 */
export async function isPrivateBrowsing(): Promise<boolean> {
    return new Promise((resolve) => {
        const browserInfo = detectBrowser();

        // Safari detection
        if (browserInfo.isSafari) {
            // Safari in private mode has limited IndexedDB support
            try {
                // Type-safe check for window.openDatabase (legacy Safari feature)
                const win = window as any;
                if (win.openDatabase) {
                    win.openDatabase(null, null, null, null);
                }
                resolve(false);
            } catch {
                resolve(true);
            }
            return;
        }

        // Firefox detection
        if (browserInfo.isFirefox) {
            const db = indexedDB.open('test');
            db.onerror = () => {
                resolve(true);
            };
            db.onsuccess = () => {
                resolve(false);
            };
            return;
        }

        // Chrome/Edge detection (check storage quota)
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(({ quota }) => {
                // Private mode typically has quota < 120MB
                resolve((quota || 0) < 120000000);
            }).catch(() => {
                resolve(false);
            });
            return;
        }

        // Fallback: assume not private if we can't detect
        resolve(false);
    });
}

/**
 * Determines the best authentication method for the current browser/environment
 * Returns 'redirect' or 'popup'
 */
export async function getBestAuthMethod(): Promise<'redirect' | 'popup'> {
    const browserInfo = detectBrowser();
    const isPrivate = await isPrivateBrowsing();

    // Always use redirect for private browsing
    if (isPrivate) {
        return 'redirect';
    }

    // Always use redirect for mobile Safari
    if (browserInfo.isSafari && browserInfo.isMobile) {
        return 'redirect';
    }

    // Use redirect for iOS (all browsers)
    if (browserInfo.isIOS) {
        return 'redirect';
    }

    // Use redirect for mobile devices in general (more reliable)
    if (browserInfo.isMobile) {
        return 'redirect';
    }

    // Desktop Safari: prefer redirect due to popup blocking issues
    if (browserInfo.isSafari) {
        return 'redirect';
    }

    // Desktop Chrome/Firefox/Edge: popup is fine
    return 'popup';
}

/**
 * Checks if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

/**
 * Gets a user-friendly browser name for display
 */
export function getBrowserDisplayName(): string {
    const browserInfo = detectBrowser();

    if (browserInfo.isSafari) return 'Safari';
    if (browserInfo.isChrome) return 'Chrome';
    if (browserInfo.isFirefox) return 'Firefox';
    if (browserInfo.isEdge) return 'Edge';

    return 'your browser';
}
