# @firm/config-eslint

Shared ESLint configuration for the Firm platform. Provides consistent linting rules and code quality standards across all packages.

## Features

- **Consistent Code Quality**: Standardized linting rules for all projects
- **Modern JavaScript**: Full support for ES2022+ features
- **TypeScript Integration**: Seamless TypeScript linting with type-aware rules
- **Security Rules**: Built-in security vulnerability detection
- **Performance Optimized**: Fast linting with caching and parallel processing

## Installation

```bash
pnpm add -D @firm/config-eslint
```

## Usage

### Basic Setup

Create an `.eslintrc.json` file in your project root:

```json
{
  "extends": ["@firm/config-eslint"]
}
```

### TypeScript Projects

For TypeScript projects:

```json
{
  "extends": ["@firm/config-eslint"],
  "parserOptions": {
    "project": "./tsconfig.json"
  }
}
```

### Next.js Projects

For Next.js applications:

```json
{
  "extends": [
    "@firm/config-eslint",
    "next/core-web-vitals"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  }
}
```

## Included Rules

### Code Quality

- **Consistent Formatting**: Enforced code style and formatting
- **Best Practices**: Industry-standard coding practices
- **Error Prevention**: Rules that catch common bugs
- **Maintainability**: Code that's easy to understand and modify

### Security

- **Security Vulnerabilities**: Detection of common security issues
- **Dependency Security**: Warning about vulnerable dependencies
- **Code Injection**: Prevention of code injection attacks
- **Data Exposure**: Protection against sensitive data exposure

### Performance

- **Performance Issues**: Detection of performance bottlenecks
- **Memory Leaks**: Prevention of memory leak patterns
- **Bundle Size**: Optimization for smaller bundle sizes
- **Runtime Efficiency**: Efficient code patterns

## Configuration Options

### Override Rules

Customize specific rules for your project:

```json
{
  "extends": ["@firm/config-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "prefer-const": "error",
    "no-console": "off"
  }
}
```

### Environment Settings

Specify environments for your project:

```json
{
  "extends": ["@firm/config-eslint"],
  "env": {
    "browser": true,
    "node": true,
    "es2022": true
  }
}
```

### Global Variables

Define global variables:

```json
{
  "extends": ["@firm/config-eslint"],
  "globals": {
    "process": "readonly",
    "Buffer": "readonly"
  }
}
```

## Examples

### Package Configuration

```json
{
  "name": "@firm/my-package",
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  },
  "devDependencies": {
    "@firm/config-eslint": "workspace:*"
  }
}
```

### Application Configuration

```json
{
  "extends": ["@firm/config-eslint"],
  "parserOptions": {
    "project": "./tsconfig.json",
    "tsconfigRootDir": __dirname
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  }
}
```

## Integration with IDEs

### VS Code

Install the ESLint extension and add to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### WebStorm

Enable ESLint integration in Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint.

## Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "lint:check": "oxlint --max-warnings 0"
  }
}
```

## Pre-commit Hooks

Integrate with husky for pre-commit linting:

```bash
# .husky/pre-commit
pnpm lint
```

Or use lint-staged:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": "oxlint --fix"
  }
}
```

## Performance

### Caching

ESLint automatically caches results for faster subsequent runs:

```bash
# Clear cache if needed
pnpm lint --cache-location ./node_modules/.cache/eslint --no-cache
```

### Parallel Processing

Run ESLint on multiple files in parallel:

```bash
# Use all available CPU cores
pnpm lint --max-warnings 0 --quiet
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Ensure `parserOptions.project` points to your `tsconfig.json`
2. **Import Errors**: Check that all dependencies are properly installed
3. **Performance Issues**: Use caching and limit file scope with `.eslintignore`

### Ignore Files

Create `.eslintignore` to exclude files:

```text
node_modules/
dist/
build/
coverage/
*.min.js
```

## Best Practices

1. **Run on Save**: Configure your IDE to auto-fix on save
2. **Pre-commit Hooks**: Ensure clean commits with pre-commit linting
3. **CI Integration**: Run linting in CI/CD pipelines
4. **Gradual Adoption**: Start with warnings, then enforce as errors

## Compatibility

- **ESLint**: Latest version
- **TypeScript**: 5.6.3+
- **Node.js**: 18.0+
- **Browsers**: Modern browsers

## License

Internal use only - restricted access
