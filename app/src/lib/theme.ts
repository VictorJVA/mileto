export const colors = {
  bg: "#FBF8F1",
  card: "#FFFFFF",
  ink: "#23301F",
  muted: "#6B7466",
  olive: "#5B7A2E",
  oliveDark: "#3F5720",
  leaf: "#8DB255",
  sun: "#F2B53A",
  line: "#E7E2D6",
  warn: "#C2410C",
  world: { seed: "#8DB255", saddlebag: "#C98B3E", plaza: "#3E8EC9" },
} as const;

export const radius = 16;
export const space = (n: number) => n * 8;

export const type = {
  title: { fontSize: 26, fontWeight: "800" as const, color: colors.ink },
  h2: { fontSize: 20, fontWeight: "700" as const, color: colors.ink },
  body: { fontSize: 18, color: colors.ink, lineHeight: 25 },
  small: { fontSize: 15, color: colors.muted },
};

export const peso = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;
