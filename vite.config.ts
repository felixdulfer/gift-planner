import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

// Vite plugin to replace hydrateRoot with createRoot for static builds
function staticBuildPlugin(): Plugin {
	return {
		name: 'static-build-plugin',
		enforce: 'post',
		generateBundle(options, bundle) {
			if (!isGitHubPages) return

			// Replace hydrateRoot with createRoot in all JS files
			for (const fileName in bundle) {
				const chunk = bundle[fileName]
				if (chunk.type === 'chunk' && chunk.code) {
					// Replace all instances of hydrateRoot with createRoot
					chunk.code = chunk.code.replace(/hydrateRoot/g, 'createRoot')
					
					// Ensure createRoot is imported if hydrateRoot was imported
					chunk.code = chunk.code.replace(
						/import\s*{\s*([^}]*)\s*}\s*from\s*['"]react-dom\/client['"]/g,
						(match, imports) => {
							// If createRoot is already imported, keep as is
							if (imports.includes('createRoot')) return match
							// Otherwise add createRoot to imports
							const cleanImports = imports.trim()
							if (cleanImports) {
								return match.replace('}', `, createRoot }`)
							}
							return match.replace('}', 'createRoot }')
						}
					)
				}
			}
		},
	}
}

const config = defineConfig({
  base: isGitHubPages ? '/gift-planner/' : '/',
  build: {
    outDir: 'dist',
  },
  define: isGitHubPages ? {
    // Force client-only mode for static builds
    'import.meta.env.SSR': 'false',
  } : {},
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    // Add plugin to replace hydrateRoot with createRoot for static builds
    ...(isGitHubPages ? [staticBuildPlugin()] : []),
  ],
})

export default config
