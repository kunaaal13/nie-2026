# NIE Read India

SvelteKit app on Cloudflare Workers with D1, Drizzle ORM, Better Auth, Bun, and Tailwind CSS. Students register on the landing page and submit one response per quiz with their registered email. Admins create scheduled quizzes, view response statistics, and export quiz responses as CSV.

## Local development

```sh
bun install
```

Create `.dev.vars` with randomly generated values (the file is ignored by Git):

```dotenv
BETTER_AUTH_SECRET=<random 32-byte-or-longer secret>
ADMIN_SETUP_TOKEN=<random one-time setup token>
```

Then start the app:

```sh
bun run dev
```

Local `bun run dev` and `bun run preview` connect to the same remote D1 database as the deployed Worker. Changes made through either local server appear on the live site. Vitest uses `wrangler.test.jsonc` and an isolated local D1 database.

Visit `/admin/setup` with the setup token to create the first admin. After that, use `/admin/login`. Public sign-up through Better Auth is disabled; students register through the landing page. Only an email listed in `admin_users` can use the dashboard.

## Quiz workflow

Admins create a quiz at `/admin/quizzes/new`, enter its questions and correct answers, set start and end times in IST, and publish it. The public `/quiz` route shows the published quiz only from its start instant until just before its end instant. Published quiz windows may not overlap. A quiz with responses cannot be edited or deleted.

The admin dashboard includes response counts, scores, student records, individual submissions, and a per-quiz CSV export. All displayed dates and exported timestamps use Asia/Kolkata; dates are stored as UTC instants in D1. The quiz supports 1–100 single-select questions with 2–6 options each. Students enter their registered email first, answer one question at a time, and review before submission. The browser saves email, answers, and the current step under a quiz-specific local storage key until submission. A submission must answer every question and can be made once per registered email per quiz.

Student email ownership is not verified. The entered email identifies the student record and their quiz submission, so this flow should be treated as a lightweight quiz rather than an identity-verified assessment.

## Checks and deployment

```sh
bun run test
bun run check
bun run build
bun run preview
```

The Worker, D1 database, and `nietimes.co` and `www.nietimes.co` custom domains are configured in `wrangler.jsonc`. `bun run db:migrate:remote` applies migrations to the Cloudflare D1 database. Configure the `BETTER_AUTH_SECRET` Worker secret before production use. Set `ADMIN_SETUP_TOKEN` temporarily to create the first admin, then remove that secret. `bun run deploy` builds and deploys the Worker.

When changing the schema, edit `src/lib/server/db/schema.ts`, run `bun run db:generate`, review the generated SQL migration, and apply it locally and remotely. Application database reads and writes use Drizzle ORM.
