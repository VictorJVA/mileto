# Mileto

**Mileto teaches kids to start a business by doing it.** The camera and voice check each mission, and code calculates every number. It is not a chatbot.

Mileto is an iPhone app for kids aged 8 to 18 in rural towns. It takes them from "I don't know what to sell" to selling, keeping accounts and deciding what to do next. The guide is Mileto, a curious little olive. The name comes from Thales of Miletus, who, as the story goes, foresaw a good olive harvest and rented the presses before anyone else.

Built for the Meta Global AI Developer Hackathon (theme: *Build for Your World*).

## The problem

Kids in small towns rarely have anyone to show them how to turn an idea into income. The most common reason startups fail is that nobody needed the product: CB Insights found it in 42% of 101 startup post-mortems. So Mileto makes kids **validate before they spend**.

## How it works

One path with 12 phases in 3 worlds. Kids can enter from three points, and finishing phase 12 loops back to validation.

| World | Phases | What the kid learns |
| --- | --- | --- |
| 🌱 The Seed | 1 Discover · 2 Choose · 3 Golden circle · 4 Validate | Spot opportunities and check that someone wants the idea |
| 🎒 The Saddlebag | 5 Shopping · 6 Capital · 8 Price | Costs, prices and keeping business money apart from their own |
| 🏪 The Plaza | 7 Test batch · 9 Brand · 10 Sales · 11 Cash box · 12 Decide & pitch | Test small, get known, sell, keep accounts, learn from mistakes |

The three entry points are *I don't know what to sell*, *I have an idea* and *I already sell something*. On every path, kids must complete phase 4 (validation).

Each phase has a real mission that gets checked:

- **Validate**: 5 voice interviews. The model tags each answer, and code counts who would buy and works out the price range.
- **Shopping**: price-tag photos from two stores. The model reads them, the kid confirms each value, and code finds the cheaper store per unit.
- **Brand**: Muse Image draws the poster art. The app adds the name, slogan and price on top, so the text is always readable.
- **Sales**: the kid practices with a simulated customer who objects ("that's expensive"), for at most 3 turns. A fixed rubric in code scores the conversation.
- **Cash box**: SAM 3.1 counts the products in an opening and a closing photo. The kid confirms ("I see 20, is that right?"). Code works out sales and revenue and checks them against what the kid says out loud.
- **Decide**: code simulates three scenarios that are labeled as guesses, not promises. The kid splits the profit into two jars and pitches by voice.

**Progress** works like Duolingo but is gentler: a garden that grows, seeds, and a streak with 2 grace days a week. Missing a day never costs anything. Badges reward real habits (*Customer Detective*, *Clear Accounts*, *Brave Stumble*), and a learning book turns mistakes into clues.

**Teachers** get a web dashboard at `/teacher` showing where each student is on the path and where the class gets stuck.

## Meta models

| Model | Used for | Where |
| --- | --- | --- |
| Muse Spark (`muse-spark-1.3`) | Mascot lines, reading price photos, tagging interviews and sales talks, brand ideas, the simulated customer, pitch feedback | `server/src/agent/tools.ts` |
| Muse Voice Transcribe (`muse-voice-transcribe-1.0`) | Interviews, opinions, sales replies, pitch | `POST /v1/asr/transcribe` |
| SAM 3.1 (`sam-3.1`) | Counting products in cash-box photos | `POST /v1/responses`, parsed in `server/src/meta/client.ts` |
| Muse Image (`muse-image-1.0`) | Poster art | `POST /v1/images/generations` |

**Rule:** the model reads, listens, tags and talks, and code does all the math. Model output must be JSON that matches a schema. If it fails, the call is retried once, and then the app asks the kid to say or type the value.

## Architecture

```
iPhone (Expo)  ──photos/voice──▶  Express server  ──▶  Meta Model API
  captures only                   validates, computes,      (keys live here only)
                                  stores results in SQLite
Teacher web page  ◀───────────────┘
```

- `app/`: React Native with Expo SDK 58 and Expo Router, in TypeScript. Missions are in `app/src/missions/`, and all UI copy is in `app/src/i18n/en.ts`.
- `server/`: Express 5 with TypeScript.
  - `src/core/`: pure calculation modules (costs, cash box, scenarios, jars, progress, rubric, path), covered by tests.
  - `src/agent/`: agent tools, mascot persona and safety guards.
  - `src/meta/`: Meta API client, plus a mock mode for running offline.
  - `src/db/`: SQLite through `node:sqlite`.
  - `public/teacher/`: the teacher dashboard.

## Run it

You need Node 22.13 or later (built-in `node:sqlite`) and the Expo Go app on an iPhone.

```sh
# 1. Server
cd server
npm install
cp .env.example .env        # add MODEL_API_KEY, or leave it empty to use mock models
npm run seed                # optional: sample class DEMO1 for the teacher dashboard
npm run dev                 # http://localhost:4000, teacher view at /teacher/

# 2. App
cd ../app
npm install
cp .env.example .env        # set EXPO_PUBLIC_API_URL to your computer's LAN IP, e.g. http://192.168.1.20:4000
npx expo start              # scan the QR code with the iPhone camera to open Expo Go
```

Without `MODEL_API_KEY` the server runs on **mock models** with fixed answers that follow the demo story, so the whole path can be tried for free. `GET /health` shows which mode is active.

Voice recording uses WAV (16 kHz mono) on iOS. On web and Android, kids can type instead.

## Tests and evaluation

```sh
cd server
npm test                    # 71 tests: calculations, API end to end, SAM parsing, safety guards
npm run eval -- limits      # accuracy suites: count | receipts | voice | limits
```

| Test | Target | Result |
| --- | --- | --- |
| Calculations (unit + API tests) | 100% | ✅ 71/71 passing |
| Model limits (refuses financial advice) | 0 personal advice | ✅ 5/5 refused (code guard) |
| Object counting (SAM 3.1), 20 photos | 90% exact | _pending real samples_ |
| Receipt / label reading, 15 photos | 90% of prices | _pending_ |
| Colombian Spanish voice, 20 notes | 90% of numbers | _pending_ |
| Mascot response time | < 5 s | _pending_ |

## Child safety and privacy

- **Minimal data.** The app stores a nickname, an avatar and an age range only. It never asks for a real name, email or location, and nicknames with digits or `@` are rejected.
- **An adult must be present.** The server keeps the camera and microphone endpoints locked until an adult confirms they are there.
- **Photos and audio are never stored.** They are held in memory, read, and dropped, and only confirmed numbers are kept.
- **No real money.** The app records and simulates only. It has no payments, no bank accounts and no loans.
- **Model limits.** Code guards refuse financial, medical and political advice. If a kid sounds distressed, the conversation stops and Mileto suggests talking to an adult.
- **No manipulation.** The app has no nagging notifications, loot boxes, leaderboards or streak punishment.
- **Posters** never include phone numbers, addresses, schools or real names, and the server checks this before generating one. Nothing is posted to social media from the app.
- The repo and the demo video contain only sample data and adults' hands, with no real kids.

## Built during the hackathon

All code was written during the event, starting on Oct 28, 2026. See the commit history.

- Day 1: server core (costs, cash box, scenarios, jars, progress, sales rubric, path), Meta API client and mock mode, agent tools with safety guards, SQLite store, teacher dashboard, the Expo app with all 12 missions, tests and the evaluation harness.

## Known limits

- iPhone only for now. The same code runs on Android but has not been tested there.
- SAM counting works best with separated objects on a plain table. The kid always confirms the count.
- Coin classification uses Muse Spark, and its accuracy is still to be measured.
- The teacher dashboard is read-only and has no login.

## License

MIT
