// What Mileto teaches before each real mission. Every lesson follows the same arc:
//   1. Hook: a short story where a kid like them faces the problem.
//   2. Explain: the idea in bite-size cards, an everyday analogy and a worked example.
//   3. Practice: varied games, from recognizing (pictures, quiz) to producing (order, fill in).
//   4. Recap: what they learned, then the real mission.
// Example numbers are fixed teaching examples; the kid's own numbers always come from server code.

import type { StepDef } from "./engine";
import { balance, blank, explain, lightning, order, pairs, pictures, quiz, recap, sort, story, type Character } from "./steps";

const CAST: Record<string, Character> = {
  mateo: { name: "Mateo", emoji: "👦🏽" },
  sofi: { name: "Sofi", emoji: "👧🏻" },
  ramon: { name: "Don Ramón", emoji: "👴🏾" },
  rosa: { name: "Doña Rosa", emoji: "👵🏽" },
  lina: { name: "Lina", emoji: "👩🏽" },
  mileto: { name: "Mileto", emoji: "🫒" },
};

export const LESSONS: Record<string, StepDef[]> = {
  // ── World 1: The Seed ────────────────────────────────────────────────────────────────
  discover: [
    story("hook", {
      title: "Mateo wants money for a ball",
      cast: CAST,
      lines: [
        { who: "mateo", text: "I want a new football, but I don't have money." },
        { who: "mileto", text: "What if you sold something? What are you good at?" },
        { who: "mateo", text: "Hmm… I help my aunt pick oranges. And I make great juice!" },
        { who: "mileto", text: "Oranges you can get, and a skill you already have. That's a seed of an idea!" },
      ],
      question: {
        prompt: "Where did Mateo's idea come from?",
        options: ["Things he has and knows how to do", "A video of a rich kid", "His friend's idea"],
        answer: 0,
        explain: "Great ideas often start with what you already have and know.",
      },
    }),
    explain("learn", {
      title: "Where do business ideas come from?",
      cards: [
        { emoji: "🧰", text: "Look at what you HAVE: fruit trees, a bike, art supplies, a kitchen." },
        { emoji: "🧠", text: "Look at what you KNOW how to do: cooking, drawing, fixing, organizing." },
        { emoji: "🙋", text: "Look at what people NEAR YOU need or complain about." },
      ],
      analogy: "An idea is a seed. It isn't a plant yet! It grows best where what you have, what you know and what people need meet.",
      example: {
        title: "Sofi's idea",
        steps: ["She HAS colorful thread.", "She KNOWS how to braid.", "Classmates WANT matching bracelets."],
        result: "Friendship bracelets!",
      },
    }),
    pictures("pick-seed", {
      prompt: "Lina has a garden full of mint and lemons. Which idea fits her best?",
      options: [
        { emoji: "🍋", label: "Lemonade with mint" },
        { emoji: "🚗", label: "Selling cars" },
        { emoji: "📱", label: "Fixing phones" },
        { emoji: "✈️", label: "Travel trips" },
      ],
      answer: 0,
      explain: "She already has lemons and mint, so she can start right away.",
    }),
    sort("have-know-need", {
      prompt: "Is it something you HAVE or something you KNOW?",
      bins: [
        { id: "have", label: "I have", emoji: "🧰" },
        { id: "know", label: "I know", emoji: "🧠" },
      ],
      items: [
        { label: "An orange tree", bin: "have" },
        { label: "How to draw", bin: "know", why: "Drawing is a skill, something you know how to do." },
        { label: "A bicycle", bin: "have" },
        { label: "How to bake bread", bin: "know", why: "Baking is a skill." },
        { label: "Colored pencils", bin: "have" },
      ],
    }),
    quiz("best-seed", {
      prompt: "Which seed would grow best?",
      options: ["Something I know how to make that people near me need", "The most expensive thing in the store", "Something nobody around me has ever asked for"],
      answer: 0,
      explain: "Start with what you know and what your neighbors need.",
    }),
    recap("recap", {
      points: ["Ideas start with what you have and what you know.", "The best ideas also solve something people near you need.", "An idea is a seed: it still has to grow."],
      next: "Now tell me about YOU, and I'll help you find three seeds!",
    }),
  ],

  choose: [
    story("hook", {
      title: "Sami's cake problem",
      cast: { ...CAST, sami: { name: "Sami", emoji: "🧒🏾" } },
      lines: [
        { who: "sami", text: "I'll sell giant chocolate cakes! Everyone loves cake." },
        { who: "mileto", text: "Yum! Do you have an oven?" },
        { who: "sami", text: "No… and chocolate is expensive. And I'm not allowed to use the stove alone." },
        { who: "mileto", text: "No problem! Let's check the soil before planting the seed." },
      ],
      question: {
        prompt: "What was Sami's problem?",
        options: ["He couldn't make it safely or cheaply", "Nobody likes cake", "Cakes are too small"],
        answer: 0,
        explain: "A good idea also has to be possible, safe and cheap to start.",
      },
    }),
    explain("learn", {
      title: "Four questions to check your idea",
      cards: [
        { emoji: "🛠️", text: "Can I make it, or get it, with what I have?" },
        { emoji: "🙋", text: "Do I know someone who would want it?" },
        { emoji: "🦺", text: "Is it safe? If it uses knives, stoves or food, an adult helps." },
        { emoji: "🪙", text: "Can I start with very little money?" },
      ],
      analogy: "A farmer checks the soil before planting. Four yeses mean good soil. A no means: adjust the idea a bit.",
      example: {
        title: "Checking bracelets",
        steps: ["Make it? Yes, I have thread.", "Someone wants it? Yes, my classmates.", "Safe? Yes, no sharp tools.", "Cheap? Yes, thread costs little."],
        result: "4 yeses: good soil!",
      },
    }),
    sort("safe", {
      prompt: "Can a kid sell this alone?",
      bins: [
        { id: "go", label: "Go ahead", emoji: "👍" },
        { id: "adult", label: "Ask an adult", emoji: "🧑‍🍳" },
      ],
      items: [
        { label: "Painted bookmarks", bin: "go" },
        { label: "Cookies baked in the oven", bin: "adult", why: "Ovens need an adult nearby." },
        { label: "Friendship bracelets", bin: "go" },
        { label: "Fresh-squeezed juice", bin: "adult", why: "Food needs clean hands and an adult's help." },
        { label: "Bike washing", bin: "go" },
      ],
    }),
    blank("fix-idea", {
      prompt: "Sami fixes his idea",
      before: "Instead of giant cakes, Sami sells small",
      after: "he can make with his grandma.",
      options: ["cookies", "cars", "phones"],
      answer: 0,
      explain: "Smaller, cheaper, and with an adult helping: now the soil is good!",
    }),
    lightning("rules", {
      prompt: "True or false?",
      statements: [
        { text: "If an idea gets a NO, you must throw it away.", truth: false, why: "You can adjust it instead." },
        { text: "Food ideas need an adult to help.", truth: true, why: "Safety first!" },
        { text: "The best ideas need lots of money to start.", truth: false, why: "Start small and cheap." },
      ],
    }),
    recap("recap", {
      points: ["Check four things: make it, someone wants it, safe, cheap.", "A NO is a clue to adjust, not a failure.", "Food or tools mean an adult helps."],
      next: "Your turn! Let's check the soil for YOUR idea.",
    }),
  ],

  golden_circle: [
    story("hook", {
      title: "Two lemonade stands",
      cast: CAST,
      lines: [
        { who: "rosa", text: "There are two lemonade stands. Which one should I buy from?" },
        { who: "lina", text: "Stand one just says: LEMONADE $1,000." },
        { who: "sofi", text: "Stand two says: Hot day? Cool down with lemonade made fresh this morning!" },
        { who: "rosa", text: "I'll go to the second one. I know why it's special!" },
      ],
      question: {
        prompt: "Why did Doña Rosa choose the second stand?",
        options: ["It said why and how it was special", "It was cheaper", "It was bigger"],
        answer: 0,
        explain: "People connect with the WHY, not just the WHAT.",
      },
    }),
    explain("learn", {
      title: "The golden circle: why, how, what",
      cards: [
        { emoji: "❤️", text: "WHY: the reason people need it. The problem it solves or the wish it fulfills." },
        { emoji: "✨", text: "HOW: what makes yours special. Fresh, handmade, delivered…" },
        { emoji: "📦", text: "WHAT: the thing you sell." },
      ],
      analogy: "It's like a target. The bullseye is WHY. Around it is HOW. The outside ring is WHAT. Start from the middle!",
      example: {
        title: "Mateo's circle",
        steps: ["WHY: kids are thirsty after school.", "HOW: squeezed fresh, from my aunt's trees.", "WHAT: cups of orange juice."],
        result: "Fresh juice for thirsty kids after school!",
      },
    }),
    pairs("circle-pairs", {
      prompt: "Match each ring to Sofi's bracelets",
      pairs: [
        ["Why", "Friends want to show they're best friends"],
        ["How", "Handmade in your favorite colors"],
        ["What", "Friendship bracelets"],
      ],
    }),
    quiz("which-why", {
      prompt: "Which one is a WHY?",
      options: ["People get hungry waiting for the bus", "Bags of popcorn", "Made with real butter"],
      answer: 0,
      explain: "A WHY is the need. Popcorn is the WHAT, butter is the HOW.",
    }),
    order("circle-order", {
      prompt: "Put the golden circle in order, from the center out",
      items: ["Why", "How", "What"],
      explain: "Always start from the bullseye: WHY.",
    }),
    recap("recap", {
      points: ["WHY is the need: the most important ring.", "HOW is what makes yours special.", "WHAT is the thing you sell."],
      next: "Now tell me YOUR why, how and what. I'll make your business card!",
    }),
  ],

  validate: [
    story("hook", {
      title: "Lina's 50 cupcakes",
      cast: CAST,
      lines: [
        { who: "lina", text: "I baked 50 cupcakes because everyone said 'cool idea!'" },
        { who: "mileto", text: "And how many did you sell?" },
        { who: "lina", text: "Only 6. Saying 'cool' is not the same as paying…" },
        { who: "mileto", text: "Great stumble! Next time we ask BEFORE we bake. First we look, then we decide." },
      ],
      question: {
        prompt: "What should Lina have done first?",
        options: ["Ask people if they'd really buy, and for how much", "Bake 100 cupcakes", "Make them prettier"],
        answer: 0,
        explain: "Asking first saves money and work.",
      },
    }),
    explain("learn", {
      title: "Be a customer detective",
      cards: [
        { emoji: "🔍", text: "Before spending money, ask 5 people you know if they would BUY it." },
        { emoji: "🙊", text: "Don't push. Ask open questions and let them answer freely." },
        { emoji: "💰", text: "Ask how much they would pay. That's a clue for your price." },
        { emoji: "📊", text: "If fewer than half say yes, adjust the idea. That's a win: you saved money!" },
      ],
      analogy: "A farmer asks the soil if it will let the seed grow. You ask the people around you.",
      example: {
        title: "Mateo's interviews",
        steps: ["5 people asked.", "4 said they would buy.", "They'd pay between 1,000 and 2,000."],
        result: "4 of 5 said yes: keep going!",
      },
    }),
    sort("questions", {
      prompt: "Good interview question?",
      bins: [
        { id: "good", label: "Good question", emoji: "👍" },
        { id: "leading", label: "Pushy", emoji: "🙈" },
      ],
      items: [
        { label: "Would you buy it? Why?", bin: "good" },
        { label: "You love juice, right?", bin: "leading", why: "This pushes them to say yes." },
        { label: "How much would you pay?", bin: "good" },
        { label: "It's the best juice ever, isn't it?", bin: "leading", why: "You already told them the answer!" },
        { label: "When would you buy it?", bin: "good" },
      ],
    }),
    quiz("half", {
      prompt: "You asked 6 people. Only 2 would buy. What now?",
      options: ["Adjust the idea and ask again", "Buy materials for 100 anyway", "Give up on business forever"],
      answer: 0,
      explain: "2 of 6 is less than half: a clue to adjust, not a reason to quit.",
    }),
    lightning("detective", {
      prompt: "True or false?",
      statements: [
        { text: "“Cool idea!” means they will buy.", truth: false, why: "Only asking about paying tells you." },
        { text: "Interviews are with people you know, with an adult nearby.", truth: true, why: "Safety first." },
        { text: "Asking first saves money.", truth: true, why: "You don't buy what won't sell." },
      ],
    }),
    recap("recap", {
      points: ["Ask before you buy: first we look, then we decide.", "Open questions, no pushing.", "Fewer than half yes = adjust the idea."],
      next: "Time to be a detective! Let's interview real people.",
    }),
  ],

  // ── World 2: The Saddlebag ─────────────────────────────────────────────────────────────
  shopping: [
    story("hook", {
      title: "Two stores, one mango",
      cast: CAST,
      lines: [
        { who: "mateo", text: "The corner shop sells 10 oranges for $3,000. The market: 20 for $5,000." },
        { who: "sofi", text: "The corner shop is cheaper, 3,000 is less than 5,000!" },
        { who: "mileto", text: "Hmm… but you get a different number of oranges. Let's compare ONE orange." },
      ],
      question: {
        prompt: "What's the fair way to compare?",
        options: ["The price of ONE orange at each store", "Which total number is smaller", "Which store is closer"],
        answer: 0,
        explain: "Divide the price by how many you get: price per unit.",
      },
    }),
    explain("learn", {
      title: "Price per unit",
      cards: [
        { emoji: "🏷️", text: "Stores sell packs of different sizes, so totals can trick you." },
        { emoji: "➗", text: "Divide the price by how many you get. That's the price of ONE." },
        { emoji: "🏆", text: "The lowest price per unit is the better deal (if the quality is the same)." },
      ],
      analogy: "Like picking the ripest mango: look at two, then choose. Always compare one with one.",
      example: { title: "Oranges", steps: ["Corner shop: 3,000 ÷ 10 = 300 each.", "Market: 5,000 ÷ 20 = 250 each."], result: "The market is cheaper per orange!" },
    }),
    quiz("per-unit", {
      numeric: true,
      prompt: "Store A: 4 cups for $800. Store B: 10 cups for $1,500. Which is cheaper per cup?",
      options: ["Store B: $150 per cup", "Store A: $200 per cup", "They cost the same"],
      answer: 0,
      explain: "800 ÷ 4 = 200 and 1,500 ÷ 10 = 150.",
    }),
    blank("divide", {
      numeric: true,
      prompt: "Complete the rule",
      before: "To find the price of one, you",
      after: "the price by how many you get.",
      options: ["divide", "add", "multiply"],
      answer: 0,
      explain: "Price ÷ quantity = price of one.",
    }),
    recap("recap", {
      points: ["Totals can trick you: compare the price of ONE.", "Price ÷ quantity = price per unit.", "Lower per unit = better deal."],
      next: "Now take photos of real price tags. I'll read them, you check them!",
    }),
  ],

  capital: [
    story("hook", {
      title: "Where did the juice money go?",
      cast: CAST,
      lines: [
        { who: "mateo", text: "I made $10,000 selling juice! Then I bought candy… and a toy…" },
        { who: "mileto", text: "And now, money for oranges tomorrow?" },
        { who: "mateo", text: "Oh no. There's nothing left for oranges!" },
        { who: "mileto", text: "Let's fix it with two jars." },
      ],
      question: {
        prompt: "What went wrong for Mateo?",
        options: ["He mixed business money with his own", "He sold too much juice", "Oranges got cheaper"],
        answer: 0,
        explain: "Without separate jars, the business can't buy what it needs.",
      },
    }),
    explain("learn", {
      title: "Two jars",
      cards: [
        { emoji: "🍊", text: "BUSINESS jar: money to buy materials and keep the business going." },
        { emoji: "🍬", text: "MY jar: money that is yours to save or enjoy." },
        { emoji: "🚫", text: "Start with money you have (savings or a gift). No loans!" },
      ],
      analogy: "The business jar is not for candy! It's the seeds you save for the next planting.",
      example: { title: "Splitting $10,000", steps: ["Half to the business jar: $5,000.", "Half to my jar: $5,000."], result: "Oranges tomorrow AND a treat today!" },
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
    recap("recap", {
      points: ["Two jars: business and mine.", "Business money buys what the business needs.", "Start with what you have, no loans."],
      next: "Now let's set up YOUR business jar.",
    }),
  ],

  test_batch: [
    story("hook", {
      title: "The salty soup",
      cast: CAST,
      lines: [
        { who: "rosa", text: "When I was young, I made a giant pot of soup and poured all the salt at once." },
        { who: "sofi", text: "Was it good?" },
        { who: "rosa", text: "Too salty! Nobody ate it. Now I taste a spoonful first, then add more." },
      ],
      question: {
        prompt: "What's the lesson for a business?",
        options: ["Test with a little first, then make more", "Always make giant batches", "Never use salt"],
        answer: 0,
        explain: "A small test costs little and teaches a lot.",
      },
    }),
    explain("learn", {
      title: "Test small",
      cards: [
        { emoji: "🧪", text: "Make a SMALL first batch: 5 to 10, not 100." },
        { emoji: "💬", text: "Give tastes or samples and ask: what do you like? What would you change?" },
        { emoji: "🔁", text: "Change your product with what you hear, then test again." },
      ],
      analogy: "Like trying on shoes: you adjust until it fits the customer's foot.",
      example: { title: "Mateo's test", steps: ["Made 10 cups.", "3 people said: a bit sour.", "Added a little sugar, tested again."], result: "Now they love it!" },
    }),
    quiz("batch-size", {
      prompt: "First day selling juice. How many cups do you make?",
      options: ["A small batch, about 10", "200 cups, just in case", "None, I'll wait"],
      answer: 0,
      explain: "A small test batch costs little and teaches a lot.",
    }),
    order("test-loop", {
      prompt: "Put the testing loop in order",
      items: ["Make a small batch", "Ask for opinions", "Improve the product", "Test again"],
      explain: "Make, ask, improve, repeat!",
    }),
    recap("recap", {
      points: ["Start with a small batch.", "Ask for honest opinions.", "Improve and test again."],
      next: "Make your test batch and collect opinions!",
    }),
  ],

  price: [
    story("hook", {
      title: "Sofi works for free",
      cast: CAST,
      lines: [
        { who: "sofi", text: "I sell bracelets for $500. Everyone buys them!" },
        { who: "mileto", text: "How much does the thread for one cost?" },
        { who: "sofi", text: "About $700… wait. I lose money on every bracelet?!" },
      ],
      question: {
        prompt: "What's wrong with Sofi's price?",
        options: ["It's lower than what each bracelet costs her", "It's too high", "Nothing is wrong"],
        answer: 0,
        explain: "If price is below cost, every sale loses money.",
      },
    }),
    explain("learn", {
      title: "Cost, price and profit",
      cards: [
        { emoji: "🧾", text: "COST: what you spend to make ONE (all materials ÷ how many you make)." },
        { emoji: "🏷️", text: "PRICE: what the customer pays you." },
        { emoji: "🌱", text: "PROFIT = price − cost. It must be more than zero!" },
        { emoji: "👂", text: "Check what people said they'd pay, and what others charge." },
      ],
      analogy: "Picture a scale: cost on one side, price on the other. The price side must be heavier.",
      example: { title: "Mateo's juice", steps: ["Oranges + sugar + cups = $13,000 for 20 cups.", "Cost of one = 13,000 ÷ 20 = $650.", "Price $1,500 − cost $650."], result: "$850 profit per cup!" },
    }),
    balance("balance-game", { prompt: "Each cup costs $650. People pay up to $2,000. Set a price!", unitCost: 650, maxPrice: 2000, start: 500, stepSize: 250 }),
    blank("profit-rule", {
      numeric: true,
      prompt: "Complete the formula",
      before: "Profit = price",
      after: "cost",
      options: ["−", "+", "×"],
      answer: 0,
      explain: "What you charge minus what it cost you.",
    }),
    quiz("profit-calc", {
      numeric: true,
      prompt: "A bookmark costs $300 to make. You sell it for $1,000. What's the profit?",
      options: ["$700", "$1,300", "$300"],
      answer: 0,
      explain: "1,000 − 300 = 700.",
    }),
    recap("recap", {
      points: ["Cost of one = total materials ÷ how many.", "Profit = price − cost, and it must be positive.", "Listen to what customers said they'd pay."],
      next: "Now let's find YOUR price. I'll do the math!",
    }),
  ],

  // ── World 3: The Plaza ───────────────────────────────────────────────────────────────
  brand: [
    story("hook", {
      title: "The jersey in the crowd",
      cast: CAST,
      lines: [
        { who: "mateo", text: "At the stadium there are thousands of people, but I always find my team." },
        { who: "mileto", text: "How?" },
        { who: "mateo", text: "Their jersey! Same colors, same logo, I recognize them from far away." },
        { who: "mileto", text: "Your business needs a jersey too. That's a brand!" },
      ],
    }),
    explain("learn", {
      title: "Brand and getting known",
      cards: [
        { emoji: "👕", text: "A BRAND is your business's jersey: a name, colors and a short slogan." },
        { emoji: "📣", text: "Then tell people! Word of mouth, free samples and posters work great." },
        { emoji: "🔒", text: "Never put phone numbers, your school, address or real name on posters." },
        { emoji: "❓", text: "Ask each customer: how did you hear about us? Then you'll know what worked." },
      ],
      analogy: "Long ago, town criers called out news in the plaza: what, for whom and how much.",
    }),
    pictures("best-brand", {
      prompt: "Which is the best brand name for fresh juice?",
      options: [
        { emoji: "☀️", label: "Sunny Squeeze" },
        { emoji: "🔢", label: "Juice 300 123 4567" },
        { emoji: "📦", label: "Product A" },
        { emoji: "🏫", label: "Juice at El Carmen School" },
      ],
      answer: 0,
      explain: "Short, fun, and with no personal information.",
    }),
    sort("safe-poster", {
      prompt: "Safe for a poster?",
      bins: [
        { id: "yes", label: "Safe", emoji: "✅" },
        { id: "no", label: "Keep private", emoji: "🔒" },
      ],
      items: [
        { label: "The price", bin: "yes" },
        { label: "Your phone number", bin: "no", why: "Keep contact details private." },
        { label: "Your slogan", bin: "yes" },
        { label: "Your school's name", bin: "no", why: "It shows where you are every day." },
        { label: "A drawing of your product", bin: "yes" },
      ],
    }),
    pairs("actions", {
      prompt: "Match each way to get known",
      pairs: [
        ["Word of mouth", "Friends tell friends"],
        ["Free sample", "People taste a little"],
        ["Poster", "People see it as they pass"],
      ],
    }),
    recap("recap", {
      points: ["A brand is your jersey: name, colors, slogan.", "Get known with word of mouth, samples and posters.", "Never share personal details on posters."],
      next: "Let's create your brand and paint your poster!",
    }),
  ],

  sales: [
    story("hook", {
      title: "“That's expensive!”",
      cast: CAST,
      lines: [
        { who: "rosa", text: "Hmm, $1,500 for a juice? That's expensive." },
        { who: "mateo", text: "Then don't buy it!" },
        { who: "mileto", text: "Oops. Let's try again, listening first." },
        { who: "mateo", text: "I understand! The oranges are picked this morning and the cup is big. Want to try a sip?" },
        { who: "rosa", text: "Oh, fresh from today? I'll take one!" },
      ],
      question: {
        prompt: "What changed in Mateo's second answer?",
        options: ["He listened and explained why it's worth it", "He shouted", "He made it free"],
        answer: 0,
        explain: "Listening and explaining the value turns a 'no' into a 'yes'.",
      },
    }),
    explain("learn", {
      title: "Selling like a good host",
      cards: [
        { emoji: "👋", text: "Greet with a smile." },
        { emoji: "👂", text: "Listen: worries like 'it's expensive' are clues, not attacks." },
        { emoji: "💎", text: "Explain what makes it worth it: fresh, handmade, big…" },
        { emoji: "🤝", text: "Ask for the sale: 'Would you like one?' And stay kind if they say no." },
      ],
      analogy: "Like welcoming a guest into your home: you listen before you offer.",
    }),
    order("sale-steps", {
      prompt: "Put a good sale in order",
      items: ["Greet with a smile", "Listen to the customer", "Explain why it's worth it", "Ask: would you like one?"],
      explain: "Greet, listen, explain, ask.",
    }),
    quiz("objection", {
      prompt: "Customer: “I don't have money today.” Best answer?",
      options: ["No problem! I'm here every afternoon, come back anytime.", "Then go away.", "You have to buy now."],
      answer: 0,
      explain: "Stay kind: today's 'no' can be tomorrow's customer.",
    }),
    lightning("host", {
      prompt: "Good host? True or false",
      statements: [
        { text: "Arguing with a customer helps you sell.", truth: false, why: "Stay kind, always." },
        { text: "Saying the price clearly builds trust.", truth: true, why: "No surprises." },
        { text: "A worry is a clue about what the customer needs.", truth: true, why: "Listen to it!" },
      ],
    }),
    recap("recap", {
      points: ["Greet, listen, explain, ask.", "Worries are clues, not attacks.", "Stay kind even when they say no."],
      next: "Practice with a tricky customer. I'll play the part!",
    }),
  ],

  cashbox: [
    story("hook", {
      title: "The mystery of the missing cups",
      cast: CAST,
      lines: [
        { who: "mateo", text: "I think I sold about 15 cups today." },
        { who: "mileto", text: "How many did you have this morning, and how many are left?" },
        { who: "mateo", text: "20 this morning… 7 left now." },
        { who: "mileto", text: "So you sold 13, not 15! Counting beats guessing." },
      ],
      question: {
        prompt: "How did Mileto know Mateo sold 13?",
        options: ["Morning count minus night count", "He guessed", "He asked a friend"],
        answer: 0,
        explain: "20 − 7 = 13. Counting twice tells the truth.",
      },
    }),
    explain("learn", {
      title: "Keeping clear accounts",
      cards: [
        { emoji: "☀️", text: "Count your products when you open." },
        { emoji: "🌙", text: "Count again when you close." },
        { emoji: "➖", text: "SOLD = morning − night." },
        { emoji: "✖️", text: "MONEY IN = sold × price. Then check it matches the money in your box." },
      ],
      analogy: "Like counting eggs in the basket in the morning and at night: the missing ones went somewhere.",
      example: { title: "Mateo's day", steps: ["Sold: 20 − 7 = 13 cups.", "Money in: 13 × 1,500."], result: "$19,500" },
    }),
    quiz("sold", {
      numeric: true,
      prompt: "Morning: 30 bracelets. Night: 18. How many did you sell?",
      options: ["12", "48", "18"],
      answer: 0,
      explain: "30 − 18 = 12.",
    }),
    quiz("money-in", {
      numeric: true,
      prompt: "You sold 12 bracelets at $1,000. How much money came in?",
      options: ["$12,000", "$1,012", "$10,000"],
      answer: 0,
      explain: "12 × 1,000 = 12,000.",
    }),
    blank("mismatch", {
      prompt: "When the numbers don't match…",
      before: "If the money doesn't match the count, it's a",
      after: "to investigate, not a reason to feel bad.",
      options: ["clue", "disaster", "secret"],
      answer: 0,
      explain: "Maybe you gave a free sample or made a mistake counting. Clues help you learn!",
    }),
    recap("recap", {
      points: ["Count at opening and closing.", "Sold = morning − night; money in = sold × price.", "A mismatch is a clue."],
      next: "Take your opening photo. I'll count with you!",
    }),
  ],

  decide: [
    story("hook", {
      title: "The harvest choice",
      cast: CAST,
      lines: [
        { who: "ramon", text: "Every harvest, I keep some seeds to plant again." },
        { who: "mateo", text: "Why not sell all the oranges?" },
        { who: "ramon", text: "Then next year I'd have nothing to plant! Some for selling, some for planting, some for my family." },
      ],
      question: {
        prompt: "What does Don Ramón do with his harvest?",
        options: ["Splits it: sell, save seeds, and enjoy", "Sells everything", "Eats everything"],
        answer: 0,
        explain: "Splitting keeps the farm growing next year.",
      },
    }),
    explain("learn", {
      title: "What to do with your profit",
      cards: [
        { emoji: "🔁", text: "REPEAT: do the same again if it worked." },
        { emoji: "🏷️", text: "CHANGE THE PRICE: try a new price and watch what happens." },
        { emoji: "🐷", text: "SAVE PART: keep some aside and grow slowly." },
        { emoji: "🔮", text: "Each choice is a GUESS to test, not a promise. Real sales tell the truth." },
      ],
      analogy: "Cross the river stone by stone: one small step, check it holds, then the next.",
    }),
    pairs("choices", {
      prompt: "Match the choice with what it means",
      pairs: [
        ["Repeat", "Same plan again"],
        ["Change price", "Try a new price"],
        ["Save part", "Keep some aside"],
      ],
    }),
    quiz("scenario", {
      prompt: "When Mileto shows “what could happen”, it is…",
      options: ["A guess to test, not a promise", "A promise of money", "A rule you must follow"],
      answer: 0,
      explain: "Scenarios help you decide, but only real sales tell the truth.",
    }),
    recap("recap", {
      points: ["Profit can be repeated, changed or saved.", "Every plan is a guess to test.", "Keep some seeds for the next planting."],
      next: "Let's decide YOUR next step and pitch your business!",
    }),
  ],
};

/** Which phases belong to each world, for checkpoints. */
export const WORLD_PHASES: Record<"seed" | "saddlebag" | "plaza", string[]> = {
  seed: ["discover", "choose", "golden_circle", "validate"],
  saddlebag: ["shopping", "capital", "price"],
  plaza: ["test_batch", "brand", "sales", "cashbox", "decide"],
};
