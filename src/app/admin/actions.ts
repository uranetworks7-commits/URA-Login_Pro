'use server';

import { initializeApp, getApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove } from 'firebase/database';

const firebaseConfig = {
  authDomain: "ura-backup-new1.firebaseapp.com",
  databaseURL: "https://ura-backup-new1-default-rtdb.firebaseio.com",
  projectId: "ura-backup-new1",
  storageBucket: "ura-backup-new1.appspot.com",
  messagingSenderId: "699722460315",
  appId: "1:699722460315:web:f5da0f3ca3a36134d2ea3e"
};

let app: FirebaseApp;
try {
  app = getApp('server-admin');
} catch (e) {
  app = initializeApp(firebaseConfig, 'server-admin');
}

const db = getDatabase(app);

export async function getAllUsers(): Promise<any[]> {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
        const usersData = snapshot.val();
        return Object.keys(usersData).map(key => ({
            username: key,
            ...usersData[key]
        }));
    }
    return [];
}

export async function updateUserStatus(username: string, status: number): Promise<{ success: boolean; message: string }> {
    const userRef = ref(db, `users/${username.toLowerCase()}`);
    try {
        await update(userRef, { status });
        // Clear ban details if unbanned/reactivated
        if (status === 2) {
             await update(userRef, { 
                banReason: null, 
                banDuration: null, 
                bannedAt: null, 
                unbanAt: null,
                reactivationRequest: null,
                reactivationReason: null,
                reactivationEligibleAt: null
            });
        }
        return { success: true, message: `User status updated to ${status}` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function applyCustomBan(username: string, durationHours: number, reason: string): Promise<{ success: boolean; message: string }> {
    const userRef = ref(db, `users/${username.toLowerCase()}`);
    try {
        const bannedAt = new Date().toISOString();
        const unbanAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).getTime();
        await update(userRef, { 
            status: 5, // Custom temp ban
            banReason: reason,
            banDuration: `${durationHours} Hour(s)`,
            bannedAt: bannedAt,
            unbanAt: unbanAt
        });
        return { success: true, message: `User ${username} has been banned for ${durationHours} hours.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateLastLogin(username: string, newDate: string): Promise<{ success: boolean; message: string }> {
    const userRef = ref(db, `users/${username.toLowerCase()}`);
    try {
        if (!newDate || isNaN(new Date(newDate).getTime())) {
            return { success: false, message: 'Invalid date format provided.' };
        }
        await update(userRef, { 
            lastLoginAt: new Date(newDate).toISOString()
        });
        return { success: true, message: `User ${username}'s last login has been updated.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
