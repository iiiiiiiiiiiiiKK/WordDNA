/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1440px',
    },
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        text: 'var(--text)',
        muted: 'var(--text-muted)',
        border: 'var(--border)',
        root: 'var(--color-root)',
        prefix: 'var(--color-prefix)',
        suffix: 'var(--color-suffix)',
        word: 'var(--color-word)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warn: 'var(--color-warn)',
        // Rootly 品牌扩展
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        onaccent: 'var(--on-accent)',
        ink: 'var(--ink)',
        paper: 'var(--paper)',
        'btn-bg': 'var(--btn-bg)',
        'btn-fg': 'var(--btn-fg)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Inter',
          'Roboto',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        // 巨型英文单词 / 编辑部标题（方案 A）
        display: [
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        // 词源实验室衬线（方案 B 深色页）
        lab: ['Georgia', '"Times New Roman"', '"Songti SC"', '"SimSun"', 'serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        hard: '4px 4px 0 0 var(--ink)',
        'hard-sm': '3px 3px 0 0 var(--ink)',
        'hard-lg': '6px 6px 0 0 var(--ink)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'flip-in': {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        'grow-x': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'slide-up': 'slide-up 0.25s ease-out both',
        'pop-in': 'pop-in 0.2s ease-out both',
        'flip-in': 'flip-in 0.28s ease-out both',
        'grow-x': 'grow-x 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
