/* 
  Tests for src/messaging/index.ts

  Framework note:
  - Prefers Vitest if available (vi.* globals), else falls back to Jest (jest.*).
  - No new dependencies introduced.
*/

type AnyFn = (...args: any[]) => any

// Lightweight runtime detection for mocking API (Vitest vs Jest)
const isVitest = typeof (globalThis as any).vi !== "undefined";
const mockApi = isVitest ? (globalThis as any).vi : (globalThis as any).jest;

// Provide minimal shims if running under one but importing types from the other
// This helps editors/linters but real runner will provide actual globals.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fn: (impl?: AnyFn) => AnyFn = mockApi?.fn ? mockApi.fn.bind(mockApi) : (() => {
  const f = (..._args: any[]) => undefined;
  (f as any).mock = { calls: [] };
  return f as AnyFn;
});

// Module factory return we want defineExtensionMessaging to yield
const sendMessageMock = fn(() => Promise.resolve("ok"));
const onMessageMock = fn(() => undefined);

// Mock @webext-core/messaging before importing the module under test
// Vitest: vi.mock('module', factory)
// Jest: jest.mock('module', factory)
if (mockApi?.mock) {
  mockApi.mock('@webext-core/messaging', () => {
    return {
      // defineExtensionMessaging is a generic in TS, but at runtime it's a function.
      defineExtensionMessaging: fn((options: object) => {
        // keep a reference to inspect the argument later
        (defineExtensionMessaging as any).__lastArgs = [options];
        return { sendMessage: sendMessageMock, onMessage: onMessageMock };
      }),
    };
  });
}

// To test re-exports from './protocol', we mock it to expose some runtime values
// Only for the duration of this test module's import of src/messaging/index
if (mockApi?.mock) {
  mockApi.mock('./protocol', () => {
    return {
      __esModule: true,
      // runtime export (should be re-exported by index)
      PROTOCOL_RUNTIME_CONST: 'RUNTIME_CONST',
      // type-only export is not represented at runtime
      // export type MessagingProtocol = { ... }  // Type-level only
    };
  });
}

// Import after mocks are in place
import { sendMessage, onMessage, PROTOCOL_RUNTIME_CONST } from './index';

// Use describe/it/test in a framework-agnostic way
const describeFn = (globalThis as any).describe ?? ((name: string, cb: () => void) => cb());
const itFn = (globalThis as any).it ?? (globalThis as any).test ?? ((name: string, cb: () => void | Promise<void>) => cb());
const expectFn = (globalThis as any).expect ?? ((value: any) => ({
  toBe: (v: any) => { if (value !== v) throw new Error(`Expected ${String(value)} to be ${String(v)}`); },
  toBeDefined: () => { if (typeof value === 'undefined') throw new Error('Expected value to be defined'); },
  toHaveBeenCalledTimes: (_n: number) => {},
  toHaveBeenCalledWith: (..._args: any[]) => {},
  toBeInstanceOf: (_ctor: any) => {},
}));

describeFn('src/messaging/index', () => {
  itFn('initializes defineExtensionMessaging exactly once with an empty options object', () => {
    // Access the mocked defineExtensionMessaging function from our mock module
    // We re-require the module factory used above:
    const messagingMod = require('@webext-core/messaging');
    const defineExtensionMessaging = messagingMod.defineExtensionMessaging;

    // For Vitest/Jest, use their matchers; else fallback to simple checks
    if (mockApi?.fn) {
      expect(defineExtensionMessaging).toHaveBeenCalledTimes(1);
      // Use stored args
      const lastArgs = (defineExtensionMessaging as any).__lastArgs || defineExtensionMessaging.mock.calls?.[0] || [];
      expect(lastArgs[0]).toEqual({});
    } else {
      // Fallback: ensure our stored args captured the empty object
      const lastArgs = (defineExtensionMessaging as any).__lastArgs;
      if (!lastArgs || JSON.stringify(lastArgs[0]) !== '{}') {
        throw new Error('defineExtensionMessaging was not called with {}');
      }
    }
  });

  itFn('re-exports sendMessage and onMessage from defineExtensionMessaging result', async () => {
    expectFn(typeof sendMessage).toBe('function');
    expectFn(typeof onMessage).toBe('function');

    // Ensure identity: functions should be the exact mocks returned by the factory
    expect(sendMessage).toBe(sendMessageMock);
    expect(onMessage).toBe(onMessageMock);

    // Call sendMessage to verify it is wired and returns as expected
    const res = await (sendMessage as AnyFn)('any-topic', { foo: 1 });
    expect(res).toBe('ok');
  });

  itFn('re-exports runtime values from ./protocol (e.g., PROTOCOL_RUNTIME_CONST)', () => {
    expectFn(PROTOCOL_RUNTIME_CONST).toBe('RUNTIME_CONST');
  });

  itFn('does not crash at import time when protocol only provides type exports', async () => {
    // Remock ./protocol to provide no runtime keys
    if (mockApi?.doMock || mockApi?.mock) {
      // Reset modules to allow re-import
      if ((mockApi as any).resetModules) (mockApi as any).resetModules();

      // In Jest: jest.doMock; in Vitest: vi.mock is idempotent
      if ((mockApi as any).doMock) {
        (mockApi as any).doMock('./protocol', () => ({ __esModule: true }), { virtual: true });
      } else if ((mockApi as any).mock) {
        (mockApi as any).mock('./protocol', () => ({ __esModule: true }));
      }

      // Re-import the module under test in an isolated context
      const fresh = await import('./index');
      expectFn(typeof fresh.sendMessage).toBe('function');
      expectFn(typeof fresh.onMessage).toBe('function');
      // PROTOCOL_RUNTIME_CONST should be undefined in this scenario
      expectFn((fresh as any).PROTOCOL_RUNTIME_CONST).toBeUndefined?.() ?? expectFn((fresh as any).PROTOCOL_RUNTIME_CONST).toBe(undefined);
    } else {
      // Fallback: nothing to assert besides that previous imports succeeded
      expectFn(typeof sendMessage).toBe('function');
      expectFn(typeof onMessage).toBe('function');
    }
  });

  itFn('sendMessage propagates errors from underlying implementation', async () => {
    // Reconfigure sendMessage mock to reject once
    if (mockApi?.fn && (sendMessageMock as any).mock?.RejectedValueOnce) {
      // If advanced jest/vi helpers exist, prefer them (not guaranteed)
      (sendMessageMock as any).mockRejectedValueOnce?.(new Error('network fail'));
    } else {
      // Manual override for one call
      let called = false;
      (sendMessage as AnyFn).mockImplementationOnce?.(() => {
        if (!called) {
          called = true;
          return Promise.reject(new Error('network fail'));
        }
        return Promise.resolve('ok');
      });
    }

    // Expect rejection on the next call
    try {
      await (sendMessage as AnyFn)('topic', { data: 1 });
      throw new Error('Expected sendMessage to reject');
    } catch (err: any) {
      expectFn(err).toBeInstanceOf?.(Error) ?? undefined;
      expectFn(err?.message).toBe('network fail');
    }
  });
});