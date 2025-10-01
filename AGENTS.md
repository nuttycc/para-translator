# Project Overview

A browser extension that help user learn new languages by understanding paragraphs.

Learn when reading.

## Key Dependencies

### Core Technologies

- **WXT** - Web extension framework for building cross-browser extensions
- **Vue.js 3** - Progressive JavaScript framework for building user interfaces
- **TypeScript** - Type-safe JavaScript development

### Frontend & UI

- **Pinia** - Intuitive state management for Vue.js
- **Vue Router** - Official router for Vue.js applications
- **Tailwind CSS + DaisyUI** - Utility-first CSS framework with component library

### Browser Extension

- **@webext-core/messaging** - Simplified, type-safe wrapper around web extension messaging APIs

### Utilities

- **LogTape** - Structured logging library
- **VueUse** - Collection of Vue composition utilities
- **es-toolkit** - Modern JavaScript utility library, like `lodash` but with more modern features

### Test

- **Vitest** - Fast unit testing framework

## Code style guidelines

- Keep TypeScript strict mode
- Use English By Default: use English for logging, comments, ui copywriting by default
- Functional Patterns: Use functional patterns where possible

- Use `#imports` module to import WXT APIs
- use `@wxt-dev/storage` to store extension data
- Use wxt unified `browser` API directly instead of `chrome`
- Prefer Tagged Template over Normal Function Call for Logging with `LogTape`

## Development 

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Type checking (without emit)
bun run compile

# Build for production
bun run build

# Zip for distribution
bun run zip

# Test
bun run test
``` 
