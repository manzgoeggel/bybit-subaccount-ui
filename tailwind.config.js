module.exports = {
	content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
	safelist: [
		{
			pattern: /(bg|text)-(red|green|orange|blue|purple|pink|lime|fuchsia|sky|teal|rose)/,
			variants: ["lg", "hover", "focus"],
		},
	],
	theme: {
		extend: {},
	},
	plugins: [require("@tailwindcss/forms")],
};
