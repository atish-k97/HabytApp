// shared.ts — all types, constants, helpers, theme
// Import this in every page: import { ... } from '@/app/utils/shared';

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type HabitType = "boolean" | "count";
export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  category: string;
  freq: string;
  customDays: number[];
  reminder: string | null;
  note: string;
  completions: string[];
  failures: string[];
  longestStreak: number;
  goalDays?: number;
  type?: HabitType;
  targetCount?: number;
  counts?: Record<string, number>;
}
export interface HabitFormData {
  name: string;
  icon: string;
  color: string;
  category: string;
  freq: string;
  customDays: number[];
  reminder: string | null;
  note: string;
  goalDays?: number;
  type?: HabitType;
  targetCount?: number;
}
export interface JournalEntry {
  mood: number | null;
  gratitude: string[];
  freewrite: string;
}
export type JournalMap = Record<string, JournalEntry>;
export interface Theme {
  bg: string;
  bg2: string;
  bg3: string;
  text: string;
  text2: string;
  text3: string;
  border: string;
  accent: string;
  green: string;
  sheet: string;
  isDark: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const ICONS = [
  "run",
  "book-open-variant",
  "water",
  "meditation",
  "pencil",
  "palette",
  "music",
  "food-apple",
  "weight-lifter",
  "leaf",
  "sleep",
  "broom",
  "note-text",
  "target",
  "weather-sunset",
  "bike",
  "guitar-acoustic",
  "dumbbell",
  "flask",
  "earth",
  "heart-pulse",
  "brain",
  "yoga",
  "walk",
  "moon-waning-crescent",
  "phone-off",
  "currency-usd",
  "alarm",
  "chef-hat",
  "flower",
];
export const COLORS = [
  "#FF5A5A",
  "#FF9500",
  "#FFD60A",
  "#30D158",
  "#64D2FF",
  "#0A84FF",
  "#BF5AF2",
  "#FF375F",
  "#C4622D",
  "#636366",
];
export const MILESTONES = [1, 3, 7, 14, 21, 30, 60, 100];
export const HABIT_CATEGORIES = [
  {
    id: "health",
    label: "Health",
    icon: "heart-pulse",
    color: "#FF5A5A",
    subs: [
      {
        name: "Drink Water",
        icon: "water",
        color: "#64D2FF",
        type: "count" as HabitType,
        unit: "glasses",
        targetCount: 8,
        goalDays: 30,
      },
      {
        name: "Steps",
        icon: "walk",
        color: "#30D158",
        type: "count" as HabitType,
        unit: "steps",
        targetCount: 10000,
        goalDays: 30,
      },
      {
        name: "Sleep",
        icon: "sleep",
        color: "#0A84FF",
        type: "count" as HabitType,
        unit: "hours",
        targetCount: 8,
        goalDays: 21,
      },
      {
        name: "Medication",
        icon: "pill",
        color: "#FF9500",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 30,
      },
      {
        name: "Vegetables",
        icon: "food-apple",
        color: "#30D158",
        type: "count" as HabitType,
        unit: "servings",
        targetCount: 5,
        goalDays: 21,
      },
    ],
  },
  {
    id: "mind",
    label: "Mind",
    icon: "brain",
    color: "#BF5AF2",
    subs: [
      {
        name: "Read",
        icon: "book-open-variant",
        color: "#BF5AF2",
        type: "count" as HabitType,
        unit: "mins",
        targetCount: 30,
        goalDays: 21,
      },
      {
        name: "Meditate",
        icon: "meditation",
        color: "#FF9500",
        type: "count" as HabitType,
        unit: "mins",
        targetCount: 10,
        goalDays: 21,
      },
      {
        name: "Journal",
        icon: "pencil",
        color: "#C4622D",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 30,
      },
      {
        name: "Deep Work",
        icon: "target",
        color: "#FF5A5A",
        type: "count" as HabitType,
        unit: "hours",
        targetCount: 2,
        goalDays: 21,
      },
      {
        name: "Study",
        icon: "school",
        color: "#64D2FF",
        type: "count" as HabitType,
        unit: "mins",
        targetCount: 60,
        goalDays: 30,
      },
    ],
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: "weight-lifter",
    color: "#FF9500",
    subs: [
      {
        name: "Workout",
        icon: "dumbbell",
        color: "#FF5A5A",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 30,
      },
      {
        name: "Running",
        icon: "run",
        color: "#FF9500",
        type: "count" as HabitType,
        unit: "km",
        targetCount: 5,
        goalDays: 21,
      },
      {
        name: "Cycling",
        icon: "bike",
        color: "#30D158",
        type: "count" as HabitType,
        unit: "km",
        targetCount: 10,
        goalDays: 21,
      },
      {
        name: "Stretching",
        icon: "yoga",
        color: "#BF5AF2",
        type: "count" as HabitType,
        unit: "mins",
        targetCount: 10,
        goalDays: 14,
      },
      {
        name: "Walk",
        icon: "walk",
        color: "#64D2FF",
        type: "count" as HabitType,
        unit: "mins",
        targetCount: 30,
        goalDays: 21,
      },
    ],
  },
  {
    id: "wellness",
    label: "Wellness",
    icon: "leaf",
    color: "#30D158",
    subs: [
      {
        name: "Gratitude",
        icon: "heart",
        color: "#FF375F",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 21,
      },
      {
        name: "No Phone",
        icon: "phone-off",
        color: "#636366",
        type: "count" as HabitType,
        unit: "hours",
        targetCount: 2,
        goalDays: 21,
      },
      {
        name: "Wake Early",
        icon: "weather-sunset-up",
        color: "#FF9500",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 14,
      },
      {
        name: "Tidy Up",
        icon: "broom",
        color: "#AC8E68",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 21,
      },
      {
        name: "Budget",
        icon: "currency-usd",
        color: "#30D158",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 30,
      },
    ],
  },
  {
    id: "sober",
    label: "Sober",
    icon: "leaf-circle",
    color: "#7DC9A0",
    subs: [
      {
        name: "No Alcohol",
        icon: "glass-cocktail-off",
        color: "#7DC9A0",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 30,
      },
      {
        name: "No Smoking",
        icon: "smoking-off",
        color: "#636366",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 30,
      },
      {
        name: "No Sugar",
        icon: "candy-off",
        color: "#FF9500",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 21,
      },
      {
        name: "No Caffeine",
        icon: "coffee-off",
        color: "#AC8E68",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 14,
      },
      {
        name: "No Gambling",
        icon: "cards-off",
        color: "#FF5A5A",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 30,
      },
      {
        name: "No Phone",
        icon: "phone-off",
        color: "#0A84FF",
        type: "count" as HabitType,
        unit: "hours",
        targetCount: 2,
        goalDays: 21,
      },
      {
        name: "Days Sober",
        icon: "counter",
        color: "#7DC9A0",
        type: "boolean" as HabitType,
        unit: "",
        targetCount: 1,
        goalDays: 90,
      },
    ],
  },
];
export const CATS = [
  { id: "all", label: "All", icon: "◆", color: "#FF9500" },
  { id: "health", label: "Health", icon: "💪", color: "#30D158" },
  { id: "work", label: "Work", icon: "💼", color: "#0A84FF" },
  { id: "learning", label: "Learning", icon: "📚", color: "#BF5AF2" },
  { id: "mindfulness", label: "Mind", icon: "🧘", color: "#64D2FF" },
  { id: "personal", label: "Personal", icon: "🌿", color: "#FF9500" },
];
export const FREQS = [
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Weekdays only" },
  { id: "weekends", label: "Weekends only" },
  { id: "custom", label: "Custom days" },
];
export const WDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const PROMPTS = [
  "What made you smile today?",
  "Who are you grateful for?",
  "What did you learn today?",
  "What went well today?",
  "What's a small win you had?",
  "What beauty did you notice?",
  "Three things you're thankful for.",
];
export const MOODS: [string, string][] = [
  ["😔", "Rough"],
  ["😐", "Meh"],
  ["🙂", "Good"],
  ["😊", "Great"],
  ["🤩", "Amazing"],
];
export const REMINDERS = [
  {
    id: "morning",
    emoji: "🌅",
    mIcon: "weather-sunset-up",
    label: "Morning",
    time: "07:00",
  },
  {
    id: "afternoon",
    emoji: "☀️",
    mIcon: "white-balance-sunny",
    label: "Afternoon",
    time: "13:00",
  },
  {
    id: "evening",
    emoji: "🌆",
    mIcon: "weather-sunset",
    label: "Evening",
    time: "19:00",
  },
  {
    id: "night",
    emoji: "🌙",
    mIcon: "moon-waning-crescent",
    label: "Night",
    time: "21:30",
  },
];
export const QUOTES: [string, string][] = [
  ["We are what we repeatedly do.", "Aristotle"],
  [
    "Small daily improvements are the key to staggering long-term results.",
    "Robin Sharma",
  ],
  [
    "Success is the sum of small efforts repeated day in and day out.",
    "Robert Collier",
  ],
  [
    "Motivation is what gets you started. Habit is what keeps you going.",
    "Jim Ryun",
  ],
  [
    "You don't rise to the level of your goals, you fall to the level of your systems.",
    "James Clear",
  ],
  [
    "The secret of your future is hidden in your daily routine.",
    "Mike Murdock",
  ],
  ["Consistency is the DNA of mastery.", "Robin Sharma"],
  ["An unexamined life is not worth living.", "Socrates"],
  [
    "Do something today that your future self will thank you for.",
    "Sean Patrick Flanery",
  ],
  [
    "The chains of habit are too light to be felt until they are too heavy to be broken.",
    "Warren Buffett",
  ],
  ["First forget inspiration. Habit is more dependable.", "Octavia Butler"],
  [
    "The quality of your life is determined by the quality of your habits.",
    "James Clear",
  ],
  ["A year from now you will wish you had started today.", "Karen Lamb"],
  ["Don't count the days, make the days count.", "Muhammad Ali"],
  [
    "It's not what we do once in a while that shapes our lives, but what we do consistently.",
    "Tony Robbins",
  ],
  [
    "You'll never change your life until you change something you do daily.",
    "John C. Maxwell",
  ],
  [
    "Discipline is choosing between what you want now and what you want most.",
    "Abraham Lincoln",
  ],
  [
    "The difference between who you are and who you want to be is what you do.",
    "Bill Phillips",
  ],
  [
    "Habit is a cable; we weave a thread of it each day, and at last we cannot break it.",
    "Horace Mann",
  ],
  ["Take care of your body. It's the only place you have to live.", "Jim Rohn"],
  ["Energy and persistence conquer all things.", "Benjamin Franklin"],
  ["The only way to do great work is to love what you do.", "Steve Jobs"],
  ["In the middle of difficulty lies opportunity.", "Albert Einstein"],
  [
    "It does not matter how slowly you go as long as you do not stop.",
    "Confucius",
  ],
  ["Fall seven times, stand up eight.", "Japanese Proverb"],
  ["What you do today can improve all your tomorrows.", "Ralph Marston"],
  ["Believe you can and you're halfway there.", "Theodore Roosevelt"],
  [
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Unknown",
  ],
  ["Push yourself, because no one else is going to do it for you.", "Unknown"],
  ["Great things never come from comfort zones.", "Unknown"],
  ["Dream it. Wish it. Do it.", "Unknown"],
  ["Success doesn't just find you. You have to go out and get it.", "Unknown"],
  ["The harder the battle, the sweeter the victory.", "Les Brown"],
  ["Don't stop when you're tired. Stop when you're done.", "Unknown"],
  ["Wake up with determination. Go to bed with satisfaction.", "Unknown"],
  ["Little things make big days.", "Unknown"],
  ["It's going to be hard, but hard does not mean impossible.", "Unknown"],
  ["Don't wait for opportunity. Create it.", "Unknown"],
  [
    "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    "Unknown",
  ],
  ["The key to success is to focus on goals, not obstacles.", "Unknown"],
  [
    "You are never too old to set another goal or to dream a new dream.",
    "C.S. Lewis",
  ],
  ["If you can dream it, you can do it.", "Walt Disney"],
  [
    "All our dreams can come true, if we have the courage to pursue them.",
    "Walt Disney",
  ],
  [
    "The future belongs to those who believe in the beauty of their dreams.",
    "Eleanor Roosevelt",
  ],
  ["It always seems impossible until it's done.", "Nelson Mandela"],
  ["Start where you are. Use what you have. Do what you can.", "Arthur Ashe"],
  ["Strive not to be a success, but rather to be of value.", "Albert Einstein"],
  [
    "I am not a product of my circumstances. I am a product of my decisions.",
    "Stephen Covey",
  ],
  [
    "When everything seems to be going against you, remember that the airplane takes off against the wind.",
    "Henry Ford",
  ],
  [
    "The only person you are destined to become is the person you decide to be.",
    "Ralph Waldo Emerson",
  ],
  ["Go confidently in the direction of your dreams.", "Henry David Thoreau"],
  ["Opportunities don't happen. You create them.", "Chris Grosser"],
  [
    "Success usually comes to those who are too busy to be looking for it.",
    "Henry David Thoreau",
  ],
  [
    "Try not to become a man of success. Rather become a man of value.",
    "Albert Einstein",
  ],
  [
    "Don't be afraid to give up the good to go for the great.",
    "John D. Rockefeller",
  ],
  [
    "I find that the harder I work, the more luck I seem to have.",
    "Thomas Jefferson",
  ],
  [
    "Success is walking from failure to failure with no loss of enthusiasm.",
    "Winston Churchill",
  ],
  [
    "The successful warrior is the average man, with laser-like focus.",
    "Bruce Lee",
  ],
  ["The secret of getting ahead is getting started.", "Mark Twain"],
  [
    "People who succeed have momentum. The more they succeed, the more they want to.",
    "Tony Robbins",
  ],
  [
    "Whatever the mind of man can conceive and believe, it can achieve.",
    "Napoleon Hill",
  ],
  ["Winning isn't everything, but wanting to win is.", "Vince Lombardi"],
  ["If you're going through hell, keep going.", "Winston Churchill"],
  [
    "We generate fears while we sit. We overcome them by action.",
    "Dr. Henry Link",
  ],
  ["Whether you think you can or think you can't, you're right.", "Henry Ford"],
  [
    "Life is not measured by the number of breaths we take, but by the moments that take our breath away.",
    "Maya Angelou",
  ],
  ["Either you run the day or the day runs you.", "Jim Rohn"],
  [
    "I've missed more than 9000 shots in my career. That's why I succeed.",
    "Michael Jordan",
  ],
  ["Don't watch the clock; do what it does. Keep going.", "Sam Levenson"],
  [
    "Too many of us are not living our dreams because we are living our fears.",
    "Les Brown",
  ],
  [
    "You may be disappointed if you fail, but you are doomed if you don't try.",
    "Beverly Sills",
  ],
  [
    "Remember that not getting what you want is sometimes a wonderful stroke of luck.",
    "Dalai Lama",
  ],
  ["Do one thing every day that scares you.", "Eleanor Roosevelt"],
  [
    "Build your dreams, or someone else will hire you to build theirs.",
    "Farrah Gray",
  ],
  [
    "The number one reason people fail is because they listen to their doubts.",
    "Napoleon Hill",
  ],
  [
    "It is not the strongest that survive, but the most responsive to change.",
    "Charles Darwin",
  ],
  [
    "If you are not willing to risk the usual, you will have to settle for the ordinary.",
    "Jim Rohn",
  ],
  [
    "Don't let the fear of losing be greater than the excitement of winning.",
    "Robert Kiyosaki",
  ],
  ["When you cease to dream you cease to live.", "Malcolm Forbes"],
  [
    "You've got to get up every morning with determination to go to bed with satisfaction.",
    "George Lorimer",
  ],
  [
    "To live a creative life, we must lose our fear of being wrong.",
    "Anonymous",
  ],
  [
    "The man who has confidence in himself gains the confidence of others.",
    "Hasidic Proverb",
  ],
  [
    "No matter what people tell you, words and ideas can change the world.",
    "Robin Williams",
  ],
  [
    "Keep your eyes on the stars, and your feet on the ground.",
    "Theodore Roosevelt",
  ],
  [
    "I have learned that when one's mind is made up, this diminishes fear.",
    "Rosa Parks",
  ],
  [
    "You can't use up creativity. The more you use, the more you have.",
    "Maya Angelou",
  ],
  [
    "What we fear doing most is usually what we most need to do.",
    "Tim Ferriss",
  ],
  ["The pain of discipline is far less than the pain of regret.", "Unknown"],
  ["Every master was once a disaster.", "Unknown"],
  ["Hard work beats talent when talent doesn't work hard.", "Tim Notke"],
  [
    "You don't have to be great to start, but you have to start to be great.",
    "Zig Ziglar",
  ],
  ["Action is the foundational key to all success.", "Pablo Picasso"],
  ["Don't wish it were easier; wish you were better.", "Jim Rohn"],
  [
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Chinese Proverb",
  ],
  [
    "Your time is limited, so don't waste it living someone else's life.",
    "Steve Jobs",
  ],
  ["The mind is everything. What you think you become.", "Buddha"],
  [
    "Twenty years from now you will be more disappointed by the things you didn't do.",
    "Mark Twain",
  ],
  [
    "Life is 10% what happens to you and 90% how you react to it.",
    "Charles R. Swindoll",
  ],
  ["If opportunity doesn't knock, build a door.", "Milton Berle"],
  ["You miss 100% of the shots you don't take.", "Wayne Gretzky"],
  [
    "I am not a product of my circumstances. I am a product of my decisions.",
    "Stephen Covey",
  ],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const toDS = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const today = () => toDS(new Date());
export const isDayTime = () => {
  const h = new Date().getHours();
  return h >= 6 && h < 20;
};
export const rgba = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};
export const calcStreak = (c: string[]): number => {
  let s = 0;
  const d = new Date();
  if (!c.includes(toDS(d))) d.setDate(d.getDate() - 1);
  while (c.includes(toDS(d))) {
    s++;
    d.setDate(d.getDate() - 1);
  }
  return s;
};
export const ringProgress = (habit: Habit): number => {
  const streak = calcStreak(habit.completions);
  if (habit.goalDays && habit.goalDays > 0) {
    return Math.min(streak / habit.goalDays, 1);
  }
  const next =
    MILESTONES.find((m) => m > streak) ?? MILESTONES[MILESTONES.length - 1];
  const prev = [...MILESTONES].reverse().find((m) => m <= streak) ?? 0;
  return Math.min((streak - prev) / Math.max(next - prev, 1), 1);
};
export function to12h(t: string): string {
  if (!t || !t.includes(":")) return t;
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
export const getTheme = (dark: boolean): Theme =>
  dark
    ? {
        bg: "#141210",
        bg2: "#1E1A18",
        bg3: "#2A2420",
        text: "#F5EDE8",
        text2: "rgba(245,237,232,0.55)",
        text3: "rgba(245,237,232,0.28)",
        border: "rgba(196,98,45,0.12)",
        accent: "#C4622D",
        green: "#6DB88A",
        sheet: "#1E1A18",
        isDark: true,
      }
    : {
        bg: "#FDF0EA",
        bg2: "#FFFFFF",
        bg3: "#F5E6DC",
        text: "#1C1410",
        text2: "rgba(28,20,16,0.55)",
        text3: "rgba(28,20,16,0.32)",
        border: "rgba(196,98,45,0.15)",
        accent: "#C4622D",
        green: "#4A8C5C",
        sheet: "#FFFFFF",
        isDark: false,
      };

// ─── Haptic ───────────────────────────────────────────────────────────────────
export function useHaptic() {
  return useCallback((type: "light" | "medium" | "heavy" | "success") => {
    try {
      if (type === "success")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === "heavy")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      else if (type === "medium")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
  }, []);
}

// ─── Migration ────────────────────────────────────────────────────────────────
// Ensures any habit loaded from storage has all required fields.
// Safe to run on every load — new fields get safe defaults.
// When you add a new field to Habit, add it here with a default value.
export const migrateHabit = (h: any): Habit => ({
  id: h.id,
  name: h.name ?? "",
  icon: h.icon ?? "habyt-logo",
  color: h.color ?? "#C4622D",
  category: h.category ?? "personal",
  freq: h.freq ?? "daily",
  customDays: h.customDays ?? [1, 2, 3, 4, 5],
  reminder: h.reminder ?? null,
  note: h.note ?? "",
  completions: h.completions ?? [],
  failures: h.failures ?? [],
  longestStreak: h.longestStreak ?? 0,
  goalDays: h.goalDays,
  type: h.type ?? "boolean",
  targetCount: h.targetCount,
  counts: h.counts ?? {},
});

// ─── Storage ──────────────────────────────────────────────────────────────────
export const loadHabits = async (): Promise<Habit[]> => {
  try {
    const v = await AsyncStorage.getItem("habits-v1");
    // migrateHabit ensures every habit has all fields even after app updates
    return v ? JSON.parse(v).map(migrateHabit) : [];
  } catch {
    return [];
  }
};
export const saveHabits = async (habits: Habit[]) => {
  try {
    await AsyncStorage.setItem("habits-v1", JSON.stringify(habits));
  } catch {}
};
export const loadJournal = async (): Promise<JournalMap> => {
  try {
    const v = await AsyncStorage.getItem("journal-v1");
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
};
export const saveJournal = async (journal: JournalMap) => {
  try {
    await AsyncStorage.setItem("journal-v1", JSON.stringify(journal));
  } catch {}
};
