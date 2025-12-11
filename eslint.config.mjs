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
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      import: (await import("eslint-plugin-import")).default,
    },
    settings: {
      // Simplified settings without TypeScript resolver to avoid compatibility issues
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      // === Import Rules ===
      // Disallow relative imports - force absolute imports with @/ prefix
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*", "./*"],
              message:
                "Use absolute imports with @/ prefix instead of relative imports. Example: '@/components/Button' instead of './Button'",
            },
          ],
        },
      ],
      "import/no-relative-packages": "error",
      // "import/no-relative-parent-imports": "error", // Disabled due to resolver conflicts
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          pathGroups: [
            {
              pattern: "@/components/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "@/lib/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          distinctGroup: false,
        },
      ],
      "import/no-duplicates": "error",

      // === Code Quality Rules ===
      "prefer-const": "error",
      // No unused variables (but allow unused function parameters with underscore prefix)
      "no-unused-vars": "off", // Turn off base rule
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // Require === instead of ==
      eqeqeq: ["error", "always"],
      // No unused expressions
      "no-unused-expressions": "error",
      // No duplicate object keys
      "no-dupe-keys": "error",
      // No unreachable code
      "no-unreachable": "error",

      // === React/JSX Rules ===
      // No unused React imports (handled by Next.js)
      "react/react-in-jsx-scope": "off",
      // Require key prop in lists
      "react/jsx-key": "error",
      // No duplicate props
      "react/jsx-no-duplicate-props": "error",
      // Boolean props should be explicit
      "react/jsx-boolean-value": ["error", "never"],
      // Self-closing tags when no children
      "react/self-closing-comp": "error",

      // === TypeScript Rules (basic ones without type checking) ===
      // Prefer interface over type when possible
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      // No explicit any
      "@typescript-eslint/no-explicit-any": "warn",
      // No non-null assertion
      "@typescript-eslint/no-non-null-assertion": "warn",

      // === Formatting Rules ===
      // Consistent quotes
      quotes: ["error", "double", { avoidEscape: true }],
      // Trailing commas for cleaner diffs
      "comma-dangle": ["error", "always-multiline"],
      // No trailing spaces
      "no-trailing-spaces": "error",
      // Consistent object curly spacing
      "object-curly-spacing": ["error", "always"],
      // Consistent array bracket spacing
      "array-bracket-spacing": ["error", "never"],
    },
  },
];

export default eslintConfig;
