export const bazaaraMobileTokens = {
  color: {
    background: "#0F172A",
    elevated: "#182234",
    card: "#202C40",

    indigo: "#00A8FF",
    orange: "#F97316",
    green: "#22C55E",

    text: "#F8FAFC",
    secondaryText: "#AEBBD0",
    mutedText: "#7E8DA6",

    border: "rgba(203,213,225,0.14)",
    destructive: "#FDA4AF",
  },

  typography: {
    /**
     * Font sizes below are base logical sizes.
     * Screens should derive final sizes from useResponsive().
     */
    hero: 42,
    screenTitle: 32,
    sectionTitle: 25,
    productTitle: 18,
    body: 15,
    small: 13,
    caption: 12,
  },

  touch: {
    /**
     * Interactive controls should never become tiny merely
     * because the screen is smaller.
     */
    minimum: 44,
    button: 50,
    largeButton: 52,
  },
} as const;