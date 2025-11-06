import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

export function ThemeToggle() {
	const { theme, setTheme, resolvedTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	// Avoid hydration mismatch
	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return (
			<Button variant="ghost" size="icon" className="h-9 w-9">
				<Sun className="h-4 w-4" />
			</Button>
		)
	}

	const isDark = resolvedTheme === 'dark'

	const toggleTheme = () => {
		if (theme === 'system') {
			// If system, toggle to the opposite of current resolved theme
			setTheme(isDark ? 'light' : 'dark')
		} else {
			// If user has set a preference, toggle between light/dark
			setTheme(isDark ? 'light' : 'dark')
		}
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9"
						onClick={toggleTheme}
						aria-label="Toggle theme"
					>
						{isDark ? (
							<Sun className="h-4 w-4" />
						) : (
							<Moon className="h-4 w-4" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>
						{theme === 'system'
							? `System (${isDark ? 'Dark' : 'Light'})`
							: isDark
								? 'Switch to light mode'
								: 'Switch to dark mode'}
					</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

