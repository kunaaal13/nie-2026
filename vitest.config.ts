import { fileURLToPath } from 'node:url';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: { alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) } },
	plugins: [cloudflareTest(async () => ({
		main: './test/worker.ts',
		wrangler: { configPath: './wrangler.test.jsonc' },
		miniflare: { bindings: { TEST_MIGRATIONS: await readD1Migrations('./drizzle') } }
	}))],
	test: { setupFiles: ['./test/setup.ts'], include: ['src/**/*.vitest.ts'], maxWorkers: 1 }
});
