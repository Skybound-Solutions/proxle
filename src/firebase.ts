import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Initialize Firebase (Project ID doesn't matter for local emulator)
// Initialize Firebase
const firebaseConfig = {
    projectId: "proxle-game",
    appId: "1:890224174750:web:827fd57e4f9bb7653ebd8f",
    storageBucket: "proxle-game.firebasestorage.app",
    apiKey: "AIzaSyD7ZCFZg3BCSmZifP8dnDdECADYOTDR-eU",
    authDomain: "proxle-game.firebaseapp.com",
    messagingSenderId: "890224174750",
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app, 'us-central1');

// Connect to the local emulator in dev mode
if (import.meta.env.DEV) {
    // Use LAN IP so it works on other devices on the network
    const emulatorHost = "10.0.1.195";
    console.log(`Connecting to Functions Emulator on ${emulatorHost}:5001`);
    connectFunctionsEmulator(functions, emulatorHost, 5001);
}
