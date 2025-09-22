# Project Overview

A browser extension that help user learn new languages by understanding webpage paragraphs.

Learning when reading.

Not only read the translation, but also learn the grammar, vocabulary, and usage.

## Key Dependencies

### Core Technologies

- **WXT** - Web extension framework for building cross-browser extensions
- **Vue.js 3** - Progressive JavaScript framework for building user interfaces
- **TypeScript** - Type-safe JavaScript development

### Frontend & UI

- **Vue Router** - Official router for Vue.js applications
- **Pinia** - Intuitive state management for Vue.js
- **Tailwind CSS + DaisyUI** - Utility-first CSS framework with component library
- **VueUse** - Collection of Vue composition utilities

### Browser Extension

- **@webext-core/messaging** - Simplified, type-safe wrapper around web extension messaging APIs

### Utilities

- **es-toolkit** - Modern JavaScript utility library, like `lodash` but with more modern features
- **Zod@4^** - TypeScript-first schema validation
- **LogTape** - Structured logging library for JavaScript
- **vue-markdown-render** - Markdown rendering component for Vue

### Test

- **Vitest** - Fast unit testing framework

## Code style guidelines

- Keep TypeScript strict mode
- Use English By Default: use English for logging, comments, ui copywriting by default
- Functional Patterns: Use functional patterns where possible

- Use `@/` alias imports instead of relative imports

- Use `#imports` module to import WXT APIs
- Use wxt unified `browser` API directly instead of `chrome`
- use `@wxt-dev/storage` to store extension data
- Prefer Tagged Template over Normal Function Call for Logging with `LogTape`

## Development 


```bash
bun install
bun dev

bun compile
```
