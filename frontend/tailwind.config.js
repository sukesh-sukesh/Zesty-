/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#FC8019',
                    hover: '#E86E0F'
                },
                secondary: {
                    DEFAULT: '#1F2937'
                },
                accent: {
                    DEFAULT: '#10B981'
                },
                base: {
                    bg: '#F8FAFC',
                    card: '#FFFFFF',
                    border: '#E5E7EB',
                    text: '#111827',
                    secondaryText: '#6B7280'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
