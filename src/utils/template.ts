// src/utils/template.ts

import { AGENT_CONTEXT_KEYS, type AgentContext } from '@/agent/types';

/**
 * Built-in replacement keys for template rendering
 * Automatically extracted from AgentContext interface to maintain DRY principle
 */
export const BUILTIN_REPLACEMENT_KEYS = AGENT_CONTEXT_KEYS;

/**
 * Type for built-in replacement keys
 * Automatically inferred from AgentContext interface keys
 */
type BuiltinReplacementKey = keyof AgentContext;

/**
 * Type for replacement mapper functions
 */
type ReplacementMapper = (context: AgentContext) => string;

/**
 * Generic mapper function that handles both required and optional fields
 */
function createFieldMapper<K extends BuiltinReplacementKey>(key: K): ReplacementMapper {
  return (context: AgentContext) => {
    const value = context[key];
    return value ?? ''; // Handle both undefined and null cases
  };
}

/**
 * Built-in replacement mappers that extract values from context
 * Automatically generated from AgentContext keys to eliminate duplication
 */
const REPLACEMENT_MAPPERS: Record<BuiltinReplacementKey, ReplacementMapper> = {} as Record<
  BuiltinReplacementKey,
  ReplacementMapper
>;

// Generate mappers for all builtin replacement keys
BUILTIN_REPLACEMENT_KEYS.forEach((key) => {
  REPLACEMENT_MAPPERS[key] = createFieldMapper(key);
});

/**
 * Render a template string with placeholders like `%{key}` using built-in replacements from context.
 * Performs a single pass with a global regex and uses a replacer callback
 * to avoid `$` interpolation issues in replacement strings.
 */
export function renderTemplate(template: string, context: AgentContext): string {
  if (!template) return '';

  return template.replace(/%\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    // Type-safe check for builtin replacement keys
    const builtinKey = BUILTIN_REPLACEMENT_KEYS.find((k) => k === key);
    const mapper = builtinKey ? REPLACEMENT_MAPPERS[builtinKey] : undefined;
    return mapper ? mapper(context) : match; // Keep original placeholder if key not found
  });
}
