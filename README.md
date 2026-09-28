# NIE Read India

SvelteKit app configured for Cloudflare Workers, with Tailwind CSS and Bun.

The Figma-based UI currently includes the responsive landing and registration page (`/`), the 25-question Friday quiz (`/quiz`), and registration and quiz-completion dialogs. Design assets are stored in `static/assets/figma`.

The `/quiz` page derives its state on the server from the current date in `Asia/Kolkata` using Day.js. The campaign starts October 5, 2026. Quiz 1 is available October 9–15, quiz 2 October 16–22, and quiz 3 on October 23. Before the first quiz and after the campaign, the route shows the corresponding status page. Query parameters do not select a week.

Registration and quiz submission are **UI previews** for now. They use browser `sessionStorage` so the flow can be reviewed, but do not create accounts or save answers on a server. The questions in `src/lib/quiz-questions.ts` are sample content until the weekly quiz data and submission rules are provided.

## Local development

```sh
bun install
bun run dev
```

## Checks and deployment

```sh
bun run check
bun run build
bun run preview
bun run deploy
```

`bun run deploy` publishes the app to Cloudflare Workers. It requires a Cloudflare account and Wrangler authentication. The Worker name and deployment settings are in `wrangler.jsonc`.
