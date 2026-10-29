// Deterministic guards that run before and after model calls (child safety section of the plan).

const FINANCIAL_ADVICE = /\b(loans?|pr[eé]stamos?|credit cards?|tarjetas? de cr[eé]dito|stocks?|acciones|crypto|bitcoin|invest(ing|ment)?|invertir|inversi[oó]n|apuestas?|betting)\b/i;
const DISTRESS = /\b(scared|afraid|sad|cry|crying|hurt|miedo|triste|llorar|llorando|me pegan|me duele)\b/i;
const PHONE = /(\+?\d[\d\s-]{6,}\d)/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const ADDRESS = /\b(calle|carrera|avenida|street|avenue|barrio|vereda|colegio|school)\b/i;

export type SafetyVerdict = { ok: true } | { ok: false; reason: "financial_advice" | "distress" | "personal_data" };

/** Checks what a kid asks or says before it reaches a model. */
export function checkKidInput(text: string): SafetyVerdict {
  if (DISTRESS.test(text)) return { ok: false, reason: "distress" };
  if (FINANCIAL_ADVICE.test(text)) return { ok: false, reason: "financial_advice" };
  return { ok: true };
}

/** Rejects generated text (posters, brand names) that contains personal data. */
export function containsPersonalData(text: string): boolean {
  return PHONE.test(text) || EMAIL.test(text) || ADDRESS.test(text);
}

export const SAFE_REPLIES: Record<Exclude<SafetyVerdict, { ok: true }>["reason"], string> = {
  financial_advice:
    "That's a question for a trusted adult. I only help with your little business, and I don't give money advice.",
  distress: "Thank you for telling me. Let's stop here and talk with an adult you trust, okay?",
  personal_data: "Let's keep personal details like phone numbers and addresses private.",
};
