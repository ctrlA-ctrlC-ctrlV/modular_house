import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["dist", "node_modules", "coverage"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "@typescript-eslint": ts },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules
    }
  }
];