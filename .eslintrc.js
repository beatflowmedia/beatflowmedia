module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:storybook/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // Disable the adjacent JSX elements rule that's causing false positives
    'react/jsx-no-adjacent-inline-elements': 'off'
  }
};
