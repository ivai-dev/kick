import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import kickoff from "./packages/kit/eslint/index.js";

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/dist-artifact/**", "**/test-results/**", "**/playwright-report/**", "**/.vite/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}", "**/scripts/**", "**/e2e/**", "**/*.config.ts", "**/*.test.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // shadcn copy-ins export variants next to components; relax for packages/ui.
    files: ["packages/ui/src/**/*.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  ...kickoff,
);
