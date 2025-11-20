import config from '@modular-house/config/eslint';
import globals from 'globals';

export default [
  ...config,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
];
