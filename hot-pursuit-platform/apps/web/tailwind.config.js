/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b0e",
        "bg-soft": "#131318",
        panel: "rgba(255,255,255,0.045)",
        "panel-hover": "rgba(255,255,255,0.08)",
        line: "rgba(255,255,255,0.09)",
        accent: "#ff2d3f",
        "accent-dark": "#b31224",
        "accent-glow": "rgba(255,45,63,0.35)",
        ink: "#f2f2f5",
        mute: "#9a9aa5",
        gold: "#ffc24b",
        on: "#3ddc84",
      },
      fontFamily: {
        display: ["Rajdhani", '"Segoe UI"', "system-ui", "sans-serif"],
        body: ["Rajdhani", '"Segoe UI"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "16px",
        sm: "10px",
        md: "14px",
        lg: "20px",
      },
      boxShadow: {
        "accent-glow": "0 0 24px rgba(255,45,63,0.35)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
