const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  {
    ignores: ['dist/*', 'node_modules/*', 'vigil_reference/*'],
  },
];
