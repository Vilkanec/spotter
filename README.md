# Spotter

A web app that builds a weekly training plan with AI and checks it against the user's time, equipment, pain and level (rules R1–R6). Plans can also be edited by hand or by asking the AI for a change; every result goes through the same checks. Design document: [projektavimo-dokumentas.md](projektavimo-dokumentas.md).

## Requirements

- Node.js 22.13 or newer (tested on 26.7), npm 10 or newer
- A Gemini API key from https://aistudio.google.com/apikey

No database server is needed: the app uses the built-in `node:sqlite` and creates `data/spotter.db` on first start.

## Setup and run

```bash
npm install
cp .env.example .env.local    # then put your key into GEMINI_API_KEY
npm run dev                   # http://localhost:3000
```

`.env.example`:

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
```

Without a key the app still runs: plan generation falls back to the simplified plan, and the onboarding chat reports that the assistant is unavailable.

## Tests

```bash
npm test
```

The tests never call the real AI. `ScriptedAiClient` (`tests/support.js`) returns prepared answers, so every run gives the same result. The scenarios come from the design document.

| File | What it checks |
|---|---|
| `tests/PlanGenerator.test.js` | Normal case: a valid AI plan is accepted on the first try. Conflict: R2 and R5 violations are sent back and the corrected plan is accepted. AI breaks R4 twice, so a simplified plan is built. AI service error or malformed answer counts as a failed attempt. Error: too few exercises match, so the AI is not called |
| `tests/PlanService.test.js` | A manual plan that breaks R2 is saved together with its warning |
| `tests/TenantIsolation.test.js` | One client cannot read or change another client's plan and progress |

## Sample data

Two clients are created on first start (`src/storage/sampleData.js`):

| Client | Profile | Plan |
|---|---|---|
| Alex | Office worker training at home. Beginner, Mon/Wed/Fri, 45 min, dumbbells, knee pain | none |
| Rita | Trains in a small gym. Intermediate, Tue/Thu/Sat, 60 min, barbell, bench, dumbbells, pull-up bar | a ready weekly plan |

Every stored row (`profiles`, `plans`, `completions`) has a `tenant_id`. All queries for client data are in `src/storage/TenantStore.js`. A `TenantStore` is created for one client and adds that client's `tenant_id` to every query, so one client cannot read or change another client's data. The current client is kept in a cookie and can be switched in the header. To start from scratch, stop the app and delete the `data/` folder.

## Demo

The interface is in Lithuanian. The code and this README are in English.


1. Open http://localhost:3000. Alex is selected: the card at the top describes Alex and shows the profile. There is no plan yet.
2. Click **Generuoti planą**. The AI plan is checked against R1–R6. If it breaks a rule, the AI gets the errors and one more try. If it fails again, a simplified plan is built.
3. Tick exercises or click **Pažymėti dieną**. The counter shows progress, for example "1 iš 3".
4. Click **Redaguoti planą** and add **Goblet squat** (Alex has knee pain). Click **Išsaugoti planą**. The plan is saved with an R2 warning.
5. In the editor, type "sutrumpink pirmadienį" and click **Klausti AI**. The changed plan appears only if it passes every check.
6. Error case: click **Keisti profilį** and tell the bot you have no equipment and pain in your knees, back and shoulders. Generating a plan now shows that too few exercises match, and the AI is not called.
7. Switch the client to **Rita**. Only her plan and progress are shown. Switch back to Alex and nothing of Rita's is visible.
8. Run `npm test`.

## Structure

| Folder | Responsibility |
|---|---|
| `src/core` | Core module. Pure logic with no database, HTTP or AI calls: profile and plan schemas, the list of 84 exercises, rules R1–R6 (`planRules.js`), AI generation with one retry (`PlanGenerator.js`), the fallback plan and weekly progress |
| `src/ai` | `GeminiClient.js`, the only place that calls the AI |
| `src/storage` | SQLite tables, sample data and the tenant-scoped `TenantStore.js` |
| `src/services` | Use cases that connect the core, the storage and the AI: plans and progress, onboarding chat |
| `src/server` | Picks the current client from the cookie and builds its services; API error handling |
| `src/app` | Next.js pages and API routes |
| `src/ui` | React components |
| `tests` | Vitest tests |

How plan generation flows: `ui/PlanDashboard.jsx` → `app/api/plan/generate/route.js` → `services/PlanService.js` → `core/PlanGenerator.js`. The generator filters the exercises (`core/exercises.js`), builds the prompt (`core/planPrompt.js`), asks the AI (`ai/GeminiClient.js`), checks the answer (`core/planRules.js`) and, after two failed attempts, builds a plan without AI (`core/fallbackPlan.js`). `PlanService` saves the result through `storage/TenantStore.js`.

Exercise images come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain) and are stored in `public/exercises`.
