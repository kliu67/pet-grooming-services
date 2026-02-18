// .eslintrc.js
module.exports = {
    root: true,
    env: {
        node: true,       // Node.js globals
        es2021: true,     // Modern JS features
        jest: true,       // Jest testing globals (describe, it, expect)
    },
    parserOptions: {
        ecmaVersion: 2021, // Allows modern JS syntax
        sourceType: 'module', // Use ES modules
    },
    extends: [
        'eslint:recommended',   // Basic ESLint rules
        'plugin:node/recommended', // Node.js-specific rules
    ],
    plugins: [
        'node', // For Node.js linting
    ],
    rules: {
        // Custom rules you want
        'no-console': 'off',       // Allow console.log
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignore unused args starting with _
    },
};