import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
	test: {
		environment: 'happy-dom',
		include: ['**/*.{test,spec}.ts'],
		exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
})


