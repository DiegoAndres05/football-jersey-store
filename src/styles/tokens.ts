export const tokens = {
  colors: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    accent: "hsl(var(--accent))",
    muted: "hsl(var(--muted))",
    destructive: "hsl(var(--destructive))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    info: "hsl(var(--info))",
    border: "hsl(var(--border))",
    card: "hsl(var(--card))",
  },
  fontFamily: {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)",
  },
  fontSize: {
    xs: "var(--text-xs)",
    sm: "var(--text-sm)",
    base: "var(--text-base)",
    lg: "var(--text-lg)",
    xl: "var(--text-xl)",
    "2xl": "var(--text-2xl)",
    "3xl": "var(--text-3xl)",
    "4xl": "var(--text-4xl)",
    "5xl": "var(--text-5xl)",
  },
  spacing: {
    0: "var(--space-0)",
    1: "var(--space-1)",
    2: "var(--space-2)",
    3: "var(--space-3)",
    4: "var(--space-4)",
    5: "var(--space-5)",
    6: "var(--space-6)",
    8: "var(--space-8)",
    10: "var(--space-10)",
    12: "var(--space-12)",
    16: "var(--space-16)",
    20: "var(--space-20)",
    24: "var(--space-24)",
  },
  radius: {
    xs: "var(--radius-xs)",
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    "2xl": "var(--radius-2xl)",
    "3xl": "var(--radius-3xl)",
    full: "var(--radius-full)",
  },
  shadow: {
    sm: "var(--shadow-sm)",
    base: "var(--shadow-base)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
    "2xl": "var(--shadow-2xl)",
    elevation: "var(--shadow-elevation)",
  },
  zIndex: {
    dropdown: "var(--z-dropdown)",
    sticky: "var(--z-sticky)",
    navbar: "var(--z-navbar)",
    drawer: "var(--z-drawer)",
    modal: "var(--z-modal)",
    popover: "var(--z-popover)",
    tooltip: "var(--z-tooltip)",
    toast: "var(--z-toast)",
  },
  breakpoint: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
} as const;

export type TokenColor = keyof typeof tokens.colors;
export type TokenRadius = keyof typeof tokens.radius;
export type TokenShadow = keyof typeof tokens.shadow;
export type TokenSpacing = keyof typeof tokens.spacing;
export type TokenFontSize = keyof typeof tokens.fontSize;
export type TokenZIndex = keyof typeof tokens.zIndex;
export type TokenBreakpoint = keyof typeof tokens.breakpoint;
