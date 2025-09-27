import { describe, expect, it } from 'vitest';

import type { AgentContext } from '@/agent/types';

import { renderTemplate } from '../template';

describe('renderTemplate', () => {
  const context: AgentContext = {
    sourceText: 'Hello world',
    sourceLanguage: 'en',
    targetLanguage: 'zh-CN',
    siteTitle: 'Test Site',
    siteUrl: 'https://example.com',
    siteDescription: 'A test website',
  };

  it('should correctly replace placeholders', () => {
    const template = 'translate %{sourceText} to %{targetLanguage}';
    const result = renderTemplate(template, context);
    expect(result).toBe('translate Hello world to zh-CN');
  });

  it('should return original string if key does not exist', () => {
    const template = 'translate %{sourceText} to %{unknown}';
    const result = renderTemplate(template, context);
    expect(result).toBe('translate Hello world to %{unknown}');
  });
});
