// src/utils/template.ts

import type { AgentContext } from '@/agent/types';

/**
 * Built-in replacement keys for template rendering
 */
export const BUILTIN_REPLACEMENT_KEYS = [
  'sourceText',
  'sourceLanguage',
  'targetLanguage',
  'siteTitle',
  'siteUrl',
] as const;

/**
 * Type for built-in replacement keys
 */
type BuiltinReplacementKey = (typeof BUILTIN_REPLACEMENT_KEYS)[number];

/**
 * Type for replacement mapper functions
 */
type ReplacementMapper = (context: AgentContext) => string;

/**
 * Built-in replacement mappers that extract values from context
 */
const REPLACEMENT_MAPPERS: Record<BuiltinReplacementKey, ReplacementMapper> = {
  sourceText: (context) => context.sourceText,
  sourceLanguage: (context) => context.sourceLanguage || '',
  targetLanguage: (context) => context.targetLanguage,
  siteTitle: (context) => context.siteTitle || '',
  siteUrl: (context) => context.siteUrl || '',
};

/**
 * Render a template string with placeholders like `%{key}` using built-in replacements from context.
 * Performs a single pass with a global regex and uses a replacer callback
 * to avoid `$` interpolation issues in replacement strings.
 */
export function renderTemplate(template: string, context: AgentContext): string {
  if (!template) return '';

  return template.replace(/%\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    const mapper = REPLACEMENT_MAPPERS[key as BuiltinReplacementKey];
    return mapper ? mapper(context) : match; // Keep original placeholder if key not found
  });
}
