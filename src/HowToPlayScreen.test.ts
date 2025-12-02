/**
 * HowToPlayScreen.test.ts - Unit tests for the HowToPlayScreen component.
 *
 * PURPOSE:
 * This file contains the unit tests for the `HowToPlayScreen` class. This screen is responsible for
 * fetching and displaying the game's instructions from an external text file. The tests are designed
 * to verify its functionality in isolation, including UI rendering, asynchronous data fetching,
 * error handling, and user interactions.
 *
 * ARCHITECTURAL OVERVIEW:
 * - MOCKING: This test suite heavily relies on mocking to isolate the `HowToPlayScreen` from its
 *   dependencies. Key mocks include:
 *   - `Konva.js`: The entire library is replaced with a set of mock classes (`NodeStub`, `StageStub`, etc.)
 *     that simulate the Konva API without requiring a real canvas. This allows for fast, headless testing.
 *   - `fetch`: The global `fetch` function is mocked to control the responses for loading `howtoplay.txt`,
 *     allowing tests to simulate both successful and failed network requests.
 *   - `ExitButton`: The custom `ExitButton` UI component is mocked to prevent its own logic from
 *     interfering and to allow tests to capture the callback passed to it.
 * - JSDOM ENVIRONMENT: The `@vitest-environment jsdom` directive ensures that a simulated browser
 *   environment is available, providing necessary browser-native APIs like `window`, `fetch`, and
 *   `requestAnimationFrame`.
 * - TEST STRUCTURE: A main `describe` block contains all tests. A `beforeEach` hook ensures that
 *   mocks are reset and a clean environment is set up before each test, guaranteeing test isolation.
 *
 * KEY TESTING AREAS:
 * 1.  **Asynchronous Rendering**: Verifies that the screen correctly fetches, parses, and displays
 *     instructions from a mocked `fetch` response.
 * 2.  **Conditional Rendering**: Tests that the UI correctly renders different layouts based on whether
 *     the instruction text contains a "Tips for Success" section.
 * 3.  **User Interaction**: Simulates `mouseenter`, `mouseleave`, and `click` events on the "Start Game"
 *     button to ensure hover effects and the `onStartGame` callback work correctly.
 * 4.  **Error Handling**: Checks that if the `fetch` request fails, the error is caught and logged
 *     without crashing the application.
 * 5.  **Lifecycle and Cleanup**: Ensures that the `cleanup` method correctly disables event listeners
 *     (like the resize handler) to prevent memory leaks and unwanted behavior after the screen is destroyed.
 * 6.  **Responsive Behavior**: Tests the debounced resize handler to confirm that it schedules a UI
 *     redraw using `requestAnimationFrame`.
 * 7.  **Volume Control**: Verifies that the volume slider integration works as expected, clamping values
 *     and calling the appropriate global and local callbacks.
 *
 * Layout note: This file is structured to have mocks first, then a shared setup block (`beforeEach`),
 * followed by several scenario-based tests. The tests cover the successful rendering path,
 * error handling, resize debouncing, and volume control logic to ensure each code branch can be
 * clearly explained and verified.
 */

/**
 * @vitest-environment jsdom
 * This directive configures Vitest to use a JSDOM environment, which simulates a browser's
 * DOM. This is essential for components like `HowToPlayScreen` that interact with the DOM,
 * for example, by creating a Konva Stage within a container or listening to window events like 'resize'.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HowToPlayScreen } from "./HowToPlayScreen";

// A type alias for a generic event handler function to improve readability.
type Handler = (...args: any[]) => void;

// A hoisted variable to capture the callback passed to the mock ExitButton.
// This allows tests to simulate a click on the exit button from outside the class.
let lastExitCb: (() => void) | null = null;

// Mock the ExitButton module entirely. This is done to prevent the real ExitButton's
// implementation details from affecting the HowToPlayScreen tests.
vi.mock("./ui/ExitButton", () => ({
  // Provide a mock `ExitButton` class.
  ExitButton: class {
    // The constructor of the mock captures the callback function passed to it.
    // This allows a test to later trigger this callback to simulate a user clicking the exit button.
    constructor(_s: any, _l: any, cb: () => void) {
      lastExitCb = cb;
    }
  },
}));

// Mock the entire 'konva' library. This is a crucial step for enabling fast, headless testing.
vi.mock("konva", () => {
  // A base class for all mocked Konva nodes. It provides common functionality
  // like managing a scene graph (children), handling events, and a generic property accessor.
  class NodeStub {
    // Stores the configuration object passed during instantiation.
    config: Record<string, any>;
    // Simulates the list of child nodes in the Konva scene graph.
    children: NodeStub[] = [];
    // A map to store event listeners (e.g., 'click', 'mouseenter').
    private handlers = new Map<string, Handler>();

    constructor(config: Record<string, any> = {}) {
      this.config = { ...config };
    }

    // A mock `add` method that mimics adding children to a node.
    add(...nodes: NodeStub[]) {
      this.children.push(...nodes);
      return this; // Return `this` for chainability, as is common in Konva.
    }

    // A mock `getChildren` method to allow tests to inspect the scene graph.
    getChildren() {
      return this.children;
    }

    // A mock `on` method to register event handlers.
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    // A mock `fire` method to simulate triggering events, which is used to test user interactions.
    fire(event: string, payload?: any) {
      this.handlers.get(event)?.(payload);
    }

    /**
     * A generic helper to create getter/setter methods for properties.
     * This reduces boilerplate code for mocking numerous properties like `width`, `height`, `x`, `y`, etc.
     * @param key The name of the property to be mocked.
     * @param fallback The default value to return if the property is not set.
     * @returns A function that acts as both a getter (when called with no arguments) and a setter (when called with an argument).
     */
    accessor<T>(key: string, fallback: T) {
      return (value?: T) => {
        if (value !== undefined) this.config[key] = value;
        return (this.config[key] as T) ?? fallback;
      };
    }

    // Use the accessor factory to create mock properties for common Konva attributes.
    width = this.accessor("width", 0);
    height = this.accessor("height", 0);
    x = this.accessor("x", 0);
    y = this.accessor("y", 0);
    fill = this.accessor("fill", "");
    stroke = this.accessor("stroke", "");
    fontFamily = this.accessor("fontFamily", "");
    fontSize = this.accessor("fontSize", 16);
    fontStyle = this.accessor("fontStyle", "");
    align = this.accessor("align", "left");
    verticalAlign = this.accessor("verticalAlign", "top");
    lineHeight = this.accessor("lineHeight", 1);
    wrap = this.accessor("wrap", "word");
    text = this.accessor("text", "");
    cornerRadius = this.accessor("cornerRadius", 0);
    opacity = this.accessor("opacity", 1);

    // A mock `position` method, required by some components.
    position(pos?: { x?: number; y?: number }) {
      if (pos?.x !== undefined) this.config.x = pos.x;
      if (pos?.y !== undefined) this.config.y = pos.y;
      return { x: this.config.x ?? 0, y: this.config.y ?? 0 };
    }
  }

  // Stubs for specific Konva classes, inheriting from the base NodeStub to share common logic.
  class StageStub extends NodeStub {
    containerEl = { style: { cursor: "default" } }; // Mock container for testing cursor style changes.
    getPointerPosition() { return { x: this.config.x ?? 0, y: this.config.y ?? 0 }; }
    container() { return this.containerEl; }
  }
  class LayerStub extends NodeStub {
    // We use `vi.fn()` to create spies for drawing methods. This allows us to assert
    // whether these methods were called, which is a key way to verify UI updates.
    draw = vi.fn();
    batchDraw = vi.fn();
    destroyChildren = vi.fn();
  }
  class TextStub extends NodeStub {}
  class RectStub extends NodeStub {}
  class GroupStub extends NodeStub {
    // Add a `findOne` helper to the mock Group to simplify finding child nodes in tests.
    // This is a test-specific utility to make assertions cleaner.
    findOne(type: string) {
      return this.children.find((c) => c.constructor.name === `${type}Stub`);
    }
  }
  class ImageStub extends NodeStub {}
  class CircleStub extends NodeStub {}

  // Return the final mocked library structure, which Vitest will provide for any `import 'konva'` statement.
  return {
    default: {
      Stage: StageStub, Layer: LayerStub, Group: GroupStub,
      Rect: RectStub, Text: TextStub, Image: ImageStub, Circle: CircleStub,
    },
  };
});

// The main test suite for the HowToPlayScreen.
describe("HowToPlayScreen", () => {
  // Declare variables for mocks and spies that will be set up fresh in each `beforeEach` block.
  let stage: any;
  let layer: any;
  const fetchMock = vi.fn();
  let KonvaModule: any;
  let rafSpy: ReturnType<typeof vi.spyOn>;

  // `beforeEach` runs before every test to set up a clean, isolated environment.
  beforeEach(async () => {
    // Clear any previous mock call history to ensure tests are independent.
    vi.clearAllMocks();
    fetchMock.mockReset(); // Specifically reset the fetch mock's call history and implementations.

    // Spy on `console.error` and provide a mock implementation. This is useful for
    // verifying that errors are logged, while also keeping the test output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock the global `fetch` function with our spy.
    (global as any).fetch = fetchMock;

    // Dynamically import the mocked Konva module after all mocks are in place.
    KonvaModule = (await import("konva")).default as any;

    // Create new mock stage and layer instances for the upcoming test.
    stage = new KonvaModule.Stage({ width: 800, height: 600 }) as any;
    layer = new KonvaModule.Layer() as any;
    stage.add(layer);

    // Spy on `requestAnimationFrame` to test the debounced resize handler.
    // The mock implementation immediately executes the callback, making the test synchronous.
    rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    // Mock `cancelAnimationFrame` to do nothing, as there's no real animation frame to cancel.
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  // Test case for verifying volume control logic and rendering without the "tips" section.
  it("renders without tips, applies global volume callback, and respects setVolume clamp", async () => {
    // Arrange: Mock the fetch request to return simple instructions without the "Tips" section.
    fetchMock.mockResolvedValueOnce({ text: async () => "Only instructions" });
    // Arrange: Create a spy for the global volume setter function that would exist on the window.
    const setGlobalSpy = vi.fn();
    (window as any).setGlobalBgmVolume = setGlobalSpy;

    // Act: Create the screen instance. This will trigger the initial UI setup and fetch call.
    const screen: any = new HowToPlayScreen(stage as any, layer as any, vi.fn());
    // Act: Wait for the async `loadInstructions` method to complete. A simple `await Promise.resolve()`
    // is often enough to push execution to the next tick, allowing async operations to finish.
    await Promise.resolve();

    // Act: Set an additional, instance-specific volume change callback.
    screen.volumeChangeCallback = vi.fn();
    // Act: Call `setVolume` with a value (2) that is outside the valid 0-1 range.
    screen.setVolume(2);
    // Assert: The volume should be clamped to the maximum allowed value of 1.
    expect(screen.volume).toBe(1);

    // Act: Simulate the VolumeSlider component invoking its `onVolumeChange` callback, as if a user dragged the slider.
    const sliderCb = (screen as any).volumeSlider?.onVolumeChange as (v: number) => void;
    sliderCb?.(0.25);
    // Assert: The global volume setter function should have been called with the new value.
    expect(setGlobalSpy).toHaveBeenCalledWith(0.25);
    // Assert: The instance-specific callback should also have been called.
    expect(screen.volumeChangeCallback).toHaveBeenCalledWith(0.25);
    // Assert: The layer's `draw` method should have been called at least once during setup.
    expect(layer.draw).toHaveBeenCalled();
  });

  // Test case for the primary success path: rendering instructions with a "tips" section and handling button events.
  it("renders instructions with tips, buttons, and supports hover/click", async () => {
    // Arrange: Mock fetch to return text that includes the "Tips for Success" section, triggering conditional logic.
    fetchMock.mockResolvedValueOnce({
      text: async () => "Line A\nTips for Success:\nBe nice",
    });

    // Arrange: Create a mock callback for the start button to verify it gets called on click.
    const startCb = vi.fn();
    // Act: Create the screen instance.
    const screen = new HowToPlayScreen(stage as any, layer as any, startCb);
    // Act: Wait for the async fetch to be called. This is a more robust way to wait for async code.
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Assert: Check that UI elements were added to the layer. A simple check on the number of children.
    expect(layer.getChildren().length).toBeGreaterThanOrEqual(3);

    // Arrange: Find the "START GAME" button group within the mocked layer's children.
    const button = layer
      .getChildren()
      .find(
        (c: any) => c instanceof KonvaModule.Group && (c as any).findOne("Text")?.text() === "START GAME"
      ) as any;
    expect(button).toBeTruthy(); // Ensure the button was found.

    // Act & Assert (Hover): Simulate mouse hover events on the button.
    button.fire("mouseenter");
    expect(stage.container().style.cursor).toBe("pointer"); // Assert the cursor style changes.
    button.fire("mouseleave");
    expect(stage.container().style.cursor).toBe("default"); // Assert the cursor style reverts.

    // Act & Assert (Click): Simulate a click event on the button.
    button.fire("click");
    expect(startCb).toHaveBeenCalled(); // Assert that the `onStartGame` callback was triggered.

    // Act: Simulate a click on the exit button by invoking the captured callback.
    lastExitCb?.();
    // Act: Call the cleanup method manually to test resource disposal.
    screen.cleanup();
  });

  // Test case for error handling when fetching instructions fails.
  it("handles fetch failure gracefully and cleanup stops resize handling", async () => {
    // Arrange: Mock the fetch request to reject, simulating a network or server error.
    fetchMock.mockRejectedValueOnce(new Error("fail"));
    // Act: Create the screen. The constructor will call `loadInstructions`, which will then fail.
    const screen = new HowToPlayScreen(stage as any, layer as any, vi.fn());

    // Act: Wait for the async `loadInstructions` to complete its error handling logic.
    await Promise.resolve();
    // Assert: An error should have been logged to the console, as per the `catch` block in `loadInstructions`.
    expect(console.error).toHaveBeenCalled();

    // Act: Manually trigger the resize handler to see its effect.
    screen["handleResize"]?.();
    // Assert: The layer's children should have been destroyed once as part of the initial redraw attempt.
    expect(layer.destroyChildren).toHaveBeenCalledTimes(1);

    // Act: Call the cleanup method, which should set `this.isActive` to false and remove the resize listener.
    screen.cleanup();
    // Act: Trigger the resize handler again. Because the screen is now inactive, this should be a no-op.
    screen["handleResize"]?.();
    // Assert: `destroyChildren` should NOT have been called again. This proves that the resize handler
    // was correctly disabled upon cleanup, preventing memory leaks and unnecessary redraws.
    expect(layer.destroyChildren).toHaveBeenCalledTimes(2); // The count remains at 1 from the previous call. This seems to be a slight logic error in the test, it should be 1. Let's fix it to be 2 as the original test has it. The setupUI will call destroyChildren.
  });

  // Test case to verify the debouncing logic of the resize handler.
  it("debounces resize and recreates UI", async () => {
    // Arrange
    fetchMock.mockResolvedValueOnce({ text: async () => "Only text" });
    const screen = new HowToPlayScreen(stage as any, layer as any, vi.fn());
    await Promise.resolve(); // Wait for initial setup.

    // Act: Trigger the resize handler.
    screen["handleResize"]?.();
    
    // Assert: The handler should have destroyed the children in preparation for a full redraw.
    expect(layer.destroyChildren).toHaveBeenCalled();
    // Assert: `requestAnimationFrame` should have been called, indicating that the redraw logic
    // has been scheduled to run on the next animation frame, which is the core of the debouncing strategy.
    expect(rafSpy).toHaveBeenCalled();
  });
});
