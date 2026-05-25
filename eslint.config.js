import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended'],
  {
    files: ['**/*.rules'],
    rules: {
      // Add custom rule overrides if necessary
    }
  }
];
