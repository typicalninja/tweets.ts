module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	darkMode: 'class',
	plugins: [require('daisyui')],
	corePlugins: {
		preflight: false,
	},
	daisyui: {
		themes: [
			'night',
            'light'
		],
	},
};