// Default config for AI providers, can be overridden by the user.

// Centralized provider definitions
export const PROVIDERS = [
  'openai',
  'gemini',
  'claude',
  'deepseek',
] as const;

export type Provider = typeof PROVIDERS[number];

export const BASE_URLS: Record<Provider, string> = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1',
  claude: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
};

export const PROVIDER_ICONS: Partial<Record<Provider, string>> = {
  openai: 'https://openai.com/favicon.ico',
  gemini: 'https://ai.google.dev/static/images/favicon.png',
  claude: 'https://www.anthropic.com/favicon.ico',
  deepseek: 'https://www.deepseek.com/favicon.ico',
};

export interface AIProviderConfig {
  provider: Provider;
  baseUrl: string;
  apiKey?: string;
  model: string;
  modelsList?: string[];
  providerIcon?: string;
}

/**
 * Get the default API base URL for a given provider.
 * @param provider The AI provider key.
 * @returns The provider's REST base URL.
 */
export function resolveBaseUrl(provider: Provider): string {
  return BASE_URLS[provider];
}

/**
 * Get the recommended favicon/icon URL for a given provider.
 * @param provider The AI provider key.
 * @returns A URL string if known; otherwise undefined.
 */
export function resolveProviderIcon(provider: Provider): string | undefined {
  return PROVIDER_ICONS[provider];
}

// Minimal default config. Do not hardcode sensitive keys here.
const defaultAIProviderConfig: AIProviderConfig = {
  provider: 'openai',
  baseUrl: BASE_URLS.openai,
  model: 'gpt-4o',
  modelsList: ['gpt-4o', 'gpt-4o-mini'],
  providerIcon: PROVIDER_ICONS.openai,
};

export default defaultAIProviderConfig;
