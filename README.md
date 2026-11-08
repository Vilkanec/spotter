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

The tests never call the real AI. `ScriptedAiClient` returns prepared answers, so every run gives the same result.

| File | What it checks |
|---|---|
| `tests/PlanGenerator.test.ts` | Design document scenarios: valid plan on the first try, conflict fixed on the second try, AI fails twice so a simplified plan is built, too few exercises so the AI is not called, timeout or broken JSON, AI edit |
| `tests/PlanValidator.test.ts` | Each rule R1–R6, unknown exercises and invalid format |
| `tests/PlanService.test.ts` | Manual plan saved with a warning, weekly progress, and client data isolation |

## Sample data

Two clients are created on first start (`src/persistence/sampleData.ts`):

| Client | Profile | Plan |
|---|---|---|
| Alex | Office worker training at home. Beginner, Mon/Wed/Fri, 45 min, dumbbells, knee pain | none |
| Rita | Trains in a small gym. Intermediate, Tue/Thu/Sat, 60 min, barbell, bench, dumbbells, pull-up bar | a ready weekly plan |

Every stored row (`profiles`, `plans`, `completions`) has a `tenant_id`. Repositories are created for one client and add `tenant_id` to every query, so one client cannot read or change another client's data. The current client is kept in a cookie and can be switched in the header. To start from scratch, stop the app and delete the `data/` folder.

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
| `src/domain` | Types and schemas: profile, exercise, plan, progress |
| `src/planning` | Core module: exercise selection, rules R1–R6, AI generation with one retry, fallback plan |
| `src/ai` | The only place that calls the AI (Gemini) |
| `src/persistence` | SQLite tables, tenant-scoped repositories, the list of 84 exercises and sample data |
| `src/services` | Use cases: onboarding chat, plans and progress |
| `src/server` | API error handling and the current client |
| `src/app` | Next.js pages and API routes |
| `src/ui` | React components |
| `tests` | Vitest tests |

Exercise images come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain) and are stored in `public/exercises`.
