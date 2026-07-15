/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/styles/globals.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#232A36",
    background: "#F8F7F4",
    backgroundElement: "#F1F2F6",
    backgroundSelected: "#E6E8EF",
    textSecondary: "#697386",
    primary: "#334A74",
    primaryForeground: "#F8F7F4",
    card: "#FDFDFC",
    border: "#DCE1EA",
    success: "#4EA476",
    warning: "#C89632",
    info: "#4A6EC9",
    destructive: "#C45A54",
  },
  dark: {
    text: "#F1F4F8",
    background: "#252B35",
    backgroundElement: "#313844",
    backgroundSelected: "#3A4250",
    textSecondary: "#A7B0C0",
    primary: "#8298CF",
    primaryForeground: "#171C24",
    card: "#2A313C",
    border: "#414A59",
    success: "#7CC391",
    warning: "#E3B85A",
    info: "#85A1E4",
    destructive: "#D87C76",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const MobileTokens = {
  radius: {
    sm: 14,
    md: 22,
    lg: 28,
    pill: 999,
  },
  shadow: {
    card:
      Platform.select({
        web: {
          boxShadow: "0 6px 12px rgba(29, 38, 54, 0.08)",
        },
        default: {
          shadowColor: "#1D2636",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        },
      }) ?? {},
    floating:
      Platform.select({
        web: {
          boxShadow: "0 10px 18px rgba(29, 38, 54, 0.14)",
        },
        default: {
          shadowColor: "#1D2636",
          shadowOpacity: 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        },
      }) ?? {},
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-sans)",
    serif: "var(--font-serif)",
    rounded: "var(--font-sans)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
