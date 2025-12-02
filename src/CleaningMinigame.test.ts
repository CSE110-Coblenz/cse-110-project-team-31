/**
 * This file contains unit tests for the CleaningMinigame class.
 * Similar to the BakingMinigame tests, this file uses Vitest and extensive mocking
 * to test the component in isolation. It verifies the game's logic, including the
 * play/skip choice, gameplay flow, timer, and completion conditions.
 *
 * MOCKING STRATEGY:
 * - Konva.js: The 'konva' library is fully mocked to simulate canvas objects without a DOM.
 *   The state of all created objects (groups, rects, text) is tracked in `konvaState`.
 * - UI Components (ExitButton, InfoButton): Mocked to verify they are instantiated and,
 *   in the case of ExitButton, to capture and test its callback.
 * - ConfigManager: Mocked to provide a fixed `cleaningTime` for predictable test runs.
 * - Globals (window, Math.random): `window` is stubbed to control timers and event listeners.
 *   `Math.random` is mocked to control the generation of math problems, making tests deterministic.
 *   A `randomQueue` is used to supply a sequence of predictable "random" numbers.
 */

// Import testing utilities from Vitest.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import the class to be tested.
import { CleaningMinigame } from "./CleaningMinigame";

/**
 * A fake implementation of a Konva Stage, providing the minimal API
 * required by the CleaningMinigame for testing. It simulates methods like
 * `width()`, `height()`, and `container()`.
 */
class FakeStage {
  private readonly widthValue: number;
  private readonly heightValue: number;
  // Simulates the stage's DOM container to test cursor style changes.
  private readonly containerElement = { style: { cursor: "default" } };

  constructor(widthValue: number, heightValue: number) {
    this.widthValue = widthValue;
    this.heightValue = heightValue;
  }

  width() {
    return this.widthValue;
  }

  height() {
    return this.heightValue;
  }

  container() {
    return this.containerElement;
  }
}

/**
 * A fake implementation of a Konva Layer. It tracks nodes added to it
 * and provides mock functions for drawing methods.
 */
class FakeLayer {
  // Records all nodes passed to the `add` method.
  readonly addedNodes: unknown[] = [];
  // Mocks for drawing methods to check if they are called.
  readonly draw = vi.fn();
  readonly batchDraw = vi.fn();

  add(node: unknown) {
    this.addedNodes.push(node);
  }
}

// Type definition for an entry in the mocked Konva rects state.
type RectEntry = {
  node: any;
  config: Record<string, unknown>;
  fillHistory: string[];
  trigger: (event: string, evt?: { cancelBubble?: boolean }) => void;
};

/**
 * Hoisted state object (`vi.hoisted`) to track the state of all created mock Konva objects.
 * This object is accessible within the `vi.mock("konva", ...)` block, allowing the fake
 * classes to report their state and tests to assert against it.
 */
const konvaState = vi.hoisted(() => ({
  // Tracks all created FakeGroup instances.
  groups: [] as Array<{
    config: Record<string, unknown>;
    visible: () => boolean;
    trigger: (event: string, evt?: { cancelBubble?: boolean }) => void;
    handlers: Map<string, (evt?: { cancelBubble?: boolean }) => void>;
    children: unknown[];
  }>,
  // Tracks all created FakeRect instances.
  rects: [] as RectEntry[],
  // Tracks all created FakeText instances.
  texts: [] as Array<{ config: Record<string, unknown> }>,
}));

/**
 * A hoisted queue of numbers to be returned by the mocked `Math.random`.
 * This allows tests to control the sequence of random numbers used in problem generation,
 * making the tests deterministic and repeatable.
 */
const randomQueue = vi.hoisted(() => [] as number[]);

// Mock the ConfigManager module to provide a fixed configuration.
vi.mock("./config", () => ({
  ConfigManager: {
    getInstance: () => ({
      getConfig: () => ({
        // Provide a fixed time for the cleaning minigame.
        cleaningTime: 15,
      }),
    }),
  },
}));

/**
 * Hoisted state object for the mocked ExitButton. This allows the test
 * to access the callback function passed to the button's constructor.
 */
const exitButtonState = vi.hoisted(() => ({ lastCallback: null as (() => void) | null }));

// Mock the ExitButton UI component.
vi.mock("./ui/ExitButton", () => ({
  ExitButton: class {
    constructor(
      _stage: unknown,
      _layer: unknown,
      callback: () => void
    ) {
      // Capture the callback so the test can trigger it.
      exitButtonState.lastCallback = callback;
    }

    destroy() {
      // no-op for the mock
    }
  },
}));

// Mock the InfoButton UI component.
vi.mock("./ui/InfoButton", () => ({
  InfoButton: class {
    constructor(
      _stage: unknown,
      _layer: unknown,
      _message: string
    ) {
      // no-op, as we are not testing InfoButton interactions here.
    }
  },
}));

// Mock the entire 'konva' library to simulate a canvas environment.
vi.mock("konva", () => {
  type Handler = (evt?: { cancelBubble?: boolean }) => void;

  // A base class for all fake Konva nodes.
  class FakeNode {
    config: Record<string, unknown>;
    constructor(config?: Record<string, unknown>) {
      this.config = { ...(config ?? {}) };
    }
  }

  // A fake implementation of Konva.Group.
  class FakeGroup extends FakeNode {
    private visibleState: boolean;
    children: unknown[] = [];
    private handlers = new Map<string, Handler>();

    constructor(config?: Record<string, unknown>) {
      super(config);
      this.visibleState = (config?.visible as boolean) ?? true;
      // Register this instance with the global state tracker.
      konvaState.groups.push({
        config: this.config,
        visible: () => this.visible(),
        trigger: (event: string, evt?: { cancelBubble?: boolean }) => this.trigger(event, evt),
        handlers: this.handlers,
        children: this.children,
      });
    }

    add(...children: unknown[]) {
      this.children.push(...children);
      return this; // Allow chaining.
    }

    visible(value?: boolean) {
      if (typeof value === "boolean") {
        this.visibleState = value;
      }
      return this.visibleState;
    }

    destroyChildren() {
      this.children = [];
    }

    destroy() {
      this.config.destroyed = true;
    }
    moveToTop() {}

    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    trigger(event: string, evt?: { cancelBubble?: boolean }) {
      const handler = this.handlers.get(event);
      handler?.(evt);
    }
  }

  // A fake implementation of Konva.Rect.
  class FakeRect extends FakeNode {
    private handlers = new Map<string, Handler>();
    fillHistory: string[] = [];
    x(val?: number) {
      if (typeof val === "number") this.config.x = val;
      return (this.config.x as number) ?? 0;
    }
    y(val?: number) {
      if (typeof val === "number") this.config.y = val;
      return (this.config.y as number) ?? 0;
    }

    constructor(config?: Record<string, unknown>) {
      super(config);
      // Register this instance with the global state tracker.
      konvaState.rects.push({
        node: this,
        config: this.config,
        fillHistory: this.fillHistory,
        trigger: (event: string, evt?: { cancelBubble?: boolean }) =>
          this.trigger(event, evt),
      });
    }

    fill(color: string) {
      this.fillHistory.push(color);
      this.config.fill = color;
    }

    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    trigger(event: string, evt: { cancelBubble?: boolean } = {}) {
      const handler = this.handlers.get(event);
      handler?.(evt);
    }
  }
  
  // Fake classes for other shapes that are not used in detail.
  class FakeCircle extends FakeNode {}
  class FakeLine extends FakeNode {}

  // A fake implementation of Konva.Text.
  class FakeText extends FakeNode {
    constructor(config?: Record<string, unknown>) {
      super(config);
      // Register this instance with the global state tracker.
      konvaState.texts.push({ config: this.config });
    }
    // Fake methods to mimic the Konva.Text API.
    width() { return (this.config.width as number) ?? 10; }
    text(value: string) { this.config.text = value; }
    fill(color: string) { this.config.fill = color; }
    y() { return (this.config.y as number) ?? 0; }
    height() { return (this.config.height as number) ?? 10; }
    offsetX(value: number) { this.config.offsetX = value; }
    offsetY(value: number) { this.config.offsetY = value; }
  }

  // Return the complete mock Konva library structure.
  return {
    default: {
      Group: FakeGroup,
      Rect: FakeRect,
      Circle: FakeCircle,
      Line: FakeLine,
      Text: FakeText,
    },
  };
});

// The main test suite for the CleaningMinigame.
describe("CleaningMinigame", () => {
  // Spies and handlers to be used across tests.
  let mathRandomSpy: ReturnType<typeof vi.spyOn>;
  let keydownHandler: ((evt: Partial<KeyboardEvent>) => void) | null;

  // `beforeEach` sets up a clean environment before each test.
  beforeEach(() => {
    // Use fake timers to control time-based events.
    vi.useFakeTimers();
    // Clear the random number queue.
    randomQueue.length = 0;
    // Mock `Math.random` to pull numbers from our queue, ensuring deterministic tests.
    mathRandomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      if (randomQueue.length === 0) {
        return 0; // Default to 0 if the queue is empty.
      }
      return randomQueue.shift()!; // Otherwise, use the next number in the queue.
    });
    // Reset all mock state trackers.
    konvaState.groups.length = 0;
    konvaState.rects.length = 0;
    konvaState.texts.length = 0;
    exitButtonState.lastCallback = null;
    keydownHandler = null;

    // Stub the global `window` object to control its behavior.
    vi.stubGlobal("window", {
      location: { href: "" }, // Fake location for testing redirection.
      // Fake `addEventListener` to capture the keydown handler.
      addEventListener: vi.fn((event: string, handler: (evt: any) => void) => {
        if (event === "keydown") keydownHandler = handler;
      }),
      // Fake `removeEventListener` to test cleanup logic.
      removeEventListener: vi.fn((event: string, handler: (evt: any) => void) => {
        if (event === "keydown" && keydownHandler === handler) {
          keydownHandler = null;
        }
      }),
      // Forward timer functions to Vitest's fake timers.
      setInterval: (fn: (...args: any[]) => void, ms?: number) => setInterval(fn, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
      setTimeout: (fn: (...args: any[]) => void, ms?: number) => setTimeout(fn, ms),
      clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    });
  });

  // `afterEach` cleans up after each test.
  afterEach(() => {
    // Restore real timers.
    vi.useRealTimers();
    // Restore the original `Math.random`.
    mathRandomSpy.mockRestore();
    // Restore all stubbed globals.
    vi.unstubAllGlobals();
  });

  // Test case for the player choosing to skip the minigame.
  it("allows players to skip cleaning", () => {
    // Arrange: Create fake stage, layer, and an onComplete mock function.
    const stage = new FakeStage(800, 600);
    const layer = new FakeLayer();
    const onComplete = vi.fn();

    // Act: Instantiate the minigame.
    const minigame = new CleaningMinigame(stage as never, layer as never, 12, onComplete);

    // Assert: Find the "skip" button and simulate a click.
    // Find the red rectangle of the skip button.
    const skipRect = konvaState.rects.find(
      (rect) => rect.config.fill === "#e74c3c"
    );
    expect(skipRect).toBeTruthy(); // Ensure the button was created.
    // Find the group containing the skip button.
    const skipGroup = konvaState.groups.find((group) =>
      group.children.includes(skipRect?.node as any)
    );
    expect(skipGroup).toBeTruthy();

    // Act: Simulate hover and click events.
    skipGroup?.trigger("mouseenter");
    expect(stage.container().style.cursor).toBe("pointer"); // Cursor should change on hover.
    skipGroup?.trigger("mouseleave");
    expect(stage.container().style.cursor).toBe("default"); // Cursor should revert.
    skipGroup?.trigger("click tap", { cancelBubble: false }); // Simulate the click.

    // Act: Advance timers to allow any post-click logic to run.
    vi.advanceTimersByTime(0);
    
    // Assert: Check that the `onComplete` callback was called with the correct "skipped" result.
    expect(onComplete).toHaveBeenCalledWith(
      {
        correctAnswers: 0,
        totalProblems: 0,
        timeRemaining: 15, // The initial time, since no time passed.
      },
      true // The `skipped` flag should be true.
    );

    // Act: Call the cleanup method.
    minigame.cleanup();
    // Assert: The keydown event listener should have been removed.
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  // Test case for the full "play" flow where the player successfully cleans all dishes.
  it("runs through the play path and finishes all dishes", () => {
    // Arrange: Set up stage, layer, and mocks.
    const stage = new FakeStage(900, 700);
    const layer = new FakeLayer();
    const onComplete = vi.fn();

    // Arrange: Pre-load the random queue to make problem generation predictable.
    // We fill it with 0s, so Math.random() will always return 0.
    randomQueue.push(...Array(10).fill(0));
    // Act: Instantiate the minigame.
    const minigame = new CleaningMinigame(stage as never, layer as never, 15, onComplete);

    // Act: Find and click the "play" button.
    const playRect = konvaState.rects.find(
      (rect) => rect.config.fill === "#4CAF50"
    );
    expect(playRect).toBeTruthy();
    const playGroup = konvaState.groups.find((group) =>
      group.children.includes(playRect?.node as any)
    );
    expect(playGroup).toBeTruthy();
    playGroup?.trigger("click tap", { cancelBubble: false }); // Simulate click.

    // Assert: The minigame UI should now be visible.
    const minigameGroup = konvaState.groups.find(
      (group) => group.config.name === "minigameUI"
    );
    expect(minigameGroup?.visible()).toBe(true);

    // Assert: The keyboard event listener should have been added.
    expect(window.addEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
    const handler = keydownHandler!; // Capture the handler.

    // Act: Simulate the player solving 5 problems correctly.
    // With Math.random() returning 0, the problem is always 1x1=1.
    for (let i = 0; i < 5; i++) {
      handler({ key: "1" }); // Player types "1".
      handler({ key: "Enter" }); // Player presses Enter.
      vi.advanceTimersByTime(500); // Wait for feedback animation.
    }

    // Assert: The game should now be over. Find the "Continue" button on the results popup.
    const continueGroup = [...konvaState.groups].reverse().find((group) =>
      group.handlers.has("click")
    );
    // Act: Simulate clicking the "Continue" button.
    continueGroup?.handlers.get("click")?.();

    // Assert: Check the final `onComplete` call.
    expect(onComplete).toHaveBeenCalledWith(
      {
        // Since the player finished, `correctAnswers` is reported as the original total (15), not just the 5 they solved.
        correctAnswers: 15,
        totalProblems: 5, // They attempted 5 problems.
        timeRemaining: 0, // Time remaining is 0 because the game ended.
      },
      false // The `skipped` flag is false.
    );

    // Act: Call the final cleanup.
    minigame.cleanup();
  });
});
