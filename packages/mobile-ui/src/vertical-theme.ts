export const verticalColors = {
  shopping: { primary: "#00B8FF", secondary: "#2563FF", onPrimary: "#FFFFFF" },
  grocery: { primary: "#C026FF", secondary: "#FF3BD4", onPrimary: "#FFFFFF" },
  food: { primary: "#FF3D24", secondary: "#FF7A00", onPrimary: "#FFFFFF" },
  logistics: { primary: "#00F5FF", secondary: "#00E0B8", onPrimary: "#031315" },
  drive: { primary: "#FFFFFF", secondary: "#050505", onPrimary: "#050505" },
  pay: { primary: "#FFD600", secondary: "#FFB800", onPrimary: "#171300" },
  business: { primary: "#7C3CFF", secondary: "#B15CFF", onPrimary: "#FFFFFF" },
  pharmacy: { primary: "#FF7A00", secondary: "#FF9D00", onPrimary: "#1A0D00" },
  sport: { primary: "#39FF14", secondary: "#00E676", onPrimary: "#041404" },
} as const;

export type VerticalColorKey = keyof typeof verticalColors;
