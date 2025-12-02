/**
 * This file contains unit tests for the DaySummaryScreen class.
 * It verifies that the summary screen correctly displays the financial results of a day's activities
 * and that its interactive elements, like the "Continue" and "Exit" buttons, function as expected.
 *
 * MOCKING STRATEGY:
 * - Konva.js: The entire 'konva' library is mocked to simulate the rendering of UI elements
 *   (groups, text, images, etc.) without needing a real canvas. The state of these mock objects
 *   is tracked in the `konvaState` object.
 * - UI Components (ExitButton, InfoButton): These are mocked to confirm they are instantiated
 *   and to capture their callbacks for testing.
 * - Globals (window, Image): The `window` object is stubbed to control `location.href` for
 *   testing redirection. The global `Image` constructor is mocked to simulate image loading
 *   instantly, allowing tests to proceed without asynchronous waits for actual image files.
 */

// Import testing utilities from Vitest.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import the class to be tested.
import { DaySummaryScreen } from "./DaySummaryScreen";

/**
 * A fake implementation of a Konva Stage, providing the minimal API
 * required by the DaySummaryScreen for testing purposes.
 */
class FakeStage {
  private readonly widthValue: number;
  private readonly heightValue: number;
  // Simulates the stage's DOM container to test cursor style changes on hover.
  private readonly containerElement = { style: { cursor: "default" } };

  constructor(widthValue: number, heightValue: number) {
    this.widthValue = widthValue;
    this.heightValue = heightValue;
  }

  // Fake `width()` method.
  width() {
    return this.widthValue;
  }

  // Fake `height()` method.
  height() {
    return this.heightValue;
  }

  // Fake `container()` method.
  container() {
    return this.containerElement;
  }
}

/**
 * A fake implementation of a Konva Layer. It tracks added nodes
 * and provides mock functions for drawing and destruction methods.
 */
class FakeLayer {
  // Records all nodes passed to the `add` method.
  readonly addedNodes: unknown[] = [];
  // Mocks for drawing methods to check if they are called.
  readonly draw = vi.fn();
  readonly batchDraw = vi.fn();
  // Mock for `destroyChildren` to verify cleanup.
  readonly destroyChildren = vi.fn();

  add(node: unknown) {
    this.addedNodes.push(node);
  }
}

// A type alias for event handler functions used in the mock.
type Handler = () => void;

/**
 * Hoisted state object (`vi.hoisted`) to track the state of all created mock Konva objects.
 * This allows tests to inspect the properties and structure of the UI created by DaySummaryScreen.
 */
const konvaState = vi.hoisted(() => ({
  // Tracks all created FakeGroup instances and their event handlers.
  groups: [] as Array<{ config: Record<string, unknown>; handlers: Map<string, Handler> }>,
  // Tracks all created FakeText instances and their configurations.
  texts: [] as Array<{ config: Record<string, unknown> }>,
  // Tracks all created FakeRect instances.
  rects: [] as Array<{ config: Record<string, unknown>; fillHistory: string[] }>,
}));

/**
 * Hoisted state object for the mocked ExitButton. This allows the test
 * to access the button's `destroy` mock and its captured callback.
 */
const exitButtonState = vi.hoisted(() => ({ destroy: vi.fn(), lastCallback: null as (() => void) | null }));

// Stub the global `Image` class.
// This is crucial for tests involving Konva.Image. Instead of loading a real image,
// this mock simulates an instant successful load by calling the `onload` callback immediately
// after the `src` property is set.
vi.stubGlobal(
  "Image",
  class {
    onload: (() => void) | null = null;
    set src(_: string) {
      // Immediately trigger onload to simulate a fast, successful image load.
      this.onload?.();
    }
  }
);

// Mock the ExitButton UI component.
vi.mock("./ui/ExitButton", () => ({
  ExitButton: class {
    constructor(
      _stage: unknown,
      _layer: unknown,
      callback: () => void
    ) {
      // Capture the callback passed to the constructor so the test can trigger it.
      exitButtonState.lastCallback = callback;
    }

    // Provide a mock destroy method that can be spied on.
    destroy() {
      exitButtonState.destroy();
    }
  },
}));

// Mock the InfoButton UI component.
vi.mock("./ui/InfoButton", () => ({
  InfoButton: class {
    constructor(
      _stage: unknown,
      _layer: unknown
    ) {
        // no-op, as we are not testing its functionality here.
    }
  },
}));

// Mock the entire 'konva' library to simulate a canvas environment.
vi.mock("konva", () => {
  // A base class for all fake Konva nodes.
  class FakeNode {
    config: Record<string, unknown>;
    constructor(config?: Record<string, unknown>) {
      this.config = { ...(config ?? {}) };
    }
  }

  // A fake implementation of Konva.Group.
  class FakeGroup extends FakeNode {
    readonly children: unknown[] = [];
    readonly handlers = new Map<string, Handler>();

    constructor(config?: Record<string, unknown>) {
      super(config);
      // Register this group instance with the global state tracker.
      konvaState.groups.push({ config: this.config, handlers: this.handlers });
    }

    add(...children: unknown[]) {
      this.children.push(...children);
      return this; // Allow chaining.
    }

    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }
  }

  // A fake implementation of Konva.Rect.
  class FakeRect extends FakeNode {
    fillHistory: string[] = [];
    xValue = (this.config.x as number) ?? 0;
    widthValue = (this.config.width as number) ?? 0;

    fill(color: string) {
      this.fillHistory.push(color);
      this.config.fill = color;
    }
    x() { return this.xValue; }
    width() { return this.widthValue; }
  }

  // A fake implementation of Konva.Image.
  class FakeImage extends FakeNode {
    private widthValue = (this.config.width as number) ?? 0;
    private heightValue = (this.config.height as number) ?? 0;
    private xValue = (this.config.x as number) ?? 0;

    width() { return this.widthValue; }
    height() { return this.heightValue; }
    x(value?: number) {
      if (typeof value === "number") {
        this.xValue = value;
      }
      return this.xValue;
    }
  }

  // A fake implementation of Konva.Text.
  class FakeText extends FakeNode {
    constructor(config?: Record<string, unknown>) {
      super(config);
      // Register this text instance with the global state tracker.
      konvaState.texts.push({ config: this.config });
    }
    text(value: string) { this.config.text = value; }
    fill(color: string) { this.config.fill = color; }
  }

  // Return the complete mock Konva library structure.
  return {
    default: {
      Group: FakeGroup,
      Rect: FakeRect,
      Image: FakeImage,
      Text: FakeText,
    },
  };
});

// The main test suite for the DaySummaryScreen.
describe("DaySummaryScreen", () => {
  // `beforeEach` sets up a clean environment before each test.
  beforeEach(() => {
    // Reset all mock state trackers.
    konvaState.groups.length = 0;
    konvaState.texts.length = 0;
    exitButtonState.destroy.mockClear();
    exitButtonState.lastCallback = null;
    // Stub the global `window` object to control its behavior during tests.
    vi.stubGlobal("window", {
      location: { href: "about:blank" }, // Fake location for testing redirection.
      Image: (globalThis as any).Image, // Use the globally stubbed Image class.
      addEventListener: vi.fn(), // Mock event listener methods.
      removeEventListener: vi.fn(),
    });
  });

  // `afterEach` cleans up after each test.
  afterEach(() => {
    // Restore all stubbed globals and clear mocks.
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // A comprehensive test case that verifies rendering and button interactions.
  it("renders the summary and handles button interactions", () => {
    // Arrange: Create fake stage, layer, and a mock onContinue callback.
    const stage = new FakeStage(1000, 800);
    const layer = new FakeLayer();
    const onContinue = vi.fn();

    // Act: Instantiate the DaySummaryScreen with sample financial data.
    new DaySummaryScreen(stage as never, layer as never, 3, 500, 200, 1300, 75, onContinue);

    // --- Assert Continue Button ---
    // Find the button group that has a 'click tap' handler attached.
    const buttonGroup = konvaState.groups.find((group) =>
      group.handlers.has("click tap")
    );
    // Ensure that such a button was created.
    expect(buttonGroup).toBeTruthy();

    // Act: Get the 'click tap' handler and call it to simulate a button press.
    const continueHandler = buttonGroup!.handlers.get("click tap")!;
    continueHandler();
    // Assert: The `onContinue` callback passed to the constructor should have been called.
    expect(onContinue).toHaveBeenCalled();

    // --- Assert Hover Effects ---
    // Act: Get the mouseenter and mouseleave handlers.
    const enterHandler = buttonGroup!.handlers.get("mouseenter")!;
    const leaveHandler = buttonGroup!.handlers.get("mouseleave")!;
    // Set initial cursor state.
    stage.container().style.cursor = "default";
    // Simulate mouseenter.
    enterHandler();
    // Assert: The cursor style should change to 'pointer'.
    expect(stage.container().style.cursor).toBe("pointer");
    // Simulate mouseleave.
    leaveHandler();
    // Assert: The cursor style should revert to 'default'.
    expect(stage.container().style.cursor).toBe("default");

    // --- Assert Rendered Text ---
    // Act: Collect all the text content from the mock Konva.Text objects that were created.
    const texts = konvaState.texts.map((entry) => entry.config.text);
    // Assert: Check that the collected text content includes the correctly formatted summary data.
    expect(texts).toContain("DAY 3"); // Check day number.
    expect(texts).toContain("Tips Earned: $75.00"); // Check tips.
    expect(texts).toContain("Sales (Cookies Sold): $500.00"); // Check sales.

    // --- Assert Exit Button ---
    // Act: Trigger the callback captured by the mock ExitButton.
    exitButtonState.lastCallback?.();
    // Assert: The window should be redirected to the login page.
    expect(window.location.href).toBe("/login.html");
  });
});
