import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Store } from "../src/db/store.js";
import { parseSamOutput, collectOutputText } from "../src/meta/client.js";
import { checkKidInput, containsPersonalData } from "../src/agent/safety.js";

process.env.META_MOCK = "1";
const app = createApp(new Store(":memory:"));

describe("Mateo's juice, end to end (mock models)", () => {
  let studentId = "";
  let businessId = "";

  beforeAll(async () => {
    const s = await request(app).post("/api/students").send({ nickname: "Mateo", avatar: "olive-1", ageRange: "8-12", classCode: "demo1" });
    expect(s.status).toBe(201);
    studentId = s.body.id;
  });

  it("rejects nicknames that look like phone numbers", async () => {
    const r = await request(app).post("/api/students").send({ nickname: "3001234567", avatar: "a", ageRange: "8-12" });
    expect(r.status).toBe(400);
  });

  it("blocks camera and microphone until an adult consents", async () => {
    const blocked = await request(app).post("/api/ai/count").set("x-student-id", studentId).field("noun", "cup").attach("image", Buffer.from("x"), "a.jpg");
    expect(blocked.status).toBe(403);
    await request(app).post(`/api/students/${studentId}/consent`).send({ adultPresent: true }).expect(200);
    const ok = await request(app).post("/api/ai/count").set("x-student-id", studentId).field("noun", "cup").attach("image", Buffer.from("x"), "a.jpg");
    expect(ok.body).toEqual({ count: 20, needsConfirmation: true });
  });

  it("starts on the no-idea path and gets three ideas", async () => {
    const b = await request(app).post("/api/businesses").send({ studentId, entry: "no_idea" });
    businessId = b.body.id;
    expect(b.body.statuses["1"]).toBe("available");
    const ideas = await request(app).post("/api/ai/ideas").send({ kidSaid: "My aunt has an orange tree and I like making juice" });
    expect(ideas.body.ideas).toHaveLength(3);
  });

  it("does not answer financial advice questions", async () => {
    const r = await request(app).post("/api/ai/ideas").send({ kidSaid: "should I get a loan to buy stocks?" });
    expect(r.body.ideas).toEqual([]);
    expect(r.body.blocked).toMatch(/adult/);
  });

  it("completing phases unlocks the next and grows the garden", async () => {
    const r = await request(app).post(`/api/businesses/${businessId}/phases/1/complete`).send({ result: { idea: "juice" }, date: "2026-10-29" });
    expect(r.body.business.statuses["2"]).toBe("available");
    expect(r.body.progress).toMatchObject({ seeds: 10, streak: 1, garden: "seed" });
  });

  it("locked phases return 409", async () => {
    await request(app).post(`/api/businesses/${businessId}/phases/11/complete`).send({}).expect(409);
  });

  it("summarizes interviews with code-computed numbers", async () => {
    const r = await request(app)
      .post("/api/ai/interviews")
      .send({ idea: "orange juice", transcripts: ["sí, pagaría 1500", "sí lo compro por 1000", "no, nunca", "sí, 2000"] });
    expect(r.body.summary).toMatchObject({ interviews: 4, interested: 3, decision: "keep_going" });
    expect(r.body.summary.priceRange).toEqual({ min: 1000, max: 2000, median: 1500 });
  });

  it("practices a sale for at most three customer turns and scores it in code", async () => {
    const history: Array<{ role: "kid" | "customer"; text: string }> = [{ role: "kid", text: "Hola! Jugo de naranja a 1500 pesos" }];
    let last;
    for (let i = 0; i < 3; i++) {
      last = await request(app).post("/api/ai/customer").send({ scenario: "too expensive", product: "orange juice", price: 1500, history });
      history.push({ role: "customer", text: last.body.reply }, { role: "kid", text: "Las naranjas son frescas de hoy, ¿quiere uno?" });
    }
    expect(last!.body.endConversation).toBe(true);
    const evalRes = await request(app).post("/api/ai/evaluate-sale").send({ objection: "too expensive", history });
    expect(evalRes.body.feedback.score).toBe(evalRes.body.feedback.maxScore);
  });

  it("closes the cash box and awards Clear Accounts when counts match", async () => {
    const cash = await request(app).post("/api/calc/cashbox").send({ unitsAtOpen: 20, unitsAtClose: 7, price: 1500, soldByVoice: 13 });
    expect(cash.body).toMatchObject({ soldByCount: 13, revenue: 19500, matches: true });
  });

  it("stumbles earn Brave Stumble once", async () => {
    const r = await request(app).post(`/api/businesses/${businessId}/learnings`).send({ kind: "stumble", text: "Made too much juice", hint: "Start with a small batch" });
    expect(r.body.newBadges).toEqual(["brave_stumble"]);
    const again = await request(app).post(`/api/businesses/${businessId}/learnings`).send({ kind: "stumble", text: "Forgot cups" });
    expect(again.body.newBadges).toEqual([]);
  });

  it("splits profit into two jars", async () => {
    const r = await request(app).post(`/api/businesses/${businessId}/jars/split`).send({ profit: 11050, businessShare: 0.6 });
    expect(r.body).toMatchObject({ business: 6630, personal: 4420 });
  });

  it("refuses posters with personal data", async () => {
    const r = await request(app).post("/api/ai/poster").send({ name: "Jugos Mateo 3001234567", slogan: "fresh", product: "juice" });
    expect(r.body.blocked).toBeTruthy();
  });

  it("shows the class on the teacher dashboard", async () => {
    const r = await request(app).get("/api/teacher/classes/demo1");
    expect(r.body.students[0]).toMatchObject({ nickname: "Mateo", phasesDone: 1, currentPhase: { id: 2 } });
  });
});

describe("SAM output parsing", () => {
  it("counts boxes in frame 0", () => {
    const text = "<0f>0<|box;x1=1;y1=2;x2=3;y2=4;w=10;h=10;c=0.9|><|mask;x=0;y=0;data=2,2,~ab;c|>1<|box;x1=5;y1=5;x2=8;y2=8;w=10;h=10|><|mask;x=0;y=0;data=2,2,~cd|>";
    const boxes = parseSamOutput(text);
    expect(boxes).toHaveLength(2);
    expect(boxes[0]).toMatchObject({ id: 0, x1: 1, confidence: 0.9 });
    expect(boxes[1].confidence).toBeNull();
  });
  it("returns zero for an empty lane", () => {
    expect(parseSamOutput("")).toEqual([]);
  });
  it("joins output_text deltas from SSE", () => {
    const sse = ['data: {"type":"response.output_text.delta","delta":"<0f>0"}', 'data: {"type":"response.output_text.delta","delta":"<|box;x1=1|>"}', "data: [DONE]"].join("\n");
    expect(collectOutputText(sse)).toBe("<0f>0<|box;x1=1|>");
  });
});

describe("safety guards", () => {
  it("flags financial advice and distress", () => {
    expect(checkKidInput("¿qué acciones compro?")).toEqual({ ok: false, reason: "financial_advice" });
    expect(checkKidInput("tengo miedo")).toEqual({ ok: false, reason: "distress" });
    expect(checkKidInput("I want to sell juice")).toEqual({ ok: true });
  });
  it("detects personal data in generated text", () => {
    expect(containsPersonalData("call 300 123 4567")).toBe(true);
    expect(containsPersonalData("Calle 5 #3-20")).toBe(true);
    expect(containsPersonalData("Sunny Squeeze")).toBe(false);
  });
});
