import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Custom Rules
  "eslint:recommended", // Add basic ESLint recommended rules
  "plugin:@typescript-eslint/recommended", // TypeScript-specific rules

  {
    rules: {
      // Custom ESLint Rules
      "no-console": ["warn", { allow: ["warn", "error"] }], // Warn on console logs, but allow `warn` and `error`
      "semi": ["error", "always"], // Enforce semicolons at the end of statements
      "quotes": ["error", "single"], // Enforce single quotes for strings
      "no-unused-vars": "warn", // Warn on unused variables
      "indent": ["error", 4], // Enforce 2 spaces for indentation
      "max-len": ["error", { code: 300 }], // Maximum line length of 100 characters
      "no-undef": "error", // Prevent the use of undeclared variables
      "react/react-in-jsx-scope": "off", // React 17+ doesn't require React in scope
      "jsx-a11y/anchor-is-valid": "off", // Disable anchor tag validation
      "@typescript-eslint/explicit-module-boundary-types": "off", // Disable explicit return types in TypeScript
    },
  },
];

export default eslintConfig;
