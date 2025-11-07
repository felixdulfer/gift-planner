import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const config = defineConfig({
	base: isGitHubPages ? '/gift-planner/' : '/',
	server: {
		host: '0.0.0.0',
		port: 3000,
		watch: {
			usePolling: true, // Needed for Docker file watching
		},
	},
	build: {
		outDir: 'dist',
	},
	plugins: [
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ['./tsconfig.json'],
		}),
		tailwindcss(),
		tanstackRouter(),
		viteReact({
			babel: {
				plugins: ['babel-plugin-react-compiler'],
			},
		}),
	],
})

export default config
