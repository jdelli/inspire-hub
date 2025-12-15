import { db } from "../../../../script/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Helper to get global billing settings
export async function getBillingSettings() {
    try {
        const settingsRef = doc(db, 'settings', 'billing');
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
            return settingsSnap.data();
        } else {
            // Default settings
            const defaultSettings = {
                vatEnabled: false,
                vatRate: 0.12
            };
            await setDoc(settingsRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error fetching billing settings:', error);
        return { vatEnabled: false, vatRate: 0.12 }; // Default fallback
    }
}

// Helper to update global billing settings
export async function updateBillingSettings(settings) {
    try {
        const settingsRef = doc(db, 'settings', 'billing');
        await setDoc(settingsRef, settings, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating billing settings:', error);
        throw error;
    }
}
