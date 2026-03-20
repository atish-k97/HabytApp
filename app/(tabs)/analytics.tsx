/**
 * app/(tabs)/analytics.tsx — Analytics Screen
 */
import {
  calcStreak,
  getTheme,
  Habit,
  isDayTime,
  JournalMap,
  loadHabits,
  loadJournal,
  QUOTES,
  rgba,
  Theme,
  today,
  toDS,
  useHaptic,
  WDAYS,
} from "@/app/utils/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
function ThemeToggle({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
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
          backgroundColor: "#C4622D",
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
  );
}

// ─── ActivityFlow ─────────────────────────────────────────────────────────────
function ActivityFlow({
  habits,
  journal,
  t,
}: {
  habits: Habit[];
  journal: JournalMap;
  t: Theme;
}) {
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const ds = toDS(d),
      total = habits.length;
    const done = habits.filter((h) => h.completions.includes(ds)).length;
    const e = journal[ds];
    const isFuture = ds > today();
    return {
      ds,
      day: WDAYS[d.getDay()].slice(0, 2),
      done,
      total,
      pct: total && !isFuture ? Math.round((done / total) * 100) : 0,
      hasJ: !!(
        e?.mood != null ||
        e?.gratitude?.some((g: string) => g.trim()) ||
        e?.freewrite?.trim()
      ),
      isToday: ds === today(),
      isFuture,
    };
  });
  const past = weekDays.filter((d) => !d.isFuture);
  const tD = past.reduce((s, d) => s + d.done, 0),
    tP = past.reduce((s, d) => s + d.total, 0);
  const wPct = tP ? Math.round((tD / tP) * 100) : 0;
  const bc = (p: number, isFuture: boolean) =>
    isFuture
      ? t.bg3
      : p === 100
        ? t.green
        : p > 0
          ? "#FF9500"
          : rgba("#FF3B30", 0.35);

  return (
    <View style={{ marginBottom: 18 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 10,
        }}
      >
        <View>
          <Text
            style={{
              color: t.text,
              fontWeight: "700",
              fontSize: 15,
              letterSpacing: -0.3,
            }}
          >
            This Week
          </Text>
          <Text style={{ color: t.text3, fontSize: 10, marginTop: 1 }}>
            {tD}/{tP} completed
          </Text>
        </View>
        <Text
          style={{
            fontWeight: "800",
            fontSize: 24,
            letterSpacing: -1.5,
            color: wPct >= 80 ? t.green : wPct >= 50 ? "#FF9500" : "#FF5A5A",
          }}
        >
          {wPct}%
        </Text>
      </View>
      <View
        style={{
          backgroundColor: t.bg2,
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: t.border,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            height: 64,
            alignItems: "flex-end",
          }}
        >
          {weekDays.map((d, i) => {
            const bh =
              d.total && !d.isFuture
                ? Math.max(3, Math.round((d.pct / 100) * 50))
                : 3;
            return (
              <View key={i} style={{ flex: 1, alignItems: "center", gap: 3 }}>
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: d.hasJ ? "#BF5AF2" : "transparent",
                  }}
                />
                <View
                  style={{
                    width: "100%",
                    borderRadius: 4,
                    backgroundColor: t.bg3,
                    height: 50,
                    justifyContent: "flex-end",
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                      height: bh,
                      backgroundColor: bc(d.pct, d.isFuture),
                      borderRadius: 4,
                    }}
                  />
                </View>
                <Text
                  style={{
                    color: d.isToday ? t.accent : t.text3,
                    fontSize: 9,
                    fontWeight: d.isToday ? "700" : "400",
                  }}
                >
                  {d.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(() => {
          const todayDs = today();
          const todayDone = habits.filter((h) =>
            h.completions.includes(todayDs),
          ).length;
          const todayPct = habits.length
            ? Math.round((todayDone / habits.length) * 100)
            : 0;
          const topHabit = habits.reduce<Habit | null>((best, h) => {
            const s = calcStreak(h.completions);
            return !best || s > calcStreak(best.completions) ? h : best;
          }, null);
          const topStreak = topHabit ? calcStreak(topHabit.completions) : 0;
          return (
            <>
              <View
                style={{
                  flex: 1,
                  backgroundColor: t.bg2,
                  borderRadius: 13,
                  padding: 11,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <Text style={{ fontSize: 15 }}>✅</Text>
                <Text
                  style={{
                    color: todayPct === 100 ? t.green : t.text,
                    fontWeight: "700",
                    fontSize: 19,
                    marginTop: 3,
                    letterSpacing: -0.8,
                  }}
                >
                  {todayPct}%
                </Text>
                <Text style={{ color: t.text3, fontSize: 10, marginTop: 1 }}>
                  Done today · {todayDone}/{habits.length}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: t.bg2,
                  borderRadius: 13,
                  padding: 11,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <Text style={{ fontSize: 15 }}>🔥</Text>
                <Text
                  style={{
                    color: t.text,
                    fontWeight: "700",
                    fontSize: 19,
                    marginTop: 3,
                    letterSpacing: -0.8,
                  }}
                >
                  {topStreak}d
                </Text>
                <Text
                  style={{ color: t.text3, fontSize: 10, marginTop: 1 }}
                  numberOfLines={1}
                >
                  Best · {topHabit?.name ?? "—"}
                </Text>
              </View>
            </>
          );
        })()}
      </View>
    </View>
  );
}

// ─── Analytics Screen ─────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const scheme = useColorScheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journal, setJournal] = useState<JournalMap>({});
  const [loaded, setLoaded] = useState(false);
  const [isDark, setIsDark] = useState(scheme === "dark" || !isDayTime());
  const [refreshing, setRefreshing] = useState(false);
  const t = getTheme(isDark);
  const haptic = useHaptic();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ⚠️ Must be BEFORE any early returns
  const swipeNav = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60) router.push("/(tabs)/calendar" as any);
        else if (gs.dx > 60) router.push("/(tabs)/journal" as any);
      },
    }),
  ).current;

  useEffect(() => {
    Promise.all([loadHabits(), loadJournal()]).then(([h, j]) => {
      setHabits(h);
      setJournal(j);
      setLoaded(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadHabits(), loadJournal()]).then(([h, j]) => {
        setHabits(h);
        setJournal(j);
        setLoaded(true);
      });
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const [h, j] = await Promise.all([loadHabits(), loadJournal()]);
    setHabits(h);
    setJournal(j);
    setRefreshing(false);
  }, []);

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

  const habitStats = habits
    .map((h) => ({
      h,
      streak: calcStreak(h.completions),
      longest: h.longestStreak || 0,
      total: h.completions.length,
      rate:
        h.completions.length > 0
          ? Math.round(
              (h.completions.length /
                Math.max(
                  1,
                  Math.ceil(
                    (Date.now() -
                      Math.min(
                        ...h.completions.map((d) => new Date(d).getTime()),
                      )) /
                      86400000,
                  ) + 1,
                )) *
                100,
            )
          : 0,
    }))
    .sort((a, b) => b.streak - a.streak);

  const quote = (() => {
    const idx = new Date().getDate() * 7 + new Date().getMonth() * 31;
    const named = QUOTES.filter(
      ([, a]) => a !== "Unknown" && a !== "Anonymous",
    );
    return named[idx % named.length];
  })();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }} {...swipeNav.panHandlers}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
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
              paddingTop: 12,
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
            <ThemeToggle
              isDark={isDark}
              onToggle={() => setIsDark((d) => !d)}
            />
          </View>

          <ActivityFlow habits={habits} journal={journal} t={t} />

          <Text
            style={{
              color: t.text3,
              fontSize: 11,
              fontStyle: "italic",
              marginBottom: 20,
              textAlign: "center",
              paddingHorizontal: 16,
            }}
          >
            "{quote[0]}"
            <Text style={{ fontStyle: "normal", fontWeight: "600" }}>
              {" "}
              · {quote[1]}
            </Text>
          </Text>

          {habitStats.length > 0 && (
            <>
              <Text
                style={{
                  color: t.text3,
                  fontSize: 10,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  fontWeight: "600",
                  marginBottom: 10,
                }}
              >
                Habit Breakdown
              </Text>
              {habitStats.map(({ h, streak, longest, total, rate }) => {
                const isIconName =
                  h.icon && h.icon.length > 1 && /^[a-z0-9-]+$/.test(h.icon);
                return (
                  <View
                    key={h.id}
                    style={{
                      backgroundColor: t.bg2,
                      borderRadius: 13,
                      padding: 13,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: t.border,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: rgba(h.color, 0.12),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={(isIconName ? h.icon : "star") as any}
                        size={22}
                        color={h.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: t.text,
                          fontWeight: "600",
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        {h.name}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <Text style={{ color: t.text3, fontSize: 10 }}>
                          🔥 {streak}d streak
                        </Text>
                        <Text style={{ color: t.text3, fontSize: 10 }}>
                          🏆 {longest}d best
                        </Text>
                        <Text style={{ color: t.text3, fontSize: 10 }}>
                          ✓ {total} total
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        color:
                          rate >= 80
                            ? t.green
                            : rate >= 50
                              ? "#FF9500"
                              : "#FF5A5A",
                        fontWeight: "800",
                        fontSize: 16,
                      }}
                    >
                      {rate}%
                    </Text>
                  </View>
                );
              })}
            </>
          )}

          {habits.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 44 }}>
              <MaterialCommunityIcons
                name="chart-bar"
                size={44}
                color={t.text3}
                style={{ marginBottom: 12 }}
              />
              <Text style={{ fontSize: 14, fontWeight: "600", color: t.text2 }}>
                No data yet
              </Text>
              <Text style={{ fontSize: 11, color: t.text3, marginTop: 4 }}>
                Add habits to see your analytics
              </Text>
            </View>
          )}
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
                width: i === 2 ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === 2 ? t.accent : rgba(t.text3, 0.3),
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}
