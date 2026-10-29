// What Mileto teaches before each real mission: an analogy, then a game or quiz to practice it.
// Based on the plan's "Analogies and games" table. Example numbers are fixed teaching examples;
// the kid's own numbers always come from server code.

import type { StepDef } from "./engine";
import { balance, pairs, quiz, sort, teach } from "./steps";

export const LESSONS: Record<string, StepDef[]> = {
  discover: [
    teach("seed", {
      emoji: "🌰",
      title: "An idea is a seed",
      say: "Every business starts as a tiny idea. It isn't a plant yet!",
      analogy: "A seed needs the right soil. Your idea needs people who want it, and things you already know how to do.",
    }),
    quiz("best-seed", {
      prompt: "Which seed would grow best for you?",
      say: "Hmm, which one would you pick?",
      options: [
        "Something I know how to make that people near me need",
        "The most expensive thing in the store",
        "Something nobody around me has ever asked for",
      ],
      answer: 0,
      explain: "Start with what you know and what your neighbors need.",
    }),
  ],
  choose: [
    teach("soil", {
      emoji: "🪴",
      title: "Check the soil first",
      say: "Before planting, a farmer looks at the soil. Let's check your idea with four quick questions.",
      analogy: "Can you make it? Does someone want it? Is it safe? Can you start with little money? Four yeses means good soil.",
    }),
    sort("safe", {
      prompt: "Can a kid sell this alone?",
      say: "Some ideas need a grown-up's help. Sort them!",
      bins: [
        { id: "go", label: "Go ahead", emoji: "👍" },
        { id: "adult", label: "Ask an adult", emoji: "🧑‍🍳" },
      ],
      items: [
        { label: "Painted bookmarks", bin: "go" },
        { label: "Cookies baked in the oven", bin: "adult", why: "Ovens and knives need an adult nearby." },
        { label: "Friendship bracelets", bin: "go" },
        { label: "Fresh-squeezed juice", bin: "adult", why: "Food needs clean hands and an adult's help." },
        { label: "Bike washing", bin: "go" },
      ],
    }),
  ],
  golden_circle: [
    teach("circle", {
      emoji: "🎯",
      title: "Why, how, what",
      say: "Great businesses start from the middle: WHY people need it.",
      analogy: "It's like a target. The bullseye is WHY. Around it is HOW you make it special. The outside ring is WHAT you sell.",
    }),
    pairs("circle-pairs", {
      prompt: "Match each ring to its meaning",
      pairs: [
        ["Why", "People are thirsty after school"],
        ["How", "Squeezed fresh every day"],
        ["What", "Cups of orange juice"],
      ],
    }),
  ],
  validate: [
    teach("detective", {
      emoji: "🔍",
      title: "Be a customer detective",
      say: "First we look, then we decide! Before spending money, we ask people.",
      analogy: "A farmer asks the soil if it will let the seed grow. You ask five people if they would really buy.",
    }),
    quiz("nice-idea", {
      prompt: "Your friend says “Cool idea!” Will they buy it?",
      options: ["Not sure yet: ask if they'd pay, and how much", "Yes! Buy lots of materials now", "No, friends never buy"],
      answer: 0,
      explain: "“Cool idea” is nice, but it isn't a sale. Ask if they would pay and how much.",
    }),
    sort("questions", {
      prompt: "Good interview question?",
      say: "Good detectives don't put words in people's mouths.",
      bins: [
        { id: "good", label: "Good question", emoji: "👍" },
        { id: "leading", label: "Leading", emoji: "🙈" },
      ],
      items: [
        { label: "Would you buy it? Why?", bin: "good" },
        { label: "You love juice, right?", bin: "leading", why: "This pushes them to say yes." },
        { label: "How much would you pay?", bin: "good" },
        { label: "It's the best juice ever, isn't it?", bin: "leading", why: "You already told them the answer!" },
        { label: "When would you buy it?", bin: "good" },
      ],
    }),
  ],
  shopping: [
    teach("ripest", {
      emoji: "🥭",
      title: "Compare before you buy",
      say: "Prices change from store to store. Let's find the better deal.",
      analogy: "Like picking the ripest mango: look at two, then choose. Always compare the price of ONE unit.",
    }),
    quiz("per-unit", {
      prompt: "Store A: 10 oranges for $3,000. Store B: 20 oranges for $5,000. Which is cheaper?",
      options: ["Store B: $250 per orange", "Store A: $300 per orange", "They cost the same"],
      answer: 0,
      explain: "Divide the price by how many you get: 5,000 ÷ 20 = 250.",
    }),
  ],
  capital: [
    teach("jars", {
      emoji: "🫙",
      title: "Two jars",
      say: "Your business has its own money. It is not for candy!",
      analogy: "One jar for the business, one jar for you. Money for oranges goes in the business jar. Treats come from your jar.",
    }),
    sort("jar-sort", {
      prompt: "Which jar pays for it?",
      bins: [
        { id: "business", label: "Business", emoji: "🍊" },
        { id: "personal", label: "Me", emoji: "🍬" },
      ],
      items: [
        { label: "Oranges for tomorrow", bin: "business" },
        { label: "A snack for you", bin: "personal", why: "Treats come from your own jar." },
        { label: "Cups for next week", bin: "business" },
        { label: "A movie ticket", bin: "personal", why: "Fun is great, but from your jar!" },
        { label: "Sugar for the juice", bin: "business" },
      ],
    }),
    quiz("loan", {
      prompt: "Should a kid borrow money to start?",
      options: ["No, start small with what you have", "Yes, borrow a lot to grow fast"],
      answer: 0,
      explain: "Start small. If you need help, talk to a trusted adult.",
    }),
  ],
  test_batch: [
    teach("soup", {
      emoji: "🍲",
      title: "Taste the soup first",
      say: "Don't pour all the salt at once!",
      analogy: "Cooks taste the soup before adding all the salt. Make a small batch, ask for opinions, then make more.",
    }),
    quiz("batch-size", {
      prompt: "First day selling juice. How many cups do you make?",
      options: ["A small batch, about 10", "200 cups, just in case", "None, I'll wait"],
      answer: 0,
      explain: "A small test batch costs little and teaches a lot.",
    }),
    quiz("too-sour", {
      prompt: "People say the juice is too sour. What now?",
      options: ["Adjust the recipe and test again", "Stop the business", "Ignore it"],
      answer: 0,
      explain: "Like trying on shoes: adjust until it fits the customer.",
    }),
  ],
  price: [
    teach("scale", {
      emoji: "⚖️",
      title: "Cost vs. price",
      say: "Price has to be heavier than cost, or you lose money.",
      analogy: "Picture a scale: what each cup costs you on one side, your price on the other. Profit is the difference.",
    }),
    balance("balance-game", { prompt: "Each cup costs $650. People pay up to $2,000. Set a price!", unitCost: 650, maxPrice: 2000, start: 500, stepSize: 250 }),
    quiz("profit", {
      prompt: "Profit for each cup is…",
      options: ["Price − Cost", "Price + Cost", "Cost − Price"],
      answer: 0,
      explain: "What you charge minus what it cost you.",
    }),
  ],
  brand: [
    teach("jersey", {
      emoji: "👕",
      title: "Your brand is a team jersey",
      say: "A brand helps people recognize you from far away.",
      analogy: "Like a team jersey: a name, colors and a short slogan everyone remembers.",
    }),
    teach("crier", {
      emoji: "📣",
      title: "Get known: the town crier",
      say: "Tell people what you sell, who it's for and the price.",
      analogy: "Long ago, criers called out news in the plaza. You can use word of mouth, a free sample and a poster.",
    }),
    quiz("safe-poster", {
      prompt: "Which poster text is safe?",
      options: ["Sunny Squeeze · Fresh juice · $1,500", "Call Mateo at 300 123 4567", "Find me at El Carmen School"],
      answer: 0,
      explain: "Never put phone numbers, schools or real names on a poster.",
    }),
  ],
  sales: [
    teach("host", {
      emoji: "🤝",
      title: "Be a good host",
      say: "Good sellers listen before they offer.",
      analogy: "Like welcoming a guest: say hi, listen to what they need, then offer something that helps.",
    }),
    sort("host-sort", {
      prompt: "Good host or not yet?",
      bins: [
        { id: "good", label: "Good host", emoji: "😊" },
        { id: "not", label: "Not yet", emoji: "😬" },
      ],
      items: [
        { label: "Say hi and smile", bin: "good" },
        { label: "Ignore the customer's worry", bin: "not", why: "Listen to worries, they are clues." },
        { label: "Say the price clearly", bin: "good" },
        { label: "Argue with the customer", bin: "not", why: "Stay kind, even if they don't buy." },
        { label: "Ask: would you like one?", bin: "good" },
      ],
    }),
    quiz("objection", {
      prompt: "Customer: “That's expensive.” Best answer?",
      options: ["The oranges are fresh from today, and the cup is big!", "Then don't buy it.", "Okay, take it for free."],
      answer: 0,
      explain: "Explain what makes it worth it, kindly.",
    }),
  ],
  cashbox: [
    teach("count", {
      emoji: "🧮",
      title: "Count twice a day",
      say: "Count when you open and when you close. The difference is what you sold!",
      analogy: "Like counting eggs in the basket in the morning and at night: the missing ones went somewhere.",
    }),
    quiz("sold", {
      prompt: "Morning: 20 cups. Night: 7 cups. How many did you sell?",
      options: ["13", "27", "7"],
      answer: 0,
      explain: "20 − 7 = 13.",
    }),
    quiz("money-in", {
      prompt: "You sold 13 cups at $1,500. How much money came in?",
      options: ["$19,500", "$15,000", "$1,513"],
      answer: 0,
      explain: "13 × 1,500 = 19,500.",
    }),
  ],
  decide: [
    teach("harvest", {
      emoji: "🌾",
      title: "Save seeds from the harvest",
      say: "Farmers keep some seeds to plant again. What will you do with your profit?",
      analogy: "Reinvest some, save some, enjoy some. Every choice is a guess you can test next week.",
    }),
    teach("river", {
      emoji: "🪨",
      title: "Cross the river stone by stone",
      say: "Every business has risks. Take small steps and learn from each stumble.",
      analogy: "You don't jump across a river. You step on one stone, check it holds, then the next.",
      mood: "stumble",
    }),
    quiz("scenario", {
      prompt: "When Mileto shows “what could happen”, it is…",
      options: ["A guess to test, not a promise", "A promise of money", "A rule you must follow"],
      answer: 0,
      explain: "Scenarios help you decide, but only real sales tell the truth.",
    }),
  ],
};
