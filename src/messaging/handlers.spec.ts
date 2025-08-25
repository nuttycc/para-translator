import { afterEach, beforeEach, describe, expect, it } from "vitest"; // For Vitest environments
// For Jest environments, the global functions (describe, it, expect) are already available.
// We also add lightweight shims so the file can run under either runner without extra deps.

let isVitest = false;
try {
  // @ts-ignore
  isVitest = typeof vi !== "undefined";
} catch { /* noop */ }

// Provide jest-like or vitest-like globals conditionally
// @ts-ignore
const mockFn = isVitest ? (globalThis as any).vi.fn : ((globalThis as any).jest ? (globalThis as any).jest.fn : undefined);
// @ts-ignore
const spyOn = isVitest ? (globalThis as any).vi.spyOn : ((globalThis as any).jest ? (globalThis as any).jest.spyOn : undefined);
// @ts-ignore
const resetAllMocks = isVitest ? (globalThis as any).vi.resetAllMocks : ((globalThis as any).jest ? (globalThis as any).jest.resetAllMocks : undefined);

// IMPORTANT: We are importing implementation from a file named *.test.ts (as provided).
// This is atypical, but we will treat it as a module under test.
import { handleTranslate } from "./handlers.test";

// Mock the module that provides getLangAgent
// For Vitest
// @ts-ignore
if (typeof vi !== "undefined") {
  // @ts-ignore
  vi.mock("@/agent/agent", () => {
    return {
      getLangAgent: mockFn()
    };
  });
} else if ((globalThis as any).jest) {
  // For Jest
  // @ts-ignore
  jest.mock("@/agent/agent", () => ({
    getLangAgent: mockFn()
  }));
}

// After mocking, import the symbol to control it
// eslint-disable-next-line @typescript-eslint/no-var-requires
const agentModule = require("@/agent/agent") as { getLangAgent: jest.Mock | ((...args: any[]) => any) };

// Utility to build a fake langAgent with a controllable perform method
const buildFakeLangAgent = (impl?: (action: string, ctx: any) => any) => {
  return {
    perform: mockFn().mockImplementation(impl ?? ((action: string, ctx: any) => Promise.resolve({ ok: true, action, ctx })))
  };
};

describe("handleTranslate", () => {
  beforeEach(() => {
    resetAllMocks && resetAllMocks();
  });

  afterEach(() => {
    resetAllMocks && resetAllMocks();
  });

  it("calls getLangAgent once and invokes perform('translate', context) with the provided context (happy path)", async () => {
    const context: any = { text: "Hello", targetLang: "es" };
    const fakeAgent = buildFakeLangAgent((_action, _ctx) => Promise.resolve({ ok: true, translated: "Hola" }));

    (agentModule.getLangAgent as any).mockResolvedValueOnce(fakeAgent);

    const result = await handleTranslate(context);

    expect(agentModule.getLangAgent).toHaveBeenCalledTimes(1);
    expect(fakeAgent.perform).toHaveBeenCalledTimes(1);
    expect(fakeAgent.perform).toHaveBeenCalledWith("translate", context);
    expect(result).toEqual({ ok: true, translated: "Hola" });
  });

  it("propagates errors when getLangAgent rejects", async () => {
    const context: any = { text: "Hello", targetLang: "de" };
    const failure = new Error("Agent init failed");
    (agentModule.getLangAgent as any).mockRejectedValueOnce(failure);

    await expect(handleTranslate(context)).rejects.toThrow("Agent init failed");
    expect(agentModule.getLangAgent).toHaveBeenCalledTimes(1);
  });

  it("propagates errors when langAgent.perform rejects", async () => {
    const context: any = { text: "Hi", targetLang: "fr" };
    const fakeAgent = buildFakeLangAgent((_action, _ctx) => Promise.reject(new Error("perform failed")));
    (agentModule.getLangAgent as any).mockResolvedValueOnce(fakeAgent);

    await expect(handleTranslate(context)).rejects.toThrow("perform failed");
    expect(fakeAgent.perform).toHaveBeenCalledWith("translate", context);
  });

  it("passes through arbitrary context objects (edge: empty object)", async () => {
    const context: any = {};
    const fakeAgent = buildFakeLangAgent((_action, _ctx) => Promise.resolve({ ok: true, translated: "" }));
    (agentModule.getLangAgent as any).mockResolvedValueOnce(fakeAgent);

    const result = await handleTranslate(context);

    expect(fakeAgent.perform).toHaveBeenCalledWith("translate", context);
    expect(result).toEqual({ ok: true, translated: "" });
  });

  it("handles non-standard context types (edge: null) by passing it along as-is", async () => {
    const context: any = null;
    const fakeAgent = buildFakeLangAgent((_action, _ctx) => Promise.resolve({ ok: true, translated: null }));
    (agentModule.getLangAgent as any).mockResolvedValueOnce(fakeAgent);

    const result = await handleTranslate(context as any);

    expect(fakeAgent.perform).toHaveBeenCalledWith("translate", context);
    expect(result).toEqual({ ok: true, translated: null });
  });

  it("handles undefined context (edge) gracefully by still invoking perform", async () => {
    const fakeAgent = buildFakeLangAgent((_action, _ctx) => Promise.resolve({ ok: true, translated: undefined }));
    (agentModule.getLangAgent as any).mockResolvedValueOnce(fakeAgent);

    const result = await handleTranslate(undefined as any);

    expect(fakeAgent.perform).toHaveBeenCalledWith("translate", undefined);
    expect(result).toEqual({ ok: true, translated: undefined });
  });

  it("ensures the action passed to perform is exactly 'translate'", async () => {
    const context: any = { text: "Howdy", targetLang: "en" };
    const fakeAgent = buildFakeLangAgent((_action, _ctx) => Promise.resolve({ ok: true, translated: "Howdy" }));
    (agentModule.getLangAgent as any).mockResolvedValueOnce(fakeAgent);

    await handleTranslate(context);

    const call = (fakeAgent.perform as any).mock.calls[0];
    expect(call[0]).toBe("translate");
  });
});