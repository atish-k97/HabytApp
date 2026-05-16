import { User } from "firebase/auth";
import { useEffect, useRef } from "react";
import { syncHabitsToFirestore } from "./firebase";
import { Habit } from "./shared";

export const useSyncHabits = (habits: Habit[], user: User | null) => {
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
