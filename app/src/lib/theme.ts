// Dark, playful game look: chunky 3D buttons, rounded type, one bright accent per meaning.

export const colors = {
  bg: "#131D1B",
  surface: "#1B2926",
  surfaceHi: "#22332F",
  line: "#2F433E",
  ink: "#F1F5EE",
  muted: "#8EA39B",
  faint: "#5C7069",
  // Olive green: the main action color.
  primary: "#86C440",
  primaryEdge: "#5E9128",
  onPrimary: "#10200A",
  // Sky blue: secondary action and selection.
  blue: "#4CB5EA",
  blueEdge: "#2E89B8",
  blueSoft: "#18323D",
  // Warm feedback: never harsh red, mistakes are "stumbles".
  good: "#86C440",
  goodBg: "#1F3517",
  retry: "#F29B4B",
  retryBg: "#3A2716",
  gold: "#FFC93D",
  goldEdge: "#D9A21B",
  purple: "#B98CF2",
  locked: "#38494A",
  lockedEdge: "#2A3838",
  world: { seed: "#86C440", saddlebag: "#E7A23B", plaza: "#4CB5EA" },
  worldEdge: { seed: "#5E9128", saddlebag: "#B97B1F", plaza: "#2E89B8" },
} as const;

export const font = {
  regular: "Nunito_600SemiBold",
  bold: "Nunito_800ExtraBold",
  black: "Nunito_900Black",
};

export const radius = 16;

export const type = {
  title: { fontFamily: font.bold, fontSize: 26, color: colors.ink, lineHeight: 32 },
  h2: { fontFamily: font.bold, fontSize: 20, color: colors.ink },
  body: { fontFamily: font.regular, fontSize: 18, color: colors.ink, lineHeight: 26 },
  small: { fontFamily: font.regular, fontSize: 15, color: colors.muted, lineHeight: 21 },
  tag: { fontFamily: font.black, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase" as const },
  button: { fontFamily: font.black, fontSize: 16, letterSpacing: 1.1, textTransform: "uppercase" as const },
};

export const peso = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;
