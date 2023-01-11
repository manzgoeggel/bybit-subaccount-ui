module.exports = {
	content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
	safelist: [
		{
			pattern: /(bg|text)-(red|green|orange|blue|purple|pink|lime|fuchsia|sky|teal|rose|indigo|emerald|yellow|cyan|violet|gray)/,
			variants: ["lg", "hover", "focus"],
		},
	],
	theme: {
		extend: {},
	},
	plugins: [require("@tailwindcss/forms")],
};
