import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { WxtVitest } from 'wxt/testing'

export default defineConfig({
	plugins: [WxtVitest()],
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


