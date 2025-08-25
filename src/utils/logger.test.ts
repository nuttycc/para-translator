/**
 * Unit tests for src/utils/logger.ts
 *
 * Framework: Jest or Vitest (auto-detected at runtime).
 * - Uses global describe/it/expect and picks vi or jest for mocking APIs.
 * - No new dependencies introduced.
 */

 /* eslint-disable @typescript-eslint/no-explicit-any */

const g: any = globalThis as any;
const mocker: any = g?.vi ?? g?.jest;
if (!mocker) {
  throw new Error("Expected Vitest (vi) or Jest (jest) globals to be available.");
}

// Shared mock fns exposed to the module under test via module mocking.
// Implementations are (re)set before each test.
const fns: any = {
  configureSync: mocker.fn(),
  defaultConsoleFormatter: Symbol("defaultConsoleFormatter"),
  getConsoleSink: mocker.fn(),
  getLogger: mocker.fn(),
};

// Hoisted mock so that imports of the SUT see this mocked module.
mocker.mock("@logtape/logtape", () => fns);

// Captures the most recent sink object returned by getConsoleSink for identity assertions.
let lastConsoleSink: any = null;

// Establish default mock implementations (reset in beforeEach).
function setDefaultImpls() {
  fns.configureSync.mockImplementation(() => {});
  fns.getConsoleSink.mockImplementation(({ formatter }: any) => {
    lastConsoleSink = { sinkType: "console", formatter };
    return lastConsoleSink;
  });
  fns.getLogger.mockImplementation((category: any) => ({ __logger__: true, category }));
}

// Utility to reset module registry and import a fresh copy of the SUT.
// The tests live next to the implementation file and import "./logger".
async function importFresh() {
  if (typeof mocker.resetModules === "function") {
    mocker.resetModules();
  }
  // Dynamic import ensures we get a fresh instance after resetModules.
  return await import("./logger");
}

// Best-effort cleanup of mocks across jest/vitest without assuming one or the other.
function clearAll() {
  if (typeof mocker.clearAllMocks === "function") mocker.clearAllMocks();
  if (typeof mocker.resetAllMocks === "function") mocker.resetAllMocks();
  if (typeof mocker.restoreAllMocks === "function") mocker.restoreAllMocks();
}

beforeEach(() => {
  clearAll();
  // Reset individual mock fns and default implementations
  for (const key of ["configureSync", "getConsoleSink", "getLogger"]) {
    if (typeof fns[key]?.mockReset === "function") fns[key].mockReset();
  }
  lastConsoleSink = null;
  setDefaultImpls();
});

describe("logger setup/configuration", () => {
  it("calls configureSync with console sink and debug logger on first import", async () => {
    await importFresh(); // triggers top-level configureSync via mocked module

    // getConsoleSink should be called once with defaultConsoleFormatter
    expect(fns.getConsoleSink).toHaveBeenCalledTimes(1);
    expect(fns.getConsoleSink).toHaveBeenCalledWith({ formatter: fns.defaultConsoleFormatter });

    // configureSync should be called with expected shape/values
    expect(fns.configureSync).toHaveBeenCalledTimes(1);
    const cfg = fns.configureSync.mock.calls[0][0];

    expect(cfg).toBeDefined();
    expect(cfg.sinks).toBeDefined();
    expect(cfg.loggers).toBeDefined();

    // The console sink in config should be exactly what getConsoleSink returned.
    expect(cfg.sinks.console).toBe(lastConsoleSink);
    // And it should carry the formatter through.
    expect(cfg.sinks.console).toEqual(expect.objectContaining({ formatter: fns.defaultConsoleFormatter }));

    // Logger configuration for "my-app" at debug with the console sink
    expect(Array.isArray(cfg.loggers)).toBe(true);
    expect(cfg.loggers[0]).toEqual({
      category: "my-app",
      lowestLevel: "debug",
      sinks: ["console"],
    });
  });

  it("does not re-run configureSync on subsequent cached imports", async () => {
    await importFresh();
    // Import again WITHOUT resetting modules; should be cached
    await import("./logger");

    // configureSync should only have run during the fresh import
    expect(fns.configureSync).toHaveBeenCalledTimes(1);
  });
});

describe("createLogger()", () => {
  it('returns a logger for ["my-app"] when called with no args', async () => {
    const { createLogger } = await importFresh();

    const result = createLogger();
    expect(fns.getLogger).toHaveBeenCalledTimes(1);
    expect(fns.getLogger).toHaveBeenCalledWith(["my-app"]);
    expect(result).toEqual({ __logger__: true, category: ["my-app"] });
  });

  it('prefixes "my-app" and forwards category parts in order', async () => {
    const { createLogger } = await importFresh();

    const result = createLogger("feature", "sub");
    expect(fns.getLogger).toHaveBeenCalledTimes(1);
    expect(fns.getLogger).toHaveBeenCalledWith(["my-app", "feature", "sub"]);
    expect(result).toEqual({ __logger__: true, category: ["my-app", "feature", "sub"] });
  });

  it("propagates errors thrown by getLogger", async () => {
    const { createLogger } = await importFresh();

    const boom = new Error("boom");
    fns.getLogger.mockImplementationOnce(() => {
      throw boom;
    });

    expect(() => createLogger("x")).toThrow(boom);
  });

  it("forwards unexpected non-string values as-is (runtime behavior)", async () => {
    const { createLogger } = await importFresh();

    // @ts-expect-error: intentionally passing non-strings to test runtime forwarding
    createLogger("alpha", undefined, null as any, "omega");
    expect(fns.getLogger).toHaveBeenCalledWith(["my-app", "alpha", undefined, null, "omega"]);
  });
});