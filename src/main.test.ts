/**
 * main.test.ts - Exhaustive Commentary on the Bootstrap Path
 *
 * PURPOSE:
 * This file documents how the main entrypoint wires together configuration loading and
 * GameManager construction. The comments are intentionally verbose so a reader can
 * understand the test flow without opening main.ts. We mock every dependency to avoid
 * running Konva or loading assets, and then assert the bootstrap sequence.
 *
 * WHY SO MUCH DETAIL?
 * - The bootstrap is tiny but critical: if config fails to load or the DOM container id
 *   changes, the whole game fails to start. The annotated steps make it obvious what
 *   assumptions are baked into main.ts.
 * - This mirrors the GameManager.ts documentation style: state the intent, list
 *   collaborators, and comment each line so nothing feels "magic".
 */

// Instruct Vitest to spin up a jsdom environment. Without this, document.body would be undefined.
// @vitest-environment jsdom

// Import Vitest helpers with inline explanations.
import { describe, it, expect, vi, beforeEach } from "vitest"; // describe/it = test structure, expect = assertions, vi = mocking, beforeEach = setup hook

// Create spies that will stand in for real implementations; they live at module scope so the mocks can reference them.
const loadConfigSpy = vi.fn().mockResolvedValue(undefined); // Tracks calls to ConfigManager.loadConfig; resolves immediately to mimic async behavior.
const gameManagerSpy = vi.fn(); // Records the GameManager constructor arguments so we can assert container usage.

// MOCK CONFIG MANAGER
// This mock is hoisted before main.ts imports run, ensuring main sees the fake implementation.
vi.mock("./config", () => ({
  // Provide only the methods main.ts consumes.
  ConfigManager: {
    // getInstance returns an object exposing loadConfig; the spy lets us count invocations.
    getInstance: () => ({
      loadConfig: loadConfigSpy, // Called by main.ts during bootstrap.
    }),
  },
}));

// MOCK GAME MANAGER
// We replace the heavy GameManager with a lightweight class that simply forwards its constructor arguments into a spy.
vi.mock("./GameManager", () => {
  class FakeGameManager {
    constructor(container: HTMLElement) {
      // Capture the DOM container so we can verify main.ts passed the correct element.
      gameManagerSpy(container);
    }
  }
  // Expose FakeGameManager under the same named export that main.ts expects.
  return { GameManager: FakeGameManager };
});

// Group the bootstrap assertions under a descriptive suite name.
describe("main.ts bootstrap", () => {
  // Reset shared state before each test so call counts do not leak between cases.
  beforeEach(() => {
    loadConfigSpy.mockReset(); // Ensure loadConfig call count starts at zero for each spec.
    gameManagerSpy.mockReset(); // Ensure GameManager constructor spy starts fresh.
    // Provide the DOM element that main.ts queries by id. Without this, the constructor would receive null.
    document.body.innerHTML = '<div id="game-container"></div>';
  });

  // Single happy-path test: ensure config loads first, then GameManager is created with the DOM container.
  it("loads config then creates GameManager with the DOM container", async () => {
    // Dynamically import main.ts. Because mocks are already registered, the import triggers bootstrap with fakes.
    await import("./main");
    // Wait one microtask tick to allow the async loadConfig call to resolve before we assert call order.
    await Promise.resolve();
    // Assert that the config loader was invoked exactly once.
    expect(loadConfigSpy).toHaveBeenCalledTimes(1);
    // Grab the container element that should have been passed into GameManager.
    const container = document.getElementById("game-container");
    // Verify the constructor spy saw that exact element, proving main wired things correctly.
    expect(gameManagerSpy).toHaveBeenCalledWith(container);
  });
});
