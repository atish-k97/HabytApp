/**
 * _layout.tsx — Swipeable tab layout
 * Uses Tabs with swipe enabled via tabBarStyle hidden
 * Navigation between screens: router.push() or swipe gesture
 */
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        animation: "shift",
      }}
      tabBar={() => null}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="journal" options={{ title: "Journal" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
    </Tabs>
  );
}
