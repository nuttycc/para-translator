/**
 * MessagingProtocol contract tests.
 *
 * Framework: Vitest (expect/describe/it, expectTypeOf)
 * If your project uses Jest, replace vitest imports accordingly and remove expectTypeOf or use tsd.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
// Prefer importing the type from the source module if it exists.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { MessagingProtocol } from './protocol'; // adjust if your path alias '@/messaging/protocol' is enabled
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { AgentContext, AgentResponse } from '@/agent/types';

describe('MessagingProtocol contract', () => {
  let sampleContext: AgentContext;

  beforeEach(() => {
    // Create a minimal AgentContext. Adjust fields if your AgentContext requires more.
    // We avoid depending on external services by keeping values trivial.
    // Cast is only for non-essential unknown fields; do not cast away required fields.
    sampleContext = {
      // Fill in realistic minimal fields if known; otherwise keep as empty object and cast.
      // @ts-expect-error - replace with actual shape if AgentContext has required keys
    } as AgentContext;
  });

  it('should allow an implementation with a translate(context) method returning a Promise<AgentResponse>', async () => {
    const impl: MessagingProtocol = {
      translate: vi.fn(async (ctx: AgentContext): Promise<AgentResponse> => {
        // Basic fake agent response
        const response: AgentResponse = {
          // Provide minimal valid shape; adjust keys according to your actual AgentResponse definition.
          // @ts-expect-error - replace with actual fields if AgentResponse has required keys
          ok: true,
          data: { echo: !!ctx },
        } as unknown as AgentResponse;
        return response;
      }),
    };

    // Runtime: returns a Promise that resolves to an object (AgentResponse)
    const result = await impl.translate(sampleContext);
    expect(impl.translate).toHaveBeenCalledTimes(1);
    expect(impl.translate).toHaveBeenCalledWith(sampleContext);
    expect(result).toBeDefined();
    // We can't assert strict type fields at runtime due to erasure, but we can check common surface patterns
    expect(typeof result).toBe('object');
  });

  it('should reject when implementation throws (error propagation)', async () => {
    const impl: MessagingProtocol = {
      translate: vi.fn(async () => {
        throw new Error('translate failure');
      }),
    };

    await expect(impl.translate(sampleContext)).rejects.toThrow('translate failure');
    expect(impl.translate).toHaveBeenCalledTimes(1);
  });

  it('should handle unexpected inputs gracefully when implementation defends against bad context', async () => {
    // While type system prevents bad inputs at compile time, runtime may still pass null/undefined.
    const impl: MessagingProtocol = {
      translate: vi.fn(async (ctx: AgentContext) => {
        if (ctx == null) {
          // Simulate defensive behavior
          throw new TypeError('context is required');
        }
        // @ts-expect-error - replace with valid AgentResponse construction if required
        return { ok: true } as AgentResponse;
      }),
    };

    // @ts-expect-error - simulate runtime bad input
    await expect(impl.translate(null)).rejects.toThrow(/context is required/i);
    // Normal call still works
    await expect(impl.translate(sampleContext)).resolves.toBeDefined();
    expect(impl.translate).toHaveBeenCalledTimes(2);
  });

  it('allows implementations to be asynchronous and time-consuming', async () => {
    vi.useFakeTimers();
    const impl: MessagingProtocol = {
      translate: vi.fn(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        // @ts-expect-error - replace with valid AgentResponse
        return { ok: true } as AgentResponse;
      }),
    };

    const p = impl.translate(sampleContext);
    // Fast-forward time to ensure async timers resolve deterministically
    vi.advanceTimersByTime(50);
    await expect(p).resolves.toBeDefined();

    vi.useRealTimers();
  });
});