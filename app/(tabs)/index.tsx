/**
 * Habyt — Main Pager
 * app/(tabs)/index.tsx
 *
 * Single screen pager: Home → Journal → Analytics → Calendar
 * - Live drag + slide animation between pages
 * - First-launch nudge hint
 * - 4 tappable dots navigation
 */
import {
  calcStreak,
  COLORS,
  FREQS,
  getTheme,
  Habit,
  HABIT_CATEGORIES,
  HabitFormData,
  HabitType,
  ICONS,
  isDayTime,
  JournalMap,
  loadHabits,
  loadJournal,
  MONTHS,
  MOODS,
  PROMPTS,
  QUOTES,
  REMINDERS,
  rgba,
  ringProgress,
  saveHabits,
  saveJournal,
  Theme,
  to12h,
  today,
  toDS,
  useHaptic,
  WDAYS,
} from "@/app/utils/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
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
import Svg, { Circle as SvgCircle } from "react-native-svg";

const { width: SW, height: SH } = Dimensions.get("window");
const PAGE_COUNT = 3; // Journal=0, Home=1, Calendar=2. Analytics=3 is button-only.
const NUDGE_KEY = "habyt-nudge-done";

// ─── ProgressRing ─────────────────────────────────────────────────────────────
function ProgressRing({
  size,
  progress,
  color,
  strokeWidth = 5,
  bg,
}: {
  size: number;
  progress: number;
  color: string;
  strokeWidth?: number;
  bg: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(progress, 0), 1);
  const cx = size / 2;
  return (
    <Svg
      width={size}
      height={size}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <SvgCircle
        cx={cx}
        cy={cx}
        r={r}
        stroke={bg}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <SvgCircle
        cx={cx}
        cy={cx}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${cx},${cx}`}
      />
    </Svg>
  );
}

// ─── HabitIcon ────────────────────────────────────────────────────────────────
function HabitIcon({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) {
  const isIconName =
    name &&
    name.length > 1 &&
    /^[a-z0-9-]+$/.test(name) &&
    name !== "habyt-logo";
  if (isIconName)
    return (
      <MaterialCommunityIcons name={name as any} size={size} color={color} />
    );
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size * 0.22,
          height: size * 0.72,
          borderRadius: size * 0.1,
          backgroundColor: "#FF8C00",
          transform: [{ rotate: "-18deg" }, { translateX: -size * 0.14 }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.15,
          height: size * 0.52,
          borderRadius: size * 0.08,
          backgroundColor: "#FFB340",
          transform: [
            { rotate: "-18deg" },
            { translateX: size * 0.16 },
            { translateY: size * 0.1 },
          ],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: size * 0.08,
          backgroundColor: "#FFD580",
          top: size * 0.1,
          right: size * 0.2,
        }}
      />
    </View>
  );
}

// ─── LogoMark ─────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
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
  );
}

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
function ThemeToggle({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  const haptic = useHaptic();
  return (
    <TouchableOpacity
      onPress={() => {
        haptic("light");
        onToggle();
      }}
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

// ─── ConfettiBlast ────────────────────────────────────────────────────────────
function ConfettiBlast({ onDone }: { onDone: () => void }) {
  const particles = useRef(
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: ((10 + Math.random() * 80) / 100) * SW,
      color: ["#FF5A5A", "#FFD60A", "#64D2FF", "#BF5AF2", "#30D158", "#FF9500"][
        i % 6
      ],
      size: 4 + Math.random() * 6,
      anim: new Animated.Value(0),
      round: Math.random() > 0.5,
      delay: Math.random() * 280,
    })),
  ).current;
  useEffect(() => {
    Animated.parallel(
      particles.map((p) =>
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 1300 + Math.random() * 300,
          delay: p.delay,
          useNativeDriver: true,
        }),
      ),
    ).start(onDone);
  }, []);
  return (
    <View
      style={
        {
          ...StyleSheet.absoluteFillObject,
          zIndex: 999,
          pointerEvents: "none",
        } as any
      }
    >
      {particles.map((p) => {
        const ty = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, SH + 40],
        });
        const ro = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "540deg"],
        });
        const op = p.anim.interpolate({
          inputRange: [0, 0.85, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: 0,
              width: p.size,
              height: p.size,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              transform: [{ translateY: ty }, { rotate: ro }],
              opacity: op,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── StreakCelebration ────────────────────────────────────────────────────────
function StreakCelebration({
  streak,
  onContinue,
}: {
  streak: number;
  onContinue: () => void;
}) {
  const haptic = useHaptic();
  const flameScale = useRef(new Animated.Value(0)).current;
  const flameBounce = useRef(new Animated.Value(0)).current;
  const numScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const btnTranslate = useRef(new Animated.Value(40)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const NOW = new Date();
  const weekDots = WDAYS.map((_, i) => {
    const diff = i - NOW.getDay();
    return {
      label: WDAYS[i].slice(0, 2),
      active: diff <= 0 && diff > -Math.min(streak, 7),
    };
  });
  useEffect(() => {
    haptic("heavy");
    Animated.spring(flameScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 160,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameBounce, {
          toValue: -10,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(flameBounce, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.sequence([
      Animated.delay(260),
      Animated.spring(numScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 11,
        stiffness: 150,
      }),
    ]).start();
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(btnTranslate, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
          stiffness: 200,
        }),
      ]),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.6],
  });
  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "#0A0F0B",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 36,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: flameScale }, { translateY: flameBounce }],
            marginBottom: 4,
            alignItems: "center",
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: "#FF6B00",
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            }}
          />
          <Text style={{ fontSize: 110, lineHeight: 130 }}>🔥</Text>
        </Animated.View>
        <Animated.Text
          style={{
            transform: [{ scale: numScale }],
            fontSize: 100,
            fontWeight: "800",
            letterSpacing: -4,
            color: "#FF6B00",
            lineHeight: 110,
            marginBottom: 2,
          }}
        >
          {streak}
        </Animated.Text>
        <Animated.Text
          style={{
            opacity: textOpacity,
            fontSize: 26,
            fontWeight: "600",
            color: "#FF8C3A",
            letterSpacing: -0.3,
            marginBottom: 36,
          }}
        >
          day streak
        </Animated.Text>
        <Animated.View
          style={{ opacity: dotsOpacity, width: "100%", marginBottom: 12 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            {weekDots.map((d, i) => (
              <Text
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: "600",
                  color: d.active ? "#FF8C3A" : "rgba(255,255,255,0.25)",
                }}
              >
                {d.label}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {weekDots.map((d, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: d.active
                    ? "#FF8C3A"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                {d.active && (
                  <Text style={{ fontSize: 14, color: "#fff" }}>✓</Text>
                )}
              </View>
            ))}
          </View>
          <Text
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              marginTop: 16,
              lineHeight: 20,
            }}
          >
            Can you keep a{" "}
            <Text style={{ color: "#FF8C3A", fontWeight: "700" }}>
              Perfect Streak
            </Text>{" "}
            for another week?
          </Text>
        </Animated.View>
        <Animated.View
          style={{
            width: "100%",
            marginTop: 8,
            opacity: btnOpacity,
            transform: [{ translateY: btnTranslate }],
          }}
        >
          <TouchableOpacity
            onPress={() => {
              haptic("medium");
              onContinue();
            }}
            style={{ borderRadius: 18, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#3DD8F5", "#26C5E0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 18, alignItems: "center" }}
            >
              <Text
                style={{
                  color: "#06141A",
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────
function BottomSheet({
  visible,
  onClose,
  t,
  saveBar,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  t: Theme;
  saveBar?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(SH)).current;
  const bgOpac = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const DISMISS_THRESH = 100;

  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 26,
          stiffness: 300,
        }),
        Animated.timing(bgOpac, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: SH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpac, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: SH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpac, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(onClose);
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [visible, dismiss]);

  const dismissRef = useRef(dismiss);
  useEffect(() => {
    dismissRef.current = dismiss;
  }, [dismiss]);

  const springBack = () =>
    Animated.spring(dragY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 340,
    }).start();

  const handlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        gs.dy > DISMISS_THRESH ? dismissRef.current() : springBack();
      },
      onPanResponderTerminate: () => springBack(),
    }),
  ).current;

  if (!visible) return null;
  return (
    <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 999 }}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: bgOpac,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={dismiss} />
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: t.sheet,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: SH * 0.92,
          paddingBottom: insets.bottom,
          transform: [{ translateY: Animated.add(slideY, dragY) }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.18,
          shadowRadius: 18,
          elevation: 24,
        }}
      >
        <View
          style={{ paddingTop: 10, paddingBottom: 16, alignItems: "center" }}
          {...handlePan.panHandlers}
        >
          <View
            style={{
              width: 36,
              height: 5,
              borderRadius: 3,
              backgroundColor: t.isDark
                ? "rgba(255,255,255,0.18)"
                : "rgba(0,0,0,0.13)",
            }}
          />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: saveBar ? 80 : 16 }}
        >
          {children}
        </ScrollView>
        {saveBar && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 12,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: t.border,
              backgroundColor: t.sheet,
            }}
          >
            {saveBar}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─── HabitModal ───────────────────────────────────────────────────────────────
function HabitModal({
  visible,
  onSave,
  onClose,
  onDelete,
  t,
  initial,
}: {
  visible: boolean;
  onSave: (d: HabitFormData) => void;
  onClose: () => void;
  onDelete?: () => void;
  t: Theme;
  initial?: Habit;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "habyt-logo");
  const [color, setColor] = useState(initial?.color ?? "#C4622D");
  const [freq, setFreq] = useState(initial?.freq ?? "daily");
  const [cdays, setCdays] = useState<number[]>(
    initial?.customDays ?? [1, 2, 3, 4, 5],
  );
  const [remind, setRemind] = useState<string | null>(
    initial?.reminder ?? null,
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [goalDays, setGoalDays] = useState(String(initial?.goalDays ?? ""));
  const [habitType, setHabitType] = useState<HabitType>(
    initial?.type ?? "boolean",
  );
  const [targetCount, setTargetCount] = useState(
    String(initial?.targetCount ?? 8),
  );
  const [delConf, setDelConf] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [showFreq, setShowFreq] = useState(false);
  const [showRemind, setShowRemind] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [selCat, setSelCat] = useState<string | null>(null);
  const [unit, setUnit] = useState("");
  const haptic = useHaptic();

  useEffect(() => {
    setName(initial?.name ?? "");
    setIcon(initial?.icon ?? "habyt-logo");
    setColor(initial?.color ?? "#C4622D");
    setFreq(initial?.freq ?? "daily");
    setCdays(initial?.customDays ?? [1, 2, 3, 4, 5]);
    setRemind(initial?.reminder ?? null);
    setNote(initial?.note ?? "");
    setGoalDays(String(initial?.goalDays ?? ""));
    setHabitType(initial?.type ?? "boolean");
    setTargetCount(String(initial?.targetCount ?? 8));
    setDelConf(false);
    setShowIcons(false);
    setShowFreq(false);
    setShowRemind(false);
    setNameError(false);
    setSelCat(null);
    setUnit("");
    setShowColor(false);
    setShowCustomize(false);
  }, [initial, visible]);

  const applySub = (sub: (typeof HABIT_CATEGORIES)[0]["subs"][0]) => {
    haptic("medium");
    setName(sub.name);
    setIcon(sub.icon);
    setColor(sub.color);
    setHabitType(sub.type);
    setGoalDays(String(sub.goalDays ?? ""));
    setTargetCount(String(sub.targetCount ?? 1));
    setUnit(sub.unit);
    setNameError(false);
  };
  const toggleCday = (d: number) =>
    setCdays((p) =>
      p.includes(d)
        ? p.filter((x) => x !== d)
        : [...p, d].sort((a, b) => a - b),
    );

  const saveBar = (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {isEdit && onDelete && (
        <TouchableOpacity
          onPress={() => {
            if (delConf) {
              haptic("heavy");
              onDelete();
            } else {
              haptic("medium");
              setDelConf(true);
            }
          }}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: delConf ? "#FF3B30" : rgba("#FF3B30", 0.09),
          }}
        >
          <Text
            style={{
              color: delConf ? "#fff" : "#FF3B30",
              fontSize: 13,
              fontWeight: "700",
            }}
          >
            {delConf ? "Tap again" : "Delete"}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => {
          if (!name.trim()) {
            haptic("medium");
            setNameError(true);
            return;
          }
          haptic("medium");
          onSave({
            name: name.trim(),
            icon,
            color,
            category: "personal",
            freq,
            customDays: cdays,
            reminder: remind,
            note,
            goalDays: goalDays ? parseInt(goalDays) : undefined,
            type: habitType,
            targetCount:
              habitType === "count" ? parseInt(targetCount) || 8 : undefined,
          });
        }}
        style={{ flex: 2, borderRadius: 12, overflow: "hidden" }}
      >
        <LinearGradient
          colors={[t.accent, t.accent]}
          style={{ padding: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
            {isEdit ? "Save Changes" : "Add Habit"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} t={t} saveBar={saveBar}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        {!isEdit && (
          <View style={{ marginBottom: 20 }}>
            {(() => {
              const CAT_SIZE = (SW - 40 - 16) / 3;
              const allCats = [
                ...HABIT_CATEGORIES,
                {
                  id: "custom",
                  label: "Custom",
                  icon: "pencil-plus",
                  color: t.accent,
                },
              ];
              return (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "space-between",
                    marginBottom: selCat ? 16 : 0,
                  }}
                >
                  {allCats.map((cat) => {
                    const active = selCat === cat.id;
                    const isCustom = cat.id === "custom";
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          haptic("medium");
                          active
                            ? (setSelCat(null),
                              setName(""),
                              setNameError(false))
                            : (setSelCat(cat.id), setName(""));
                        }}
                        activeOpacity={0.75}
                        style={{ width: CAT_SIZE, alignItems: "center" }}
                      >
                        <View
                          style={{
                            width: CAT_SIZE,
                            height: CAT_SIZE,
                            borderRadius: CAT_SIZE / 2,
                            borderWidth: active ? 3 : 1.5,
                            borderColor: active ? cat.color : t.border,
                            borderStyle:
                              isCustom && !active ? "dashed" : "solid",
                            backgroundColor: active
                              ? rgba(cat.color, 0.12)
                              : t.bg2,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 6,
                          }}
                        >
                          <MaterialCommunityIcons
                            name={cat.icon as any}
                            size={CAT_SIZE * 0.38}
                            color={active ? cat.color : t.text3}
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: active ? "700" : "500",
                            color: active ? cat.color : t.text3,
                            textAlign: "center",
                          }}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()}
            {selCat &&
              selCat !== "custom" &&
              (() => {
                const cat = HABIT_CATEGORIES.find((c) => c.id === selCat)!;
                return (
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{
                        color: t.text3,
                        fontSize: 10,
                        letterSpacing: 1.1,
                        textTransform: "uppercase",
                        fontWeight: "600",
                        marginBottom: 4,
                      }}
                    >
                      {cat.label} — pick one
                    </Text>
                    {cat.subs.map((sub) => {
                      const active = name === sub.name;
                      return (
                        <TouchableOpacity
                          key={sub.name}
                          onPress={() => {
                            haptic("medium");
                            active ? setName("") : applySub(sub);
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            padding: 12,
                            borderRadius: 14,
                            backgroundColor: active
                              ? rgba(sub.color, 0.1)
                              : t.bg2,
                            borderWidth: 1.5,
                            borderColor: active ? sub.color : t.border,
                          }}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: active
                                ? rgba(sub.color, 0.18)
                                : t.bg3,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MaterialCommunityIcons
                              name={sub.icon as any}
                              size={18}
                              color={active ? sub.color : t.text2}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: active ? sub.color : t.text,
                              }}
                            >
                              {sub.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: t.text3,
                                marginTop: 1,
                              }}
                            >
                              {sub.unit
                                ? `${sub.targetCount} ${sub.unit}/day · ${sub.goalDays} day goal`
                                : `${sub.goalDays} day goal`}
                            </Text>
                          </View>
                          <MaterialCommunityIcons
                            name={active ? "check-circle" : "chevron-right"}
                            size={active ? 20 : 16}
                            color={active ? sub.color : t.text3}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })()}
          </View>
        )}

        {(isEdit || selCat === "custom" || name) && (
          <View>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (v.trim()) setNameError(false);
              }}
              placeholder="Habit name…"
              maxLength={30}
              placeholderTextColor={t.text3}
              returnKeyType="done"
              blurOnSubmit
              style={{
                padding: 13,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: nameError ? "#FF3B30" : name ? t.accent : t.border,
                backgroundColor: t.bg2,
                color: t.text,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: nameError ? 4 : 20,
              }}
            />
            {nameError && (
              <Text
                style={{
                  color: "#FF3B30",
                  fontSize: 12,
                  marginBottom: 16,
                  marginLeft: 2,
                }}
              >
                Please enter a name
              </Text>
            )}

            <TouchableOpacity
              onPress={() => {
                haptic("light");
                setShowCustomize((v) => !v);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                marginBottom: 12,
              }}
            >
              <MaterialCommunityIcons
                name={showCustomize ? "chevron-up" : "tune-variant"}
                size={15}
                color={t.text3}
              />
              <Text style={{ color: t.text3, fontSize: 12, fontWeight: "600" }}>
                {showCustomize
                  ? "Less options"
                  : "Customize icon, color & more"}
              </Text>
            </TouchableOpacity>

            {showCustomize && (
              <View>
                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      haptic("light");
                      setShowIcons((v) => !v);
                      setShowColor(false);
                    }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      backgroundColor: rgba(color, 0.12),
                      borderWidth: 1.5,
                      borderColor: rgba(color, 0.3),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HabitIcon name={icon} size={28} color={color} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      haptic("light");
                      setShowColor((v) => !v);
                      setShowIcons(false);
                    }}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: t.bg2,
                      borderWidth: 1,
                      borderColor: t.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      {[
                        color,
                        ...COLORS.filter((c) => c !== color).slice(0, 3),
                      ].map((c, i) => (
                        <View
                          key={i}
                          style={{
                            width: i === 0 ? 20 : 14,
                            height: i === 0 ? 20 : 14,
                            borderRadius: i === 0 ? 10 : 7,
                            backgroundColor: c,
                            opacity: i === 0 ? 1 : 0.5,
                            borderWidth: i === 0 ? 2 : 0,
                            borderColor: t.bg,
                          }}
                        />
                      ))}
                    </View>
                    <MaterialCommunityIcons
                      name={showColor ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={t.text3}
                    />
                  </TouchableOpacity>
                </View>

                {showIcons && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {ICONS.map((ic) => (
                      <TouchableOpacity
                        key={ic}
                        onPress={() => {
                          haptic("light");
                          setIcon(ic);
                          setShowIcons(false);
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor:
                            ic === icon ? rgba(color, 0.15) : t.bg2,
                          borderWidth: ic === icon ? 2 : 1,
                          borderColor: ic === icon ? color : t.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <HabitIcon
                          name={ic}
                          size={22}
                          color={ic === icon ? color : t.text2}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {showColor && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 16,
                      paddingHorizontal: 4,
                    }}
                  >
                    {COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => {
                          haptic("light");
                          setColor(c);
                          setShowColor(false);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: c,
                          borderWidth: c === color ? 3 : 0,
                          borderColor: t.bg,
                          transform: [{ scale: c === color ? 1.15 : 1 }],
                        }}
                      />
                    ))}
                  </View>
                )}

                <View
                  style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}
                >
                  <View style={{ flex: 1 }}>
                    <SLabel s="Goal Days" t={t} />
                    <TextInput
                      value={goalDays}
                      onChangeText={(v) => setGoalDays(v.replace(/\D/g, ""))}
                      placeholder="30"
                      keyboardType="number-pad"
                      maxLength={3}
                      placeholderTextColor={t.text3}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: goalDays ? t.accent : t.border,
                        backgroundColor: t.bg2,
                        color: t.text,
                        fontSize: 20,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    />
                    <Text
                      style={{
                        color: goalDays ? t.accent : t.text3,
                        fontSize: 10,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      {goalDays
                        ? `${parseInt(goalDays)} day streak goal`
                        : "uses milestones"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <SLabel s={unit ? `Daily ${unit}` : "Daily Target"} t={t} />
                    <TextInput
                      value={targetCount}
                      onChangeText={(v) => setTargetCount(v.replace(/\D/g, ""))}
                      placeholder={habitType === "count" ? "8" : "1"}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholderTextColor={t.text3}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor:
                          habitType === "count" && targetCount
                            ? t.accent
                            : t.border,
                        backgroundColor: t.bg2,
                        color: habitType === "count" ? t.text : t.text3,
                        fontSize: 20,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    />
                    <Text
                      style={{
                        color: t.text3,
                        fontSize: 10,
                        textAlign: "center",
                        marginTop: 4,
                      }}
                    >
                      {habitType === "count" && targetCount && unit
                        ? `${targetCount} ${unit}/day`
                        : habitType === "count"
                          ? "set a daily target"
                          : "yes/no habit"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    haptic("light");
                    setShowFreq((v) => !v);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: t.bg2,
                    borderWidth: 1,
                    borderColor: t.border,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: t.text3,
                        fontSize: 10,
                        letterSpacing: 1.1,
                        textTransform: "uppercase",
                        fontWeight: "600",
                      }}
                    >
                      Frequency
                    </Text>
                    <Text
                      style={{
                        color: t.accent,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {FREQS.find((f) => f.id === freq)?.label}
                    </Text>
                  </View>
                  <Text style={{ color: t.text3, fontSize: 11 }}>
                    {showFreq ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {showFreq && (
                  <View
                    style={{
                      backgroundColor: t.bg2,
                      borderRadius: 12,
                      overflow: "hidden",
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: t.border,
                    }}
                  >
                    {FREQS.map((f, i) => (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => {
                          haptic("light");
                          setFreq(f.id);
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 13,
                          borderTopWidth: i > 0 ? 1 : 0,
                          borderTopColor: t.border,
                        }}
                      >
                        <Text
                          style={{
                            color: freq === f.id ? t.accent : t.text2,
                            fontSize: 13,
                            fontWeight: freq === f.id ? "700" : "400",
                          }}
                        >
                          {f.label}
                        </Text>
                        {freq === f.id && (
                          <Text style={{ color: t.accent, fontSize: 14 }}>
                            ✓
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {freq === "custom" && showFreq && (
                  <View
                    style={{ flexDirection: "row", gap: 5, marginBottom: 12 }}
                  >
                    {WDAYS.map((d, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          haptic("light");
                          toggleCday(i);
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 9,
                          backgroundColor: cdays.includes(i) ? t.accent : t.bg2,
                          borderWidth: 1,
                          borderColor: cdays.includes(i) ? t.accent : t.border,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: cdays.includes(i) ? "#fff" : t.text3,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {d[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => {
                    haptic("light");
                    setShowRemind((v) => !v);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: t.bg2,
                    borderWidth: 1,
                    borderColor: t.border,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: t.text3,
                        fontSize: 10,
                        letterSpacing: 1.1,
                        textTransform: "uppercase",
                        fontWeight: "600",
                      }}
                    >
                      Reminder
                    </Text>
                    <Text
                      style={{
                        color: remind ? t.accent : t.text3,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {remind ? to12h(remind) : "None"}
                    </Text>
                  </View>
                  <Text style={{ color: t.text3, fontSize: 11 }}>
                    {showRemind ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {showRemind && (
                  <View
                    style={{ flexDirection: "row", gap: 7, marginBottom: 12 }}
                  >
                    <TouchableOpacity
                      onPress={() => setRemind(null)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 11,
                        alignItems: "center",
                        backgroundColor: remind === null ? t.accent : t.bg2,
                        borderWidth: 1,
                        borderColor: remind === null ? t.accent : t.border,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="bell-off-outline"
                        size={20}
                        color={remind === null ? "#fff" : t.text2}
                      />
                      <Text
                        style={{
                          color: remind === null ? "#fff" : t.text2,
                          fontSize: 10,
                          fontWeight: "600",
                          marginTop: 4,
                        }}
                      >
                        None
                      </Text>
                    </TouchableOpacity>
                    {REMINDERS.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => setRemind(r.time)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 11,
                          alignItems: "center",
                          backgroundColor: remind === r.time ? t.accent : t.bg2,
                          borderWidth: 1,
                          borderColor: remind === r.time ? t.accent : t.border,
                        }}
                      >
                        <MaterialCommunityIcons
                          name={r.mIcon as any}
                          size={20}
                          color={remind === r.time ? "#fff" : t.text2}
                        />
                        <Text
                          style={{
                            color: remind === r.time ? "#fff" : t.text2,
                            fontSize: 10,
                            fontWeight: "600",
                            marginTop: 4,
                          }}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <SLabel s="Why it matters" t={t} />
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="A personal reason… (optional)"
                  maxLength={200}
                  placeholderTextColor={t.text3}
                  multiline
                  numberOfLines={2}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: t.border,
                    backgroundColor: t.bg2,
                    color: t.text,
                    fontSize: 13,
                    minHeight: 60,
                    textAlignVertical: "top",
                    marginBottom: 8,
                  }}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
function HomeScreen({
  t,
  isDark,
  onToggle,
  habits,
  journal,
  onToggleToday,
  onAdd,
  onEdit,
  onAnalytics,
  confetti,
  celebrate,
  onConfettiDone,
  onCelebrateDone,
}: {
  t: Theme;
  isDark: boolean;
  onToggle: () => void;
  habits: Habit[];
  journal: JournalMap;
  onToggleToday: (id: number) => void;
  onAdd: () => void;
  onEdit: (h: Habit) => void;
  onAnalytics: () => void;
  confetti: boolean;
  celebrate: number | null;
  onConfettiDone: () => void;
  onCelebrateDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const HPAD = 24,
    GAP_H = 20,
    LABEL_H = 20,
    QUOTE_H = 44,
    HEADER_H = 56,
    ROWS = 3,
    COLS = 2;
  const availW = SW - HPAD * 2 - GAP_H;
  const availH =
    SH - insets.top - insets.bottom - HEADER_H - QUOTE_H - LABEL_H * ROWS - 24;
  const CIRCLE = Math.floor(Math.min(availW / COLS, availH / ROWS));
  const SW_RING = Math.floor(CIRCLE * 0.04);
  const allItems = [...habits, { id: -1, _isAdd: true }];
  const quoteIdx = new Date().getDate() % QUOTES.length;
  const [quoteText] = QUOTES[quoteIdx];
  const isDone = (h: Habit) => h.completions.includes(today());
  const isFailed = (h: Habit) => (h.failures || []).includes(today());

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            height: 56,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LogoMark />
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={onAnalytics}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: t.bg2,
                borderWidth: 1,
                borderColor: t.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="chart-bar"
                size={17}
                color={t.text2}
              />
            </TouchableOpacity>
            <ThemeToggle isDark={isDark} onToggle={onToggle} />
          </View>
        </View>
        <View
          style={{
            height: QUOTE_H,
            paddingHorizontal: HPAD,
            justifyContent: "center",
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              fontSize: 11,
              fontStyle: "italic",
              color: t.text3,
              letterSpacing: 0.1,
              lineHeight: 16,
            }}
          >
            "{quoteText}"
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            paddingHorizontal: HPAD,
            paddingBottom: 16,
            flexDirection: "row",
            flexWrap: "wrap",
            alignContent: "space-between",
            justifyContent: "space-between",
          }}
        >
          {Array.from({ length: 6 }).map((_, idx) => {
            const item = allItems[idx];
            if (!item)
              return (
                <View key={idx} style={{ width: CIRCLE, alignItems: "center" }}>
                  <View
                    style={{
                      width: CIRCLE,
                      height: CIRCLE,
                      borderRadius: CIRCLE / 2,
                      backgroundColor: t.bg2,
                      opacity: 0.25,
                    }}
                  />
                  <View style={{ height: LABEL_H + 6 }} />
                </View>
              );
            if ((item as any)._isAdd)
              return (
                <TouchableOpacity
                  key="add"
                  onPress={() => {
                    haptic("medium");
                    onAdd();
                  }}
                  activeOpacity={0.75}
                  style={{ width: CIRCLE, alignItems: "center" }}
                >
                  <View
                    style={{
                      width: CIRCLE,
                      height: CIRCLE,
                      borderRadius: CIRCLE / 2,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: rgba(t.accent, 0.3),
                      backgroundColor: rgba(t.accent, 0.04),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={CIRCLE * 0.3}
                      color={rgba(t.accent, 0.45)}
                    />
                  </View>
                  <Text
                    style={{
                      height: LABEL_H,
                      lineHeight: LABEL_H,
                      fontSize: 12,
                      color: t.text3,
                      fontWeight: "500",
                      marginTop: 6,
                      textAlign: "center",
                    }}
                  >
                    New
                  </Text>
                </TouchableOpacity>
              );
            const h = item as Habit;
            const done = isDone(h),
              failed = isFailed(h);
            const streak = calcStreak(h.completions);
            const progress =
              h.type === "count"
                ? Math.min((h.counts?.[today()] || 0) / (h.targetCount || 8), 1)
                : done
                  ? ringProgress(h)
                  : 0;
            return (
              <TouchableOpacity
                key={h.id}
                onPress={() => onToggleToday(h.id)}
                onLongPress={() => {
                  haptic("medium");
                  onEdit(h);
                }}
                activeOpacity={0.75}
                style={{ width: CIRCLE, alignItems: "center" }}
              >
                <View
                  style={{
                    width: CIRCLE,
                    height: CIRCLE,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      width: CIRCLE - SW_RING * 2,
                      height: CIRCLE - SW_RING * 2,
                      borderRadius: (CIRCLE - SW_RING * 2) / 2,
                      backgroundColor: done
                        ? rgba(h.color, 0.1)
                        : failed
                          ? rgba("#FF3B30", 0.05)
                          : t.bg2,
                    }}
                  />
                  <ProgressRing
                    size={CIRCLE}
                    progress={done || h.type === "count" ? progress : 0}
                    color={
                      h.type === "count"
                        ? h.color
                        : done
                          ? h.color
                          : failed
                            ? "#FF3B30"
                            : rgba(h.color, 0.2)
                    }
                    strokeWidth={SW_RING}
                    bg={t.isDark ? rgba(t.text3, 0.06) : rgba(t.text3, 0.08)}
                  />
                  <HabitIcon
                    name={h.icon}
                    size={CIRCLE * 0.36}
                    color={done ? h.color : failed ? "#FF3B30" : t.text2}
                  />
                  {h.type === "count" ? (
                    <Text
                      style={{
                        fontSize: CIRCLE * 0.09,
                        fontWeight: "800",
                        letterSpacing: -0.3,
                        marginTop: 2,
                        color: done ? h.color : t.text3,
                      }}
                    >
                      {h.counts?.[today()] || 0}/{h.targetCount || 8}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        fontSize: CIRCLE * 0.09,
                        fontWeight: "800",
                        letterSpacing: -0.3,
                        marginTop: 2,
                        color: done ? h.color : failed ? "#FF3B30" : t.text3,
                      }}
                    >
                      {streak > 0 ? `${streak}d` : "—"}
                    </Text>
                  )}
                  {done && (
                    <View
                      style={{
                        position: "absolute",
                        top: SW_RING * 0.2,
                        right: SW_RING * 0.2,
                        width: CIRCLE * 0.22,
                        height: CIRCLE * 0.22,
                        borderRadius: CIRCLE * 0.11,
                        backgroundColor: h.color,
                        alignItems: "center",
                        justifyContent: "center",
                        elevation: 4,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={CIRCLE * 0.12}
                        color="#fff"
                      />
                    </View>
                  )}
                  {failed && (
                    <View
                      style={{
                        position: "absolute",
                        top: SW_RING * 0.2,
                        right: SW_RING * 0.2,
                        width: CIRCLE * 0.22,
                        height: CIRCLE * 0.22,
                        borderRadius: CIRCLE * 0.11,
                        backgroundColor: "#FF3B30",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={CIRCLE * 0.12}
                        color="#fff"
                      />
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    height: LABEL_H,
                    lineHeight: LABEL_H,
                    fontSize: 12,
                    fontWeight: "600",
                    textAlign: "center",
                    marginTop: 6,
                    paddingHorizontal: 4,
                    color: done ? h.color : failed ? "#FF3B30" : t.text2,
                  }}
                >
                  {h.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
      {confetti && <ConfettiBlast onDone={onConfettiDone} />}
      {celebrate != null && (
        <StreakCelebration streak={celebrate} onContinue={onCelebrateDone} />
      )}
    </View>
  );
}

// ─── JournalScreen ────────────────────────────────────────────────────────────
function JournalScreen({
  t,
  isDark,
  onToggle,
}: {
  t: Theme;
  isDark: boolean;
  onToggle: () => void;
}) {
  const [journal, setJournal] = useState<JournalMap>({});
  const [loaded, setLoaded] = useState(false);
  const haptic = useHaptic();
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
  const [selDate, setSelDate] = useState(today());
  const [mood, setMood] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState<string[]>(["", "", ""]);
  const [freewrite, setFreewrite] = useState("");
  const [saved, setSaved] = useState(false);
  const [delConf, setDelConf] = useState(false);
  const prompt = useRef(
    PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
  ).current;
  useEffect(() => {
    const e = journal[selDate];
    setMood(e?.mood ?? null);
    setGratitude([...(e?.gratitude ?? ["", "", ""])]);
    setFreewrite(e?.freewrite ?? "");
    setSaved(false);
    setDelConf(false);
  }, [selDate, journal]);
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
    journal[selDate] &&
    (journal[selDate].mood != null ||
      journal[selDate].gratitude?.some((g) => g.trim()) ||
      journal[selDate].freewrite?.trim())
  );
  const past = Object.keys(journal)
    .filter((d) => {
      const e = journal[d];
      return (
        e &&
        (e.mood != null ||
          e.gratitude?.some((g) => g.trim()) ||
          e.freewrite?.trim())
      );
    })
    .sort((a, b) => b.localeCompare(a));
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
              <LogoMark />
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
            <ThemeToggle isDark={isDark} onToggle={onToggle} />
          </View>
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
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => {
                if (hasCont) {
                  haptic("success");
                  const entry = { mood, gratitude, freewrite };
                  setJournal((p) => ({ ...p, [selDate]: entry }));
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
                    setJournal((p) => {
                      const n = { ...p };
                      delete n[selDate];
                      return n;
                    });
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
          {past.length > 0 && (
            <>
              <SLabel s="Past Entries" t={t} />
              <View style={{ gap: 5 }}>
                {past.slice(0, 8).map((d) => {
                  const e = journal[d];
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
                          <Text style={{ fontSize: 13 }}>
                            {MOODS[e.mood][0]}
                          </Text>
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── AnalyticsScreen ──────────────────────────────────────────────────────────
function AnalyticsScreen({
  t,
  isDark,
  onToggle,
  habits,
  journal,
  onBack,
}: {
  t: Theme;
  isDark: boolean;
  onToggle: () => void;
  habits: Habit[];
  journal: JournalMap;
  onBack?: () => void;
}) {
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const now = new Date();
    const sun = new Date(now);
    sun.setDate(now.getDate() - now.getDay());
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    const ds = toDS(d),
      total = habits.length,
      done = habits.filter((h) => h.completions.includes(ds)).length,
      e = journal[ds],
      isFuture = ds > today();
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
    tP = past.reduce((s, d) => s + d.total, 0),
    wPct = tP ? Math.round((tD / tP) * 100) : 0;
  const bc = (p: number, isFuture: boolean) =>
    isFuture
      ? t.bg3
      : p === 100
        ? t.green
        : p > 0
          ? "#FF9500"
          : rgba("#FF3B30", 0.35);
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
  const todayDs = today(),
    todayDone = habits.filter((h) => h.completions.includes(todayDs)).length;
  const todayPct = habits.length
    ? Math.round((todayDone / habits.length) * 100)
    : 0;
  const topHabit = habits.reduce<Habit | null>((best, h) => {
    const s = calcStreak(h.completions);
    return !best || s > calcStreak(best.completions) ? h : best;
  }, null);
  const topStreak = topHabit ? calcStreak(topHabit.completions) : 0;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
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
              {onBack && (
                <TouchableOpacity
                  onPress={onBack}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: t.bg2,
                    borderWidth: 1,
                    borderColor: t.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 4,
                  }}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={18}
                    color={t.text2}
                  />
                </TouchableOpacity>
              )}
              <LogoMark />
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
            <ThemeToggle isDark={isDark} onToggle={onToggle} />
          </View>
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
                  color:
                    wPct >= 80 ? t.green : wPct >= 50 ? "#FF9500" : "#FF5A5A",
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
                    <View
                      key={i}
                      style={{ flex: 1, alignItems: "center", gap: 3 }}
                    >
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
            </View>
          </View>
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
      </SafeAreaView>
    </View>
  );
}

// ─── CalendarScreen ───────────────────────────────────────────────────────────
const CELL = (SW - 32 - 5 * 6) / 7;
function CalendarScreen({
  t,
  isDark,
  onToggle,
  habits,
  onToggleDay,
}: {
  t: Theme;
  isDark: boolean;
  onToggle: () => void;
  habits: Habit[];
  onToggleDay: (id: number, ds: string) => void;
}) {
  const [yr, setYr] = useState(() => new Date().getFullYear());
  const [mo, setMo] = useState(() => new Date().getMonth());
  const [sel, setSel] = useState<number | null>(null);
  const [filt, setFilt] = useState<number | null>(null);
  const haptic = useHaptic();
  const todayStr = today();
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
  const sSt = (s: string) =>
    s === "done"
      ? {
          bg: rgba("#30D158", 0.12),
          color: "#30D158",
          bc: rgba("#30D158", 0.25),
        }
      : s === "partial"
        ? {
            bg: rgba("#FF9500", 0.09),
            color: "#FF9500",
            bc: rgba("#FF9500", 0.2),
          }
        : { bg: "transparent", color: t.text3, bc: "transparent" };
  const blanks = Array(new Date(yr, mo, 1).getDay()).fill(null);
  const daysInMon = new Date(yr, mo + 1, 0).getDate();
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
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
              <LogoMark />
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
            <ThemeToggle isDark={isDark} onToggle={onToggle} />
          </View>
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
                  <HabitIcon
                    name={h.icon}
                    size={12}
                    color={filt === h.id ? "#fff" : t.text2}
                  />
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
                <Text
                  style={{ color: t.text3, fontSize: 10, fontWeight: "500" }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>
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
                  st = sSt(s),
                  isT = toDS(new Date(yr, mo, day)) === todayStr,
                  isSel = sel === day;
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
                <Text
                  style={{ color: t.text, fontWeight: "600", fontSize: 13 }}
                >
                  {MONTHS[mo]} {sel}
                  {selDs === today() ? " · Today" : ""}
                </Text>
                <Text style={{ color: t.text3, fontSize: 11 }}>
                  {habits.filter((h) => h.completions.includes(selDs)).length}/
                  {habits.length} done
                </Text>
              </View>
              {habits.map((h) => {
                const done = h.completions.includes(selDs),
                  failed = (h.failures || []).includes(selDs),
                  label = done ? "✓" : failed ? "✗" : "—";
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
                    <HabitIcon
                      name={h.icon}
                      size={20}
                      color={done ? h.color : failed ? "#FF3B30" : t.text2}
                    />
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
                        style={{
                          color: badgeCol,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── PageDots ─────────────────────────────────────────────────────────────────
const PAGE_ICONS = [
  { name: "notebook-outline", page: 0 },
  { name: "home-variant", page: 1 },
  { name: "calendar-month", page: 2 },
];

function PageDots({
  page,
  onPress,
  t,
}: {
  page: number;
  onPress: (i: number) => void;
  t: Theme;
}) {
  const insets = useSafeAreaInsets();
  const displayPage = Math.min(page, 2);
  return (
    <View
      style={
        {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          alignItems: "center",
          pointerEvents: "box-none",
        } as any
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        {PAGE_ICONS.map(({ name, page: i }) => {
          const isActive = displayPage === i;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onPress(i)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name={name as any}
                size={isActive ? 24 : 20}
                color={isActive ? t.accent : rgba(t.text3, 0.55)}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const scheme = useColorScheme();
  const [isDark, setIsDark] = useState(scheme === "dark" || !isDayTime());
  const t = getTheme(isDark);
  const haptic = useHaptic();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [journal, setJournal] = useState<JournalMap>({});
  const [loaded, setLoaded] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editH, setEditH] = useState<Habit | null>(null);
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const translateX = useRef(new Animated.Value(-SW)).current;
  const [nudgeDone, setNudgeDone] = useState(true);

  useEffect(() => {
    Promise.all([
      loadHabits(),
      loadJournal(),
      AsyncStorage.getItem(NUDGE_KEY),
    ]).then(([h, j, nudge]) => {
      setHabits(h);
      setJournal(j);
      setLoaded(true);
      if (!nudge) setNudgeDone(false);
    });
  }, []);

  // First-launch nudge — peeks left then right to show pages exist
  useEffect(() => {
    if (nudgeDone || !loaded) return;
    const timer = setTimeout(() => {
      const base = -SW; // home page offset
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: base - 44,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: base + 44,
          useNativeDriver: true,
          damping: 14,
          stiffness: 180,
        }),
        Animated.spring(translateX, {
          toValue: base,
          useNativeDriver: true,
          damping: 14,
          stiffness: 180,
        }),
      ]).start(() => {
        AsyncStorage.setItem(NUDGE_KEY, "1");
        setNudgeDone(true);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [nudgeDone, loaded]);

  useFocusEffect(
    useCallback(() => {
      if (!loaded) return;
      Promise.all([loadHabits(), loadJournal()]).then(([h, j]) => {
        setHabits(h);
        setJournal(j);
      });
    }, [loaded]),
  );

  const goToPage = useCallback(
    (next: number, animated = true) => {
      // Pages 0-2 are in the swipe row. Page 3 (analytics) slides in separately.
      if (next < 0 || next > 3 || next === pageRef.current) return;
      if (animated) haptic("light");
      const targetX =
        next <= 2
          ? -next * SW
          : pageRef.current <= 2
            ? -pageRef.current * SW
            : undefined;
      if (next === 3) {
        // Analytics: slide in from right over current
        pageRef.current = 3;
        setPage(3);
        return;
      }
      if (next <= 2) {
        const target = -next * SW;
        Animated.spring(translateX, {
          toValue: target,
          useNativeDriver: true,
          damping: 22,
          stiffness: 260,
        }).start();
        pageRef.current = next;
        setPage(next);
      }
    },
    [haptic],
  );

  // Swipe pan — moves the whole strip live
  const swipePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.8,
      onPanResponderMove: (_, gs) => {
        if (pageRef.current === 3) return; // don't swipe on analytics
        const base = -pageRef.current * SW;
        // Resist past edges
        const raw = base + gs.dx;
        const min = -(PAGE_COUNT - 1) * SW;
        const max = 0;
        const bounded = Math.max(min, Math.min(max, raw));
        translateX.setValue(bounded);
      },
      onPanResponderRelease: (_, gs) => {
        if (pageRef.current === 3) return;
        const THRESH = SW * 0.22;
        if (gs.dx < -THRESH && pageRef.current < PAGE_COUNT - 1) {
          const next = pageRef.current + 1;
          haptic("light");
          Animated.spring(translateX, {
            toValue: -next * SW,
            useNativeDriver: true,
            damping: 22,
            stiffness: 260,
          }).start();
          pageRef.current = next;
          setPage(next);
        } else if (gs.dx > THRESH && pageRef.current > 0) {
          const next = pageRef.current - 1;
          haptic("light");
          Animated.spring(translateX, {
            toValue: -next * SW,
            useNativeDriver: true,
            damping: 22,
            stiffness: 260,
          }).start();
          pageRef.current = next;
          setPage(next);
        } else {
          Animated.spring(translateX, {
            toValue: -pageRef.current * SW,
            useNativeDriver: true,
            damping: 20,
            stiffness: 300,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: -pageRef.current * SW,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
        }).start();
      },
    }),
  ).current;

  const toggleToday = (id: number) => {
    const ds = today();
    let streakVal = 0;
    const next = habits.map((h) => {
      if (h.id !== id) return h;
      if (h.type === "count") {
        const counts = { ...(h.counts || {}) };
        const cur = (counts[ds] || 0) + 1;
        const target = h.targetCount || 8;
        counts[ds] = cur <= target ? cur : 0;
        const completed = counts[ds] >= target;
        const comps =
          completed && !h.completions.includes(ds)
            ? [...h.completions, ds]
            : !completed
              ? h.completions.filter((d) => d !== ds)
              : h.completions;
        const ns = calcStreak(comps);
        if (completed) {
          streakVal = ns;
          haptic("success");
        } else haptic("light");
        return {
          ...h,
          counts,
          completions: comps,
          longestStreak: Math.max(h.longestStreak || 0, ns),
        };
      }
      const isDone = h.completions.includes(ds),
        isFailed = (h.failures || []).includes(ds);
      if (!isDone && !isFailed) {
        const comps = [...h.completions, ds],
          ns = calcStreak(comps);
        streakVal = ns;
        haptic("success");
        return {
          ...h,
          completions: comps,
          longestStreak: Math.max(h.longestStreak || 0, ns),
        };
      } else if (isDone) {
        haptic("medium");
        return {
          ...h,
          completions: h.completions.filter((d) => d !== ds),
          failures: [...(h.failures || []), ds],
        };
      } else {
        haptic("light");
        return { ...h, failures: (h.failures || []).filter((d) => d !== ds) };
      }
    });
    setHabits(next);
    saveHabits(next);
    if (streakVal > 0) {
      setCelebrate(streakVal);
      setConfetti(true);
    }
  };

  const toggleCalendarDay = (hid: number, ds: string) => {
    const next = habits.map((h) => {
      if (h.id !== hid) return h;
      const isDone = h.completions.includes(ds),
        isFailed = (h.failures || []).includes(ds);
      if (!isDone && !isFailed) {
        const comps = [...h.completions, ds];
        return {
          ...h,
          completions: comps,
          longestStreak: Math.max(h.longestStreak || 0, calcStreak(comps)),
        };
      } else if (isDone)
        return {
          ...h,
          completions: h.completions.filter((d) => d !== ds),
          failures: [...(h.failures || []), ds],
        };
      else
        return { ...h, failures: (h.failures || []).filter((d) => d !== ds) };
    });
    setHabits(next);
    saveHabits(next);
  };

  const addHabit = (data: HabitFormData) => {
    const next = [
      ...habits,
      {
        id: Date.now(),
        ...data,
        completions: [],
        failures: [],
        longestStreak: 0,
        counts: {},
      },
    ];
    setHabits(next);
    saveHabits(next);
    setShowAdd(false);
  };
  const saveEdit = (data: HabitFormData) => {
    const next = habits.map((h) =>
      h.id === editH!.id ? { ...h, ...data } : h,
    );
    setHabits(next);
    saveHabits(next);
    setEditH(null);
  };
  const delHabit = () => {
    const next = habits.filter((h) => h.id !== editH!.id);
    setHabits(next);
    saveHabits(next);
    setEditH(null);
  };

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

  const toggle = () => setIsDark((d) => !d);

  return (
    <View
      style={{ flex: 1, backgroundColor: t.bg, overflow: "hidden" }}
      {...swipePan.panHandlers}
    >
      {/* 3-page strip: Journal | Home | Calendar */}
      <Animated.View
        style={{
          flex: 1,
          flexDirection: "row",
          width: SW * 3,
          transform: [{ translateX }],
        }}
      >
        <View style={{ width: SW, flex: 1 }}>
          <JournalScreen
            key="journal"
            t={t}
            isDark={isDark}
            onToggle={toggle}
          />
        </View>
        <View style={{ width: SW, flex: 1 }}>
          <HomeScreen
            key="home"
            t={t}
            isDark={isDark}
            onToggle={toggle}
            habits={habits}
            journal={journal}
            onToggleToday={toggleToday}
            onAdd={() => setShowAdd(true)}
            onEdit={setEditH}
            onAnalytics={() => goToPage(3)}
            confetti={confetti}
            celebrate={celebrate}
            onConfettiDone={() => setConfetti(false)}
            onCelebrateDone={() => setCelebrate(null)}
          />
        </View>
        <View style={{ width: SW, flex: 1 }}>
          <CalendarScreen
            key="calendar"
            t={t}
            isDark={isDark}
            onToggle={toggle}
            habits={habits}
            onToggleDay={toggleCalendarDay}
          />
        </View>
      </Animated.View>

      {/* Analytics: slides in from right as an overlay */}
      {page === 3 && (
        <View
          style={{ ...StyleSheet.absoluteFillObject, backgroundColor: t.bg }}
        >
          <AnalyticsScreen
            t={t}
            isDark={isDark}
            onToggle={toggle}
            habits={habits}
            journal={journal}
            onBack={() => {
              pageRef.current = 1;
              setPage(1);
            }}
          />
        </View>
      )}

      <PageDots page={page} onPress={goToPage} t={t} />
      <HabitModal
        visible={showAdd}
        onSave={addHabit}
        onClose={() => setShowAdd(false)}
        t={t}
      />
      <HabitModal
        visible={!!editH}
        onSave={saveEdit}
        onClose={() => setEditH(null)}
        onDelete={delHabit}
        t={t}
        initial={editH ?? undefined}
      />
    </View>
  );
}
