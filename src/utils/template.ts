import { AGENT_CONTEXT_KEYS } from '@/agent/types';

import type { AgentContext } from '@/agent/types';

/**
 * All available replacement keys for template rendering.
 * Automatically derived from AgentContext to ensure consistency.
 */
export const BUILTIN_REPLACEMENT_KEYS = AGENT_CONTEXT_KEYS;

/**
 * Type representing any built-in replacement key from AgentContext.
 */
type BuiltinReplacementKey = keyof AgentContext;

/**
 * Function type for mapping context values to strings.
 */
type ReplacementMapper = (context: AgentContext) => string;

/**
 * Creates a mapper function that safely extracts a field value from context.
 * Handles both required and optional fields by returning empty string for null/undefined.
 */
function createFieldMapper<K extends BuiltinReplacementKey>(key: K): ReplacementMapper {
  return (context: AgentContext) => {
    const value = context[key];
    return value ?? ''; // Handle both undefined and null cases
  };
}

/**
 * Registry of mapper functions for all built-in replacement keys.
 * Automatically populated to eliminate manual duplication.
 */
const REPLACEMENT_MAPPERS: Record<BuiltinReplacementKey, ReplacementMapper> = {} as Record<
  BuiltinReplacementKey,
  ReplacementMapper
>;

// Populate mappers for all available replacement keys
BUILTIN_REPLACEMENT_KEYS.forEach((key) => {
  REPLACEMENT_MAPPERS[key] = createFieldMapper(key);
});

/**
 * Replaces placeholders like `%{key}` in a template string with values from context.
 * Uses a single regex pass with callback replacement to avoid interpolation conflicts.
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
