import appConfig from 'app.config'

export function Footer() {
	return (
		<footer className="flex h-[38px] items-center justify-center p-4 py-1 text-center text-xs">
			<span className="text-gray-400">
				©{new Date().getFullYear()} {appConfig.name}, Inc. All rights reserved.
			</span>
		</footer>
	)
}
