import { readdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const basePath = process.env.GITHUB_PAGES === 'true' ? '/gift-planner' : ''
const clientDir = join(process.cwd(), 'dist', 'client')
const assetsDir = join(clientDir, 'assets')

// Find the main JS and CSS files
const mainJsFile = readdirSync(assetsDir)
	.find((file) => file.startsWith('main-') && file.endsWith('.js'))

const mainCssFile = readdirSync(assetsDir)
	.find((file) => file.startsWith('styles-') && file.endsWith('.css'))

if (!mainJsFile) {
	console.error('Could not find main JS file')
	process.exit(1)
}

// Generate index.html with proper structure for TanStack Start
// TanStack Start expects a root element, but for static builds we need client-side rendering
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Gift Planner</title>
	<link rel="icon" href="${basePath}/favicon.ico">
	${mainCssFile ? `<link rel="stylesheet" href="${basePath}/assets/${mainCssFile}">` : ''}
	<script>
		// Patch hydrateRoot to use createRoot for static builds
		// This runs before the main module loads
		window.__TANSTACK_START_STATIC__ = true;
	</script>
</head>
<body>
	<div id="root"></div>
	<script type="module" src="${basePath}/assets/${mainJsFile}"></script>
</body>
</html>
`

writeFileSync(join(clientDir, 'index.html'), indexHtml)
console.log(`Generated index.html with main file: ${mainJsFile}`)
