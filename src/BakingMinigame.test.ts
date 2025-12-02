/**
 * This file contains unit tests for the BakingMinigame class.
 * It uses Vitest for the testing framework and extensively mocks dependencies
 * to isolate the BakingMinigame component and test its logic in a controlled environment.
 *
 * MOCKING STRATEGY:
 * - Konva.js: The entire 'konva' library is mocked to simulate the creation and interaction
 *   with canvas elements (Groups, Rects, Texts) without a real canvas.
 *   State is tracked in the `konvaState` object.
 * - AnimationPlayer: Mocked to control the animation flow (e.g., simulating completion or failure)
 *   without dealing with actual image loading or timers.
 * - UI Components (ExitButton, InfoButton): Mocked as simple classes to verify they are instantiated correctly.
 * - ConfigManager: Mocked to provide a consistent configuration (e.g., `bakingTime`) for tests.
 * - Globals (window, Math.random): `window` is stubbed to control event listeners and timers. `Math.random`
 *   is spied on to make problem generation predictable.
 */

// Import testing utilities from Vitest.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import the class to be tested.
import { BakingMinigame } from "./BakingMinigame";

/**
 * A fake implementation of a Konva Stage for testing purposes.
 * It mimics the methods that BakingMinigame calls on the stage object,
 * such as `width()`, `height()`, and `container()`. This avoids needing a real
 * Konva Stage in our tests.
 */
class FakeStage {
  // Private properties to store the simulated width and height.
  private readonly widthValue: number;
  private readonly heightValue: number;
  // A fake container element that simulates the stage's DOM container.
  // We only mock the `style.cursor` property, as that's what the minigame interacts with.
  private readonly containerElement = { style: { cursor: "default" } };

  // The constructor sets the simulated dimensions.
  constructor(widthValue: number, heightValue: number) {
    this.widthValue = widthValue;
    this.heightValue = heightValue;
  }

  // A fake implementation of the `width()` method.
  width() {
    return this.widthValue;
  }

  // A fake implementation of the `height()` method.
  height() {
    return this.heightValue;
  }

  // A fake implementation of the `container()` method.
  container() {
    return this.containerElement;
  }
}

/**
 * A fake implementation of a Konva Layer for testing purposes.
 * It simulates the methods `add()`, `draw()`, and `batchDraw()`, and tracks
 * which nodes have been added to it.
 */
class FakeLayer {
  // An array to record all nodes that are added to this fake layer.
  readonly addedNodes: unknown[] = [];
  // A mock function to spy on calls to `draw()`.
  readonly draw = vi.fn();
  // A mock function to spy on calls to `batchDraw()`.
  readonly batchDraw = vi.fn();

  // A fake implementation of the `add()` method.
  add(node: unknown) {
    // It simply pushes the added node into our tracking array.
    this.addedNodes.push(node);
  }
}

// A type definition for an entry in our mocked Konva rects state.
type RectEntry = {
  node: any; // The fake rect node itself.
  config: Record<string, unknown>; // The configuration object passed to its constructor.
  fillHistory: string[]; // A history of colors it has been filled with.
  trigger: (event: string, evt?: { cancelBubble?: boolean }) => void; // A function to manually trigger events.
};

/**
 * `vi.hoisted` is a Vitest feature that lifts the variable declaration to the top of the module,
 * before imports are evaluated. This is crucial because our mocks (defined below) need to
 * access and modify this state object.
 *
 * `konvaState` is a shared object that our mock Konva classes will use to record their state.
 * This allows our tests to inspect what Konva objects were created, what their properties are, etc.
 */
const konvaState = vi.hoisted(() => ({
  // Array to store all created FakeGroup instances and their states.
  groups: [] as Array<{
    config: Record<string, unknown>;
    visible: () => boolean;
    trigger: (event: string, evt?: { cancelBubble?: boolean }) => void;
    handlers: Map<string, (evt?: { cancelBubble?: boolean }) => void>;
    children: unknown[];
  }>,
  // Array to store all created FakeRect instances.
  rects: [] as RectEntry[],
  // Array to store all created FakeText instances.
  texts: [] as Array<{ config: Record<string, unknown> }>,
}));

// A type definition for an entry in our mocked AnimationPlayer state.
type AnimationEntry = {
  triggerComplete: () => void; // Function to manually trigger the onComplete callback.
  destroy: ReturnType<typeof vi.fn>; // A spy on the destroy method.
  stop: ReturnType<typeof vi.fn>; // A spy on the stop method.
  loadPromise?: Promise<void>; // The promise returned by the load method.
};

/**
 * A hoisted state object for tracking instances of the mocked AnimationPlayer.
 * This allows tests to control animations (e.g., make them fail or complete instantly)
 * and check if methods like `destroy` or `stop` were called.
 */
const animationState = vi.hoisted(() => ({
  // Array to store all created mock AnimationPlayer instances.
  instances: [] as AnimationEntry[],
  // A flag to tell the next `load()` call whether it should succeed or fail.
  nextShouldReject: false,
}));

/**
 * A hoisted state object for the mocked ExitButton.
 * This allows tests to capture the callback function passed to the ExitButton's
 * constructor and trigger it manually to simulate a button click.
 */
const exitButtonState = vi.hoisted(() => ({
  // Stores the last callback function passed to the ExitButton constructor.
  lastCallback: null as (() => void) | null,
}));

// Mock the ConfigManager module.
vi.mock("./config", () => ({
  // We mock the `ConfigManager` class.
  ConfigManager: {
    // It has a static `getInstance` method.
    getInstance: () => ({
      // The instance has a `getConfig` method.
      getConfig: () => ({
        // We return a fixed configuration object for our tests.
        // This ensures the minigame always has a predictable time limit.
        bakingTime: 12,
      }),
    }),
  },
}));

// Mock the AnimationPlayer module.
vi.mock("./AnimationPlayer", () => ({
  // We provide a fake `AnimationPlayer` class.
  AnimationPlayer: class {
    // It stores the onComplete callback passed to it.
    private readonly onComplete: () => void;
    // We create mock functions for the methods our code calls.
    readonly start = vi.fn();
    readonly stop = vi.fn();
    readonly destroy = vi.fn();
    // It holds a reference to its entry in the global animationState.
    private entry: AnimationEntry;

    // The constructor captures the onComplete callback.
    constructor(
      _layer: unknown,
      _images: string[],
      _fps: number,
      _x: number,
      _y: number,
      _w: number,
      _h: number,
      _loop: boolean,
      onComplete: () => void
    ) {
      // Store the callback.
      this.onComplete = onComplete;
      // Create an entry in our global state for this animation instance.
      this.entry = {
        // A function to let tests trigger the onComplete callback manually.
        triggerComplete: () => this.onComplete(),
        // Pass the mock functions to the state so tests can check them.
        destroy: this.destroy,
        stop: this.stop,
      };
      // Add this instance's state to the global array.
      animationState.instances.push(this.entry);
    }

    // A fake `load` method.
    load() {
      // It returns a promise that either resolves or rejects based on the `nextShouldReject` flag.
      const promise = animationState.nextShouldReject
        ? Promise.reject(new Error("boom"))
        : Promise.resolve();
      // Reset the flag for the next animation.
      animationState.nextShouldReject = false;
      // Store the promise so the test can await it.
      this.entry.loadPromise = promise;
      return promise;
    }

    // A helper for tests to easily trigger the completion callback.
    triggerComplete() {
      this.onComplete();
    }
  },
}));

// Mock the ExitButton UI component.
vi.mock("./ui/ExitButton", () => ({
  // Provide a fake `ExitButton` class.
  ExitButton: class {
    // The constructor just captures the callback function.
    constructor(
      _stage: unknown,
      _layer: unknown,
      callback: () => void
    ) {
      // Store the callback in the global state for the test to access.
      exitButtonState.lastCallback = callback;
    }

    // The destroy method does nothing in the mock.
    destroy() {
      // nothing to do for the mock
    }
  },
}));

// Mock the InfoButton UI component.
vi.mock("./ui/InfoButton", () => ({
  // Provide a fake `InfoButton` class.
  InfoButton: class {
    // The constructor is a no-op (no operation) because we don't need to
    // test any interaction with the info button in this test file.
    constructor(
      _stage: unknown,
      _layer: unknown,
      _message: string
    ) {
      // noop
    }
  },
}));

// Mock the entire 'konva' library. This is the most complex mock.
vi.mock("konva", () => {
  // A type alias for event handler functions.
  type Handler = (evt?: { cancelBubble?: boolean }) => void;

  // A base class for all our fake Konva nodes.
  class FakeNode {
    // It stores the configuration object passed to it.
    config: Record<string, unknown>;
    constructor(config?: Record<string, unknown>) {
      this.config = { ...(config ?? {}) };
    }
  }

  // A fake implementation of Konva.Group.
  class FakeGroup extends FakeNode {
    children: unknown[] = []; // Array to track child nodes.
    private visibleState: boolean; // Internal state for visibility.
    private handlers = new Map<string, Handler>(); // Map to store event handlers.

    constructor(config?: Record<string, unknown>) {
      super(config);
      // Initialize visibility from config, defaulting to true.
      this.visibleState = (config?.visible as boolean) ?? true;
      // Add this group's state to the global `konvaState` so tests can inspect it.
      konvaState.groups.push({
        config: this.config,
        visible: () => this.visible(),
        trigger: (event: string, evt?: { cancelBubble?: boolean }) => this.trigger(event, evt),
        handlers: this.handlers,
        children: this.children,
      });
    }

    // Fake `add` method.
    add(...children: unknown[]) {
      this.children.push(...children);
      return this; // Return `this` to allow chaining, e.g., `group.add(rect).add(text)`.
    }

    // Fake `visible` method (acts as both a getter and a setter).
    visible(value?: boolean) {
      if (typeof value === "boolean") {
        this.visibleState = value;
      }
      return this.visibleState;
    }

    // Fake `destroyChildren` method.
    destroyChildren() {
      this.children = [];
    }

    // Fake `destroy` method.
    destroy() {
      this.config.destroyed = true;
    }
    // Fake `moveToTop` method (no-op).
    moveToTop() {}

    // Fake `on` method to register event handlers.
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    // Fake `trigger` method to simulate events.
    trigger(event: string, evt?: { cancelBubble?: boolean }) {
      // Find and call the handler for the given event.
      const handler = this.handlers.get(event);
      handler?.(evt);
    }
  }

  // A fake implementation of Konva.Rect.
  class FakeRect extends FakeNode {
    private handlers = new Map<string, Handler>(); // Stores event handlers.
    fillHistory: string[] = []; // Records every color passed to the `fill` method.
    
    // Fake `x` method (getter/setter).
    x(val?: number) {
      if (typeof val === "number") this.config.x = val;
      return (this.config.x as number) ?? 0;
    }
    // Fake `y` method (getter/setter).
    y(val?: number) {
      if (typeof val === "number") this.config.y = val;
      return (this.config.y as number) ?? 0;
    }

    constructor(config?: Record<string, unknown>) {
      super(config);
      // Add this rect's state to the global `konvaState`.
      konvaState.rects.push({
        node: this,
        config: this.config,
        fillHistory: this.fillHistory,
        trigger: (event: string, evt?: { cancelBubble?: boolean }) =>
          this.trigger(event, evt),
      });
    }

    // Fake `fill` method.
    fill(color: string) {
      this.fillHistory.push(color);
      this.config.fill = color;
    }

    // Fake `on` method to register event handlers.
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    // Fake `trigger` method to simulate events.
    trigger(event: string, evt: { cancelBubble?: boolean } = {}) {
      const handler = this.handlers.get(event);
      handler?.(evt);
    }
  }

  // Fake classes for other Konva shapes (no-op because they are not used in detail).
  class FakeCircle extends FakeNode {}
  class FakeLine extends FakeNode {}

  // A fake implementation of Konva.Text.
  class FakeText extends FakeNode {
    constructor(config?: Record<string, unknown>) {
      super(config);
      // Add this text's state to the global `konvaState`.
      konvaState.texts.push({ config: this.config });
    }

    // The following are all fake methods mimicking the Konva.Text API.
    width() {
      return (this.config.width as number) ?? 10;
    }

    text(value: string) {
      this.config.text = value;
    }

    fill(color: string) {
      this.config.fill = color;
    }

    align(_: string) {
      return _;
    }

    y() {
      return (this.config.y as number) ?? 0;
    }

    height() {
      return (this.config.height as number) ?? 10;
    }

    offsetX(value: number) {
      this.config.offsetX = value;
    }

    offsetY(value: number) {
      this.config.offsetY = value;
    }
  }

  // The mock module must return an object that matches the structure of the real 'konva' library.
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

// The main test suite for the BakingMinigame.
describe("BakingMinigame", () => {
  // Declare variables for spies and handlers that will be used across tests.
  let mathRandomSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let keydownHandler: ((evt: Partial<KeyboardEvent>) => void) | null;

  // `beforeEach` runs before every test to set up a clean environment.
  beforeEach(() => {
    // Use fake timers to control setInterval, setTimeout, etc.
    vi.useFakeTimers();
    // Spy on Math.random and mock its return value to make problem generation predictable.
    mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    // Spy on console.error to check for expected error messages without cluttering the output.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    // Reset the state of all our mock objects.
    konvaState.groups.length = 0;
    konvaState.rects.length = 0;
    konvaState.texts.length = 0;
    animationState.instances.length = 0;
    animationState.nextShouldReject = false;
    exitButtonState.lastCallback = null;
    keydownHandler = null;

    // `vi.stubGlobal` replaces global objects like `window`.
    vi.stubGlobal("window", {
      location: { href: "" }, // A fake location object to test redirection.
      // A fake `addEventListener` to capture the keydown handler.
      addEventListener: vi.fn((event: string, handler: (evt: any) => void) => {
        if (event === "keydown") keydownHandler = handler;
      }),
      // A fake `removeEventListener` to test cleanup.
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

  // `afterEach` runs after every test to clean up.
  afterEach(() => {
    // Restore real timers.
    vi.useRealTimers();
    // Restore the original Math.random.
    mathRandomSpy.mockRestore();
    // Restore the original console.error.
    consoleErrorSpy.mockRestore();
    // Restore all stubbed globals.
    vi.unstubAllGlobals();
  });

  // Test case: Simulates the flow where the animation fails, and the user chooses to skip.
  it("lets players skip and exit via the UI", async () => {
    // Arrange: Set up the conditions for the test.
    // Tell the mock animation to fail its next `load()` call.
    animationState.nextShouldReject = true;
    // Create fake stage and layer.
    const stage = new FakeStage(800, 600);
    const layer = new FakeLayer();
    // Create a mock function for the onComplete callback.
    const onComplete = vi.fn();

    // Act: Instantiate the BakingMinigame.
    const minigame = new BakingMinigame(stage as never, layer as never, 5, onComplete);
    // Get the mock animation instance.
    const animation = animationState.instances[0];
    // Wait for the load promise to settle (it will reject). Catch the error to prevent an unhandled rejection warning.
    await animation.loadPromise?.catch(() => {});
    
    // Assert: Check the results.
    // Check that an error was logged because the animation failed to load.
    expect(consoleErrorSpy).toHaveBeenCalled();
    // Find the choice UI group in the mock konva state.
    const choiceGroup = konvaState.groups.find(
      (group) => group.config.name === "choiceUI"
    );
    // The choice UI should have been made visible as a fallback.
    expect(choiceGroup?.visible()).toBe(true);

    // Find the red "skip" button's rectangle.
    const skipRect = konvaState.rects.find(
      (rect) => rect.config.fill === "#e74c3c"
    );
    expect(skipRect).toBeTruthy(); // Make sure it exists.
    // Find the group that contains the skip button.
    const skipGroup = konvaState.groups.find((group) =>
      group.children.includes(skipRect?.node as any)
    );
    expect(skipGroup).toBeTruthy(); // Make sure it exists.
    
    // Simulate mouse entering the skip button.
    skipGroup?.trigger("mouseenter");
    // The cursor style should change to "pointer".
    expect(stage.container().style.cursor).toBe("pointer");
    // Simulate mouse leaving.
    skipGroup?.trigger("mouseleave");
    // The cursor style should revert to "default".
    expect(stage.container().style.cursor).toBe("default");

    // Simulate clicking the skip button.
    const skipEvent = { cancelBubble: false };
    skipGroup?.trigger("click tap", skipEvent);
    // The event bubble should be cancelled to stop propagation.
    expect(skipEvent.cancelBubble).toBe(true);

    // Advance timers to allow the onComplete callback's setTimeout to run.
    vi.advanceTimersByTime(150);
    // The onComplete callback should have been called.
    expect(onComplete).toHaveBeenCalledWith(
      { // The result object.
        correctAnswers: 0,
        totalProblems: 0,
        timeRemaining: 12,
      },
      true // `skipped` should be true.
    );

    // The animation should have been destroyed.
    expect(animationState.instances[0].destroy).toHaveBeenCalled();

    // Simulate clicking the main exit button.
    exitButtonState.lastCallback?.();
    // The window should be redirected.
    expect(window.location.href).toBe("/login.hmtl");

    // Call the game's main cleanup method.
    minigame.cleanup();
    // The keydown event listener should have been removed.
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  // Test case: Simulates the full, successful gameplay flow.
  it("runs through the play flow and timer countdown", async () => {
    // Arrange: Create stage, layer, and onComplete mock.
    const stage = new FakeStage(1024, 768);
    const layer = new FakeLayer();
    const onComplete = vi.fn();

    // Act: Create the minigame instance.
    const minigame = new BakingMinigame(stage as never, layer as never, 9, onComplete);
    // Wait for microtasks to finish (e.g., the load promise).
    await Promise.resolve();

    // Get the mock animation and manually trigger its onComplete callback.
    const animation = animationState.instances[0];
    animation.triggerComplete();

    // Find the green "play" button.
    const playRect = konvaState.rects.find(
      (rect) => rect.config.fill === "#4CAF50"
    );
    expect(playRect).toBeTruthy();
    // Find its parent group.
    const playGroup = konvaState.groups.find((group) =>
      group.children.includes(playRect?.node as any)
    );
    expect(playGroup).toBeTruthy();

    // Simulate hover effects on the play button.
    playGroup?.trigger("mouseenter");
    expect(stage.container().style.cursor).toBe("pointer");
    playGroup?.trigger("mouseleave");
    expect(stage.container().style.cursor).toBe("default");
    
    // Simulate clicking the play button.
    playGroup?.trigger("click tap", { cancelBubble: false });

    // Find the main UI groups.
    const choiceGroup = konvaState.groups.find(
      (group) => group.config.name === "choiceUI"
    );
    const minigameGroup = konvaState.groups.find(
      (group) => group.config.name === "minigameUI"
    );
    // Assert that the choice UI is now hidden and the minigame UI is visible.
    expect(choiceGroup?.visible()).toBe(false);
    expect(minigameGroup?.visible()).toBe(true);

    // The keydown event listener should have been added.
    expect(window.addEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    // Act: Simulate player input.
    const handler = keydownHandler!; // Get the captured keydown handler.
    handler({ key: "Enter" }); // Press enter with no input (should do nothing).
    handler({ key: "5" }); // Type "5".
    handler({ key: "Backspace" }); // Delete "5".
    handler({ key: "1" }); // Type "1".
    handler({ key: "Enter" }); // Submit "1" (wrong answer, since random is 0, problem is 2*1=2 / 2, answer is 1). Actually correct.
    vi.advanceTimersByTime(800); // Wait for feedback timeout.

    // Find the score text and assert it has been updated.
    const scoreText = konvaState.texts.find((text) =>
      (text.config.text as string)?.startsWith("Tips Earned")
    );
    expect(scoreText?.config.text).toBe("Tips Earned: $5");

    // Simulate another problem.
    handler({ key: "2" }); // Type "2" (wrong answer).
    handler({ key: "Enter" }); // Submit.
    vi.advanceTimersByTime(800); // Wait for feedback.

    // Act: Advance the main timer until the game ends.
    vi.advanceTimersByTime(12000);
    // The animation (which is also used for baking) should be stopped.
    expect(animation.stop).toHaveBeenCalled();
    // The keydown listener should be removed.
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    // Act: Simulate clicking the "Continue" button on the results popup.
    vi.advanceTimersByTime(500); // Allow results popup to be created.
    // Find the continue button's group (it's the last one created with a click handler).
    const continueGroup = [...konvaState.groups].reverse().find((group) =>
      group.handlers.has("click")
    );
    // Trigger its click handler.
    continueGroup?.handlers.get("click")?.();
    
    // Assert: Check the final onComplete call.
    expect(onComplete).toHaveBeenCalledWith(
      { // Final results object.
        correctAnswers: 1,
        totalProblems: 2,
        timeRemaining: 0,
      },
      false // `skipped` is false.
    );

    // Call cleanup at the very end.
    minigame.cleanup();
  });
});
