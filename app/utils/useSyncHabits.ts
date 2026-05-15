import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { useEffect, useRef } from "react";
import { syncHabitsToFirestore } from "./firebase";
import { Habit } from "./shared";

/**
 * Call this in your Today screen (or wherever habits state lives).
 * Whenever habits change AND a user is logged in, syncs to Firestore.
 * Skips the initial mount to avoid unnecessary writes on app open.
 */
export const useSyncHabits = (
  habits: Habit[],
  user: FirebaseAuthTypes.User | null,
) => {
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (user && habits.length >= 0) {
      syncHabitsToFirestore(user.uid, habits);
    }
  }, [habits, user]);
};
