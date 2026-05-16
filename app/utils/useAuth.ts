import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnon } from "./firebase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      } else {
        signInAnon().catch(console.warn);
      }
    });
    return unsub;
  }, []);

  return { user, loading };
};
