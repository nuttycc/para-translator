# Para-Translator

A browser extension that helps you learn new languages by understanding webpage paragraphs.

---

**Update 2025-09-09:**
- This README has been reviewed for accuracy and completeness.
- If you are running the dev server for web preview, use the following ports: 52022 or 59489. Make sure to set the dev server host to `0.0.0.0` and allow CORS/iframe access for local testing.
- For more details on the AI agent logic, see [`src/agent/`](src/agent/).
- For contributor and agent design details, see [`AGENTS.md`](AGENTS.md).
---


## Overview

Para-Translator is a browser extension designed to enhance your language learning experience while browsing the web. Instead of just providing translations, it offers comprehensive language learning features including:

- **Contextual Translation** - Get accurate translations of webpage content
- **Grammar Analysis** - Understand the grammatical structure of sentences
- **Vocabulary Building** - Learn new words with detailed explanations
- **Tabbed Interface** - Switch between translation, grammar, and vocabulary views

## Features

- 🌐 **Real-time Translation** - Translate webpage paragraphs instantly
- 📚 **Grammar Insights** - Detailed grammatical breakdown of sentences
- 📖 **Vocabulary Learning** - Word definitions, usage examples, and learning tips
- 🎨 **Clean UI** - User-friendly interface with tabbed navigation
- 🔄 **Multi-browser Support** - Works on Chrome, Firefox, and other Chromium-based browsers

## Technologies Used

- **[WXT](https://wxt.dev/)** - Web extension framework for building cross-browser extensions
- **[Vue.js 3](https://vuejs.org/)** - Progressive JavaScript framework for building user interfaces
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[DaisyUI](https://daisyui.com/)** - Component library for Tailwind CSS
- **[Pinia](https://pinia.vuejs.org/)** - Intuitive state management for Vue.js

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (package manager)

### Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/nuttycc/para-translator.git
   cd para-translator
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Load the extension in your browser:
   - **Chrome/Chromium**: Visit `chrome://extensions`, enable "Developer mode", and click "Load unpacked" then select the `.output/chrome-mv3` directory
   - **Firefox**: Visit `about:debugging`, click "This Firefox", then "Load Temporary Add-on" and select the `.output/firefox-mv2/manifest.json` file

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm dev:firefox` - Start development server for Firefox
- `pnpm build` - Build for production
- `pnpm zip` - Package extension for distribution
- `pnpm test` - Run tests
- `pnpm lint` - Lint code with oxlint
- `pnpm format` - Format code with prettier

## Project Structure

```
src/
├── agent/          # AI agent logic and types
├── components/     # Vue components
├── entrypoints/    # Extension entry points (popup, content, background)
├── messaging/      # Message handling between extension parts
├── stores/         # Pinia stores for state management
└── utils/          # Utility functions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [WXT](https://wxt.dev/) - The next-gen web extension framework
- UI powered by [Vue.js](https://vuejs.org/) and [Tailwind CSS](https://tailwindcss.com/)
