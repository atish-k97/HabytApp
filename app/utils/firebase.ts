import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  getAuth,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { Habit } from "./shared";

const firebaseConfig = {
  apiKey: "AIzaSyCEB8oDOSUZyHuFT2gDeh9wLFmKeCEd1fg",
  authDomain: "habyt-68e80.firebaseapp.com",
  projectId: "habyt-68e80",
  storageBucket: "habyt-68e80.firebasestorage.app",
  messagingSenderId: "459432026776",
  appId: "1:459432026776:android:d53c5aba962c187c36e6ed",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signOut = () => fbSignOut(auth);

export const getCurrentUser = (): User | null => auth.currentUser;

export const onAuthStateChanged = (callback: (user: User | null) => void) =>
  fbOnAuthStateChanged(auth, callback);

// ─── Firestore ────────────────────────────────────────────────────────────────

const habitsCol = (uid: string) => collection(doc(db, "users", uid), "habits");

export const syncHabitsToFirestore = async (uid: string, habits: Habit[]) => {
  try {
    const batch = writeBatch(db);
    const col = habitsCol(uid);
    for (const habit of habits) {
      batch.set(doc(col, String(habit.id)), habit);
    }
    await batch.commit();
  } catch (e) {
    console.warn("[Firebase] sync failed:", e);
  }
};

export const loadHabitsFromFirestore = async (
  uid: string,
): Promise<Habit[]> => {
  try {
    const snap = await getDocs(habitsCol(uid));
    return snap.docs.map((d) => d.data() as Habit);
  } catch (e) {
    console.warn("[Firebase] load failed:", e);
    return [];
  }
};

export const saveHabitToFirestore = async (uid: string, habit: Habit) => {
  try {
    await setDoc(doc(habitsCol(uid), String(habit.id)), habit);
  } catch (e) {
    console.warn("[Firebase] save failed:", e);
  }
};

export const deleteHabitFromFirestore = async (
  uid: string,
  habitId: string,
) => {
  try {
    await deleteDoc(doc(habitsCol(uid), habitId));
  } catch (e) {
    console.warn("[Firebase] delete failed:", e);
  }
};
