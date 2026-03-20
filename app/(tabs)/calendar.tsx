/**
 * Habyt — Calendar Tab
 * app/(tabs)/calendar.tsx
 */
import {
  calcStreak,
  getTheme,
  Habit,
  isDayTime,
  loadHabits,
  MONTHS,
  rgba,
  saveHabits,
  Theme,
  today,
  toDS,
  useHaptic,
} from "@/app/utils/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

const { width: SW } = Dimensions.get("window");
const CELL = (SW - 32 - 5 * 6) / 7;

export default function CalendarScreen() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptic = useHaptic();
  const [isDark, setIsDark] = useState(scheme === "dark" || !isDayTime());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const t = getTheme(isDark);

  // ⚠️ Must be BEFORE any early returns
  const swipeNav = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 2,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60) router.push("/" as any);
        else if (gs.dx > 60) router.push("/(tabs)/analytics" as any);
      },
    }),
  ).current;

  useEffect(() => {
    loadHabits().then((h) => {
      setHabits(h);
      setLoaded(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits().then((h) => {
        setHabits(h);
        setLoaded(true);
      });
    }, []),
  );

  useEffect(() => {
    if (!loaded) return;
    saveHabits(habits);
  }, [habits, loaded]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const h = await loadHabits();
    setHabits(h);
    setRefreshing(false);
  }, []);

  const toggleDay = (hid: number, ds: string) =>
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== hid) return h;
        const isDone = h.completions.includes(ds);
        const isFailed = (h.failures || []).includes(ds);
        if (!isDone && !isFailed) {
          const comps = [...h.completions, ds];
          return {
            ...h,
            completions: comps,
            longestStreak: Math.max(h.longestStreak || 0, calcStreak(comps)),
          };
        } else if (isDone) {
          return {
            ...h,
            completions: h.completions.filter((d) => d !== ds),
            failures: [...(h.failures || []), ds],
          };
        } else {
          return { ...h, failures: (h.failures || []).filter((d) => d !== ds) };
        }
      }),
    );

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
            <TouchableOpacity
              onPress={() => setIsDark((d) => !d)}
              style={{
                width: 46,
                height: 26,
                borderRadius: 13,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.07)",
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
          </View>

          <CalendarView habits={habits} onToggleDay={toggleDay} t={t} />

          <Text
            style={{
              color: t.text3,
              fontSize: 10,
              textAlign: "center",
              marginTop: 16,
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
                width: i === 3 ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === 3 ? t.accent : rgba(t.text3, 0.3),
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── CalendarView ─────────────────────────────────────────────────────────────
function CalendarView({
  habits,
  onToggleDay,
  t,
}: {
  habits: Habit[];
  onToggleDay: (id: number, ds: string) => void;
  t: Theme;
}) {
  const [yr, setYr] = useState(() => new Date().getFullYear());
  const [mo, setMo] = useState(() => new Date().getMonth());
  const [sel, setSel] = useState<number | null>(null);
  const [filt, setFilt] = useState<number | null>(null);
  const haptic = useHaptic();
  const todayStr = today();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMon = new Date(yr, mo + 1, 0).getDate();
  const activH = filt != null ? habits.find((h) => h.id === filt) : undefined;

  const prevMo = () => {
    mo === 0 ? (setMo(11), setYr((y) => y - 1)) : setMo((m) => m - 1);
    setSel(null);
  };
  const nextMo = () => {
    mo === 11 ? (setMo(0), setYr((y) => y + 1)) : setMo((m) => m + 1);
    setSel(null);
  };

  const status = (day: number) => {
    const ds = toDS(new Date(yr, mo, day));
    if (ds > todayStr) return "future";
    if (activH) return activH.completions.includes(ds) ? "done" : "missed";
    if (!habits.length) return "none";
    const n = habits.filter((h) => h.completions.includes(ds)).length;
    return n === habits.length ? "done" : n > 0 ? "partial" : "missed";
  };

  const sSt = (s: string) => {
    if (s === "done")
      return {
        bg: rgba("#30D158", 0.12),
        color: "#30D158",
        bc: rgba("#30D158", 0.25),
      };
    if (s === "partial")
      return {
        bg: rgba("#FF9500", 0.09),
        color: "#FF9500",
        bc: rgba("#FF9500", 0.2),
      };
    return { bg: "transparent", color: t.text3, bc: "transparent" };
  };

  const blanks = Array(firstDay).fill(null);
  const allCells = [
    ...blanks,
    ...Array.from({ length: daysInMon }, (_, i) => i + 1),
  ];
  const rows: (number | null)[][] = [];
  for (let i = 0; i < allCells.length; i += 7)
    rows.push(
      [
        ...allCells.slice(i, i + 7),
        ...Array(7 - Math.min(7, allCells.length - i)).fill(null),
      ].slice(0, 7),
    );

  const selDs = sel != null ? toDS(new Date(yr, mo, sel)) : null;

  return (
    <View>
      {/* Month nav */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 13,
        }}
      >
        <TouchableOpacity
          onPress={prevMo}
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
          {MONTHS[mo]} {yr}
        </Text>
        <TouchableOpacity
          onPress={nextMo}
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: t.bg2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: t.text2, fontSize: 17 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Habit filter pills */}
      {habits.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 11 }}
          contentContainerStyle={{ gap: 5 }}
        >
          <TouchableOpacity
            onPress={() => setFilt(null)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: filt === null ? t.text : t.bg2,
            }}
          >
            <Text
              style={{
                color: filt === null ? t.bg : t.text2,
                fontSize: 11,
                fontWeight: filt === null ? "600" : "400",
              }}
            >
              All
            </Text>
          </TouchableOpacity>
          {habits.map((h) => (
            <TouchableOpacity
              key={h.id}
              onPress={() => setFilt(filt === h.id ? null : h.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: filt === h.id ? h.color : t.bg2,
              }}
            >
              <Text style={{ fontSize: 11 }}>{h.icon}</Text>
              <Text
                style={{
                  color: filt === h.id ? "#fff" : t.text2,
                  fontSize: 11,
                  fontWeight: filt === h.id ? "600" : "400",
                }}
              >
                {h.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Day headers */}
      <View style={{ flexDirection: "row", marginBottom: 5 }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
          <View
            key={i}
            style={{
              width: CELL,
              marginRight: i < 6 ? 6 : 0,
              alignItems: "center",
            }}
          >
            <Text style={{ color: t.text3, fontSize: 10, fontWeight: "500" }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", marginBottom: 5 }}>
          {row.map((day, ci) => {
            if (day === null)
              return (
                <View
                  key={ci}
                  style={{
                    width: CELL,
                    height: CELL,
                    marginRight: ci < 6 ? 6 : 0,
                  }}
                />
              );
            const s = status(day),
              st = sSt(s);
            const isT = toDS(new Date(yr, mo, day)) === todayStr;
            const isSel = sel === day;
            const ds = toDS(new Date(yr, mo, day));
            const doneBits =
              !activH && habits.length > 0 && ds <= todayStr
                ? habits.filter((h) => h.completions.includes(ds))
                : [];
            return (
              <TouchableOpacity
                key={ci}
                disabled={s === "future"}
                onPress={() => {
                  haptic("light");
                  setSel(isSel ? null : day);
                }}
                style={{
                  width: CELL,
                  height: CELL,
                  marginRight: ci < 6 ? 6 : 0,
                  borderRadius: 9,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSel ? t.bg3 : st.bg,
                  borderWidth: 1.5,
                  borderColor: isT ? t.accent : isSel ? t.text2 : st.bc,
                }}
              >
                <Text
                  style={{
                    color: isT ? t.accent : st.color,
                    fontWeight: isT || isSel ? "700" : "500",
                    fontSize: 12,
                  }}
                >
                  {day}
                </Text>
                {doneBits.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 1.5,
                      position: "absolute",
                      bottom: 3,
                    }}
                  >
                    {doneBits.slice(0, 3).map((h) => (
                      <View
                        key={h.id}
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: h.color,
                        }}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      {!activH && habits.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8, marginBottom: 2 }}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
        >
          {habits.map((h) => (
            <View
              key={h.id}
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: h.color,
                }}
              />
              <Text style={{ color: t.text2, fontSize: 11 }}>{h.name}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Day detail */}
      {sel != null && selDs && (
        <View
          style={{
            marginTop: 10,
            backgroundColor: t.bg2,
            borderRadius: 14,
            padding: 13,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 11,
            }}
          >
            <Text style={{ color: t.text, fontWeight: "600", fontSize: 13 }}>
              {MONTHS[mo]} {sel}
              {selDs === today() ? " · Today" : ""}
            </Text>
            <Text style={{ color: t.text3, fontSize: 11 }}>
              {habits.filter((h) => h.completions.includes(selDs)).length}/
              {habits.length} done
            </Text>
          </View>
          {habits.map((h) => {
            const done = h.completions.includes(selDs);
            const failed = (h.failures || []).includes(selDs);
            const label = done ? "✓" : failed ? "✗" : "—";
            const bg = done
              ? rgba(h.color, 0.09)
              : failed
                ? rgba("#FF3B30", 0.06)
                : t.bg3;
            const badgeBg = done
              ? h.color
              : failed
                ? rgba("#FF3B30", 0.15)
                : t.bg2;
            const badgeCol = done ? "#fff" : failed ? "#FF3B30" : t.text3;
            return (
              <TouchableOpacity
                key={h.id}
                onPress={() => {
                  haptic("light");
                  onToggleDay(h.id, selDs);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 9,
                  marginBottom: 6,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: bg,
                }}
              >
                <Text style={{ fontSize: 17 }}>{h.icon}</Text>
                <Text
                  style={{
                    flex: 1,
                    color: t.text,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  {h.name}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 20,
                    backgroundColor: badgeBg,
                  }}
                >
                  <Text
                    style={{ color: badgeCol, fontSize: 11, fontWeight: "700" }}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
