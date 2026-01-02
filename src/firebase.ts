import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
    projectId: "proxle-game",
    appId: "1:890224174750:web:827fd57e4f9bb7653ebd8f",
    storageBucket: "proxle-game.firebasestorage.app",
    apiKey: "AIzaSyD7ZCFZg3BCSmZifP8dnDdECADYOTDR-eU",
    authDomain: "proxle.app",  // Custom domain for better Safari compatibility
    messagingSenderId: "890224174750",
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app, 'us-central1');
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const trackEvent = (name: string, params?: any) => {
    if (analytics) {
        logEvent(analytics, name, params);
    }
};

// Use Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Force account selection to help with cached account issues and improve reliability
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Connect to emulators in dev
if (import.meta.env.DEV) {
    // Using the IP address as configured in earlier steps
    const emulatorHost = "10.0.1.195";
    console.log(`Connecting to Emulators on ${emulatorHost}`);

    connectFunctionsEmulator(functions, emulatorHost, 5001);
    // connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
    // connectFirestoreEmulator(db, emulatorHost, 8080);
}
