import {
  signIn,
  signOut,
  signUp,
  syncHabitsToFirestore,
} from "@/app/utils/firebase";
import { getTheme, loadHabits } from "@/app/utils/shared";
import { useAuth } from "@/app/utils/useAuth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === "dark");
  const s = styles(theme);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        const cred = await signUp(email.trim(), password);
        // Migrate local habits to Firestore on first signup
        const localHabits = await loadHabits();
        if (localHabits.length > 0) {
          await syncHabitsToFirestore(cred.user.uid, localHabits);
        }
      } else {
        await signIn(email.trim(), password);
      }
    } catch (e: any) {
      setError(friendlyError(e.code));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  if (user) {
    return (
      <View style={s.container}>
        <View style={s.card}>
          <Text style={s.title}>Account</Text>
          <Text style={s.email}>{user.email}</Text>
          <Text style={s.syncNote}>✓ Habits syncing to cloud</Text>
          <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Logged out ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.card}>
        <Text style={s.title}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Text>
        <Text style={s.subtitle}>
          {mode === "signin"
            ? "Sign in to back up your habits to the cloud."
            : "Your existing habits will be saved to the cloud."}
        </Text>

        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor={theme.text3}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={theme.text3}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity
          style={s.primaryBtn}
          onPress={handleAuth}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryBtnText}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.toggleBtn}
          onPress={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
        >
          <Text style={s.toggleText}>
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function friendlyError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "No internet connection.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
      justifyContent: "center",
      padding: 24,
    },
    center: {
      flex: 1,
      backgroundColor: theme.bg,
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      backgroundColor: theme.bg2,
      borderRadius: 20,
      padding: 28,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textMuted,
      marginBottom: 24,
      lineHeight: 20,
    },
    email: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 8,
    },
    syncNote: {
      fontSize: 13,
      color: "#4CAF50",
      marginBottom: 24,
    },
    input: {
      backgroundColor: theme.bg3,
      color: theme.text,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      marginBottom: 12,
    },
    error: {
      color: "#FF6B6B",
      fontSize: 13,
      marginBottom: 12,
    },
    primaryBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 4,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    toggleBtn: {
      marginTop: 16,
      alignItems: "center",
    },
    toggleText: {
      color: theme.accent,
      fontSize: 14,
    },
    signOutBtn: {
      borderWidth: 1,
      borderColor: "#FF6B6B",
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: "center",
    },
    signOutText: {
      color: "#FF6B6B",
      fontSize: 15,
      fontWeight: "600",
    },
  });
