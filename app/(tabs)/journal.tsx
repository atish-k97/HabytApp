/**
 * Habyt — Journal Tab
 * app/(tabs)/journal.tsx
 */
import {
  getTheme,
  isDayTime,
  JournalEntry,
  JournalMap,
  loadJournal,
  MOODS,
  PROMPTS,
  rgba,
  saveJournal,
  Theme,
  today,
  toDS,
  useHaptic,
} from "@/app/utils/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ─── SLabel ───────────────────────────────────────────────────────────────────
const SLabel = ({ s, t, mt = 0 }: { s: string; t: Theme; mt?: number }) => (
  <Text
    style={{
      color: t.text3,
      fontSize: 10,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      fontWeight: "600",
      marginTop: mt,
      marginBottom: 8,
    }}
  >
    {s}
  </Text>
);

// ─── JournalScreen ────────────────────────────────────────────────────────────
export default function JournalScreen() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isDark, setIsDark] = useState(scheme === "dark" || !isDayTime());
  const [journal, setJournal] = useState<JournalMap>({});
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const t = getTheme(isDark);

  // ⚠️ Must be BEFORE any early returns to avoid hooks order violation
  const swipeNav = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60) router.push("/(tabs)/analytics" as any);
        else if (gs.dx > 60) router.push("/" as any);
      },
    }),
  ).current;

  useEffect(() => {
    loadJournal().then((j) => {
      setJournal(j);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveJournal(journal);
  }, [journal, loaded]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const j = await loadJournal();
    setJournal(j);
    setRefreshing(false);
  }, []);

  const saveEntry = (date: string, entry: JournalEntry) =>
    setJournal((prev) => ({ ...prev, [date]: entry }));
  const deleteEntry = (date: string) =>
    setJournal((prev) => {
      const n = { ...prev };
      delete n[date];
      return n;
    });

  if (!loaded)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={t.accent} />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }} {...swipeNav.panHandlers}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={t.accent}
              colors={[t.accent]}
            />
          }
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 4,
              marginBottom: 20,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    width: 6,
                    height: 20,
                    borderRadius: 3,
                    backgroundColor: "#FF8C00",
                    transform: [{ rotate: "-18deg" }, { translateX: -4 }],
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    width: 4,
                    height: 14,
                    borderRadius: 2,
                    backgroundColor: "#FFB340",
                    transform: [
                      { rotate: "-18deg" },
                      { translateX: 6 },
                      { translateY: 3 },
                    ],
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: "#FFD580",
                    top: 3,
                    right: 5,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  letterSpacing: -0.8,
                  color: t.text,
                }}
              >
                habyt
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsDark((d) => !d)}
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.08)",
                justifyContent: "center",
                alignItems: isDark ? "flex-end" : "flex-start",
                paddingHorizontal: 3,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: t.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name={isDark ? "moon-waning-crescent" : "white-balance-sunny"}
                  size={12}
                  color="#fff"
                />
              </View>
            </TouchableOpacity>
          </View>

          <JournalView
            entries={journal}
            onSave={saveEntry}
            onDelete={deleteEntry}
            t={t}
          />

          <Text
            style={{
              color: t.text3,
              fontSize: 10,
              textAlign: "center",
              marginTop: 24,
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            © habyt
          </Text>
        </ScrollView>

        {/* Dots only — no nav bar */}
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 8,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {["home", "journal", "analytics", "calendar"].map((s, i) => (
            <View
              key={s}
              style={{
                width: i === 1 ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === 1 ? t.accent : rgba(t.text3, 0.3),
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── JournalView ──────────────────────────────────────────────────────────────
function JournalView({
  entries,
  onSave,
  onDelete,
  t,
}: {
  entries: JournalMap;
  onSave: (d: string, e: JournalEntry) => void;
  onDelete: (d: string) => void;
  t: Theme;
}) {
  const [selDate, setSelDate] = useState(today());
  const raw = entries[selDate];
  const [mood, setMood] = useState<number | null>(raw?.mood ?? null);
  const [gratitude, setGratitude] = useState<string[]>(
    raw?.gratitude ?? ["", "", ""],
  );
  const [freewrite, setFreewrite] = useState(raw?.freewrite ?? "");
  const [saved, setSaved] = useState(false);
  const [delConf, setDelConf] = useState(false);
  const prompt = useRef(
    PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
  ).current;
  const haptic = useHaptic();

  useEffect(() => {
    const e = entries[selDate];
    setMood(e?.mood ?? null);
    setGratitude([...(e?.gratitude ?? ["", "", ""])]);
    setFreewrite(e?.freewrite ?? "");
    setSaved(false);
    setDelConf(false);
  }, [selDate, entries]);

  const chDate = (d: number) => {
    const dt = new Date(selDate);
    dt.setDate(dt.getDate() + d);
    if (toDS(dt) <= today()) setSelDate(toDS(dt));
  };

  const hasCont =
    mood !== null ||
    gratitude.some((g) => g.trim()) ||
    freewrite.trim().length > 0;
  const hasSaved = !!(
    entries[selDate] &&
    (entries[selDate].mood != null ||
      entries[selDate].gratitude?.some((g) => g.trim()) ||
      entries[selDate].freewrite?.trim())
  );
  const past = Object.keys(entries)
    .filter((d) => {
      const e = entries[d];
      return (
        e &&
        (e.mood != null ||
          e.gratitude?.some((g) => g.trim()) ||
          e.freewrite?.trim())
      );
    })
    .sort((a, b) => b.localeCompare(a));

  return (
    <View>
      {/* Date navigator */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => chDate(-1)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: t.bg2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: t.text2, fontSize: 17 }}>‹</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: t.text,
            fontWeight: "600",
            fontSize: 14,
            letterSpacing: -0.2,
          }}
        >
          {selDate === today()
            ? "Today"
            : new Date(selDate + "T12:00:00").toLocaleDateString("en", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
        </Text>
        <TouchableOpacity
          onPress={() => chDate(1)}
          disabled={selDate === today()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: t.bg2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: selDate === today() ? t.text3 : t.text2,
              fontSize: 17,
            }}
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mood */}
      <SLabel s="Mood" t={t} />
      <View style={{ flexDirection: "row", gap: 5, marginBottom: 20 }}>
        {MOODS.map(([e, l], i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              haptic("light");
              setMood(i);
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 11,
              alignItems: "center",
              gap: 3,
              borderWidth: 1.5,
              borderColor: mood === i ? t.text2 : t.border,
              backgroundColor: mood === i ? t.bg3 : t.bg2,
            }}
          >
            <Text style={{ fontSize: 17 }}>{e}</Text>
            <Text
              style={{
                color: mood === i ? t.text : t.text3,
                fontSize: 8,
                fontWeight: mood === i ? "600" : "400",
              }}
            >
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Gratitude */}
      <SLabel s="Grateful for" t={t} />
      {gratitude.map((g, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              color: t.text3,
              fontSize: 11,
              width: 13,
              textAlign: "center",
            }}
          >
            {i + 1}
          </Text>
          <TextInput
            value={g}
            onChangeText={(txt) => {
              const n = [...gratitude];
              n[i] = txt;
              setGratitude(n);
            }}
            placeholder="I'm grateful for…"
            maxLength={120}
            placeholderTextColor={t.text3}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.bg3,
              color: t.text,
              fontSize: 13,
            }}
          />
        </View>
      ))}

      {/* Reflection */}
      <SLabel s="Reflection" t={t} mt={13} />
      <Text
        style={{
          color: t.text3,
          fontSize: 11,
          marginBottom: 7,
          fontStyle: "italic",
          lineHeight: 16,
        }}
      >
        "{prompt}"
      </Text>
      <TextInput
        value={freewrite}
        onChangeText={setFreewrite}
        placeholder="Write freely…"
        maxLength={1000}
        multiline
        numberOfLines={4}
        placeholderTextColor={t.text3}
        style={{
          padding: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.bg3,
          color: t.text,
          fontSize: 13,
          minHeight: 84,
          textAlignVertical: "top",
          lineHeight: 19,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginBottom: 18,
          marginTop: 3,
        }}
      >
        <Text style={{ color: t.text3, fontSize: 9 }}>
          {freewrite.length}/1000
        </Text>
      </View>

      {/* Save / Delete */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => {
            if (hasCont) {
              haptic("success");
              onSave(selDate, { mood, gratitude, freewrite });
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }
          }}
          disabled={!hasCont}
          style={{ flex: 3, borderRadius: 12, overflow: "hidden" }}
        >
          <LinearGradient
            colors={
              saved
                ? [t.green, t.green]
                : hasCont
                  ? [t.accent, t.accent]
                  : [t.bg3, t.bg3]
            }
            style={{ padding: 13, alignItems: "center" }}
          >
            <Text
              style={{
                color: hasCont ? "#fff" : t.text3,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {saved ? "Saved ✓" : "Save Entry"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {hasSaved && (
          <TouchableOpacity
            onPress={() => {
              if (delConf) {
                haptic("heavy");
                onDelete(selDate);
                setDelConf(false);
              } else {
                haptic("medium");
                setDelConf(true);
                setTimeout(() => setDelConf(false), 3000);
              }
            }}
            style={{
              flex: 1,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: delConf ? "#FF3B30" : rgba("#FF3B30", 0.09),
            }}
          >
            <Text
              style={{
                color: delConf ? "#fff" : "#FF3B30",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {delConf ? "Sure?" : "🗑️"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Past entries */}
      {past.length > 0 && (
        <>
          <SLabel s="Past Entries" t={t} />
          <View style={{ gap: 5 }}>
            {past.slice(0, 8).map((d) => {
              const e = entries[d];
              const prev =
                e.gratitude?.find((g) => g.trim()) || e.freewrite || "";
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setSelDate(d)}
                  style={{
                    backgroundColor: selDate === d ? t.bg3 : t.bg2,
                    borderRadius: 11,
                    padding: 11,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: prev ? 2 : 0,
                    }}
                  >
                    <Text style={{ color: t.text2, fontSize: 11 }}>
                      {new Date(d + "T12:00:00").toLocaleDateString("en", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                    {e.mood != null && (
                      <Text style={{ fontSize: 13 }}>{MOODS[e.mood][0]}</Text>
                    )}
                  </View>
                  {!!prev && (
                    <Text
                      style={{ color: t.text3, fontSize: 11 }}
                      numberOfLines={1}
                    >
                      {prev.slice(0, 50)}
                      {prev.length > 50 ? "…" : ""}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
