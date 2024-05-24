module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    `plugin:@typescript-eslint/stylistic-type-checked`,
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    // 'plugin:react-hooks/recommended',
    'plugin:tailwindcss/recommended',
    'plugin:prettier/recommended'
  ],
  // ignore current directory but unignore all subdirectories
  ignorePatterns: ['dist', '/*', '!/**/*/', 'node_modules/*'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js'],
    }
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname
  },
  plugins: ['react', 'react-hooks', 'react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'tailwindcss/no-custom-classname': 'off',
    'prettier/prettier': 'warn'
  },
  settings: {
    react: {
      version: "detect"
    }
  }
};
