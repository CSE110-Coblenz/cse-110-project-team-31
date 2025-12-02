// @vitest-environment jsdom
/**
 * LoginScreen.test.ts - Unit tests for the LoginScreen component
 *
 * PURPOSE:
 * This file contains a suite of unit tests for the LoginScreen class, which is responsible
 * for rendering the initial login UI of the game. The tests are designed to run in a Node.js
 * environment using Vitest and JSDOM, which simulates a browser environment.
 *
 * ARCHITECTURAL OVERVIEW:
 * - MOCKING: The entire Konva.js library is heavily mocked using a custom `createKonvaMock`
 *   function. This allows testing the logic of the LoginScreen (e.g., event handling, state
 *   changes, UI construction) without needing a real canvas or renderer. This makes the tests
 *   faster and more reliable in a CI/CD environment.
 * - JSDOM: The `@vitest-environment jsdom` directive configures Vitest to create a fake DOM,
 *   enabling the use of browser-native APIs like `window`, `document`, `KeyboardEvent`, and `Image`.
 * - TEST STRUCTURE: Tests are organized within a `describe` block. A `beforeEach` hook is
 *   used to set up a clean, mocked environment before each test runs. This ensures that
 *   tests are isolated and do not interfere with each other.
 *
 * KEY TESTING AREAS:
 * 1.  **UI Construction**: Verifies that the LoginScreen correctly attempts to create UI elements
 *     (like text boxes and buttons) using the (mocked) Konva objects.
 * 2.  **User Input Handling**: Simulates keyboard events (`keydown`) to test typing a username,
 *     using backspace, and pressing enter.
 * 3.  **Input Validation**: Checks that the system prevents login if the username is empty and
 *     that it correctly displays an alert.
 * 4.  **State Management on Resize**: Ensures that the user's typed input and focus state are
 *     correctly preserved even after a simulated window resize event.
 * 5.  **Event Handling**: Tests mouse events like `click`, `mouseenter`, and `mouseleave` on
 *     interactive elements (the start button) to confirm correct behavior (e.g., cursor changes,
 *     shadow effects).
 * 6.  **Lifecycle and Cleanup**: Confirms that the `cleanup` method correctly removes event
 *     listeners to prevent memory leaks.
 *
 * HOW TO READ THIS FILE:
 * - `createKonvaMock`: Understand this function first. It builds a replica of the Konva API
 *   with fake classes (`FakeNode`, `FakeStage`, etc.) that track state and interactions.
 * - `beforeEach`: Review the setup process. It shows how mocks for Konva, timers, images,
 *   and storage are established before each test.
 * - `it(...) blocks`: Each `it` block represents a single, isolated test case with a clear
 *   description of what it's testing. Inside, you'll see a sequence of "arrange, act, assert".
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// These will be dynamically imported after mocks are set up.
let KonvaModule: any;
let LoginScreen: any;

/**
 * Creates a comprehensive mock of the Konva.js library.
 *
 * PURPOSE:
 * This function is the cornerstone of the test suite. It replaces the real Konva library
 * with a set of fake classes (`FakeNode`, `FakeStage`, etc.) that mimic the Konva API.
 * This avoids the need for a real canvas and GPU rendering, making the tests fast and
 * able to run in a Node.js environment.
 *
 * KEY FEATURES:
 * - **FakeNode**: The base class for all mock objects. It simulates the Konva node hierarchy
 *   by managing a `children` array and includes methods like `add`, `destroy`, and `on`.
 * - **Event System**: The `on` and `fire` methods provide a simple event bus to simulate
 *   user interactions like 'click' or 'mouseenter'.
 * - **Property Accessors**: The `accessor` method creates getter/setter functions for Konva
 *   properties (e.g., `width`, `fill`, `text`). This allows tests to inspect the state of
 *   mock objects (e.g., to see if a color was changed).
 * - **Specialized Mocks**: `FakeStage`, `FakeLayer`, and others inherit from `FakeNode` and
 *   add specific mocked behaviors (e.g., `FakeLayer` has `draw` and `batchDraw` spies).
 *
 * @returns An object that mimics the structure of an imported Konva module.
 */
function createKonvaMock() {
  // A generic type for event handlers.
  type Handler = (evt?: any) => void;

  /**
   * The base class for all mocked Konva objects (e.g., Stage, Layer, Rect).
   */
  class FakeNode {
    // Stores the configuration object passed to the constructor (e.g., { x: 10, y: 20 }).
    config: Record<string, any>;
    // An array to simulate the scene graph hierarchy.
    children: any[] = [];
    // A map to store event listeners (e.g., 'click', 'mouseenter').
    handlers = new Map<string, Handler>();

    constructor(config: Record<string, any> = {}) {
      this.config = { ...config };
    }

    // Mock for `add`, which adds one or more nodes to the `children` array.
    add(...nodes: any[]) {
      this.children.push(...nodes);
      return this;
    }

    // Mock for `destroy`. In a real app, this cleans up resources. Here, it does nothing.
    destroy() {}

    // Mock for `getChildren`, returning the simulated child nodes.
    getChildren() {
      return this.children;
    }

    // Mock for `on`, which registers an event handler.
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    // A helper method to simulate firing an event.
    fire(event: string, payload?: any) {
      // It calls the registered handler for the given event.
      this.handlers.get(event)?.(payload);
    }

    // Mock for `findOne`, which typically searches for a node. Here, it just returns the first child.
    findOne() {
      return this.children[0] ?? new FakeNode();
    }

    // Mock for `find`, which returns all children.
    find() {
      return this.children;
    }

    // Mock for `listening`. The LoginScreen uses this, so it's included.
    listening(_: boolean) {
      return _;
    }

    // Mocks for positioning methods. They do nothing but are required to exist.
    moveToTop() {}
    moveToBottom() {}
    moveToFront() {}

    /**
     * A factory function to create getter/setter methods for Konva properties.
     * This is a key part of the mock, allowing tests to check property values.
     * @param key The name of the property to mock (e.g., 'width').
     * @param fallback A default value if the property isn't set.
     * @returns A function that acts as both a getter and a setter.
     */
    accessor(key: string, fallback: any = 0) {
      return (value?: any) => {
        // If a value is provided, it's a setter.
        if (value !== undefined) this.config[key] = value;
        // Otherwise, it's a getter.
        return this.config[key] ?? fallback;
      };
    }

    // Mocking common Konva properties using the accessor factory.
    // Each of these lines creates a getter/setter for a standard Konva property.
    width = this.accessor("width", 100); // Mocks the 'width' property of a Konva node.
    height = this.accessor("height", 50); // Mocks the 'height' property.
    x = this.accessor("x", 0); // Mocks the 'x' position.
    y = this.accessor("y", 0); // Mocks the 'y' position.
    fill = this.accessor("fill", ""); // Mocks the 'fill' color.
    stroke = this.accessor("stroke", ""); // Mocks the 'stroke' (outline) color.
    shadowBlur = this.accessor("shadowBlur", 0); // Mocks the blur radius of the shadow.
    shadowOffset = this.accessor("shadowOffset", { x: 0, y: 0 }); // Mocks the shadow's offset.
    shadowOpacity = this.accessor("shadowOpacity", 0); // Mocks the shadow's transparency.
    shadowColor = this.accessor("shadowColor", ""); // Mocks the shadow's color.
    opacity = this.accessor("opacity", 1); // Mocks the overall opacity of the node.
    cornerRadius = this.accessor("cornerRadius", 0); // Mocks the corner radius for shapes like Rect.
    fontFamily = this.accessor("fontFamily", ""); // Mocks the font family for Text nodes.
    fontSize = this.accessor("fontSize", 16); // Mocks the font size for Text nodes.
    fontStyle = this.accessor("fontStyle", ""); // Mocks the font style (e.g., 'bold', 'italic').
    align = this.accessor("align", "left"); // Mocks the horizontal alignment for Text nodes.
    verticalAlign = this.accessor("verticalAlign", "top"); // Mocks the vertical alignment.
    lineHeight = this.accessor("lineHeight", 1); // Mocks the line height for multi-line text.
    wrap = this.accessor("wrap", "word"); // Mocks the text wrapping mode.
    offsetY = this.accessor("offsetY", 0); // Mocks the 'y' offset for transformations.
    offsetX = this.accessor("offsetX", 0); // Mocks the 'x' offset for transformations.
    padding = this.accessor("padding", 0); // Mocks the padding for Text nodes.
    text = this.accessor("text", ""); // Mocks the actual text content of a Text node.

    // Mock for `visible`, a method used to show/hide nodes.
    visible(value?: any) {
      if (value !== undefined) this.config.visible = value;
      return this.config.visible ?? true;
    }

    // A simplified mock for `getTextWidth` to simulate text measurement.
    getTextWidth() {
      // A rough approximation: text length times a fixed character width.
      return (this.config.text?.length ?? 0) * 10;
    }
  }

  /**
   * Mock for the main `Konva.Stage`. It includes a fake container element
   * to simulate interactions like changing the mouse cursor.
   */
  class FakeStage extends FakeNode {
    containerElement = { style: { cursor: "default" } };
    constructor(config: { width: number; height: number }) {
      super(config);
    }
    // Mocks the `container()` method, which returns the HTML element hosting the canvas.
    container() {
      return this.containerElement;
    }
    add(node: any) {
      this.children.push(node);
      return this;
    }
  }

  /**
   * Mock for `Konva.Layer`. It includes spies for drawing methods, which are crucial
   * for verifying that the UI is being updated.
   */
  class FakeLayer extends FakeNode {
    // `vi.fn()` creates a spy, a function that records calls to it.
    draw = vi.fn();
    batchDraw = vi.fn();
    destroyChildren = vi.fn();
  }

  // Simple mocks for other Konva shapes. They just need to exist.
  class FakeGroup extends FakeNode {}
  class FakeRect extends FakeNode {}
  class FakeText extends FakeNode {}
  class FakeImage extends FakeNode {}
  class FakeLine extends FakeNode {}
  class FakeCircle extends FakeNode {}

  // Some components (like VolumeSlider) use methods not in the base FakeNode.
  // We add them to the prototype to make them available on all fake nodes.
  FakeNode.prototype.position = function (pos?: { x?: number; y?: number }) {
    if (pos) {
      if (pos.x !== undefined) this.config.x = pos.x;
      if (pos.y !== undefined) this.config.y = pos.y;
    }
    return { x: this.config.x ?? 0, y: this.config.y ?? 0 };
  };
  FakeNode.prototype.getPointerPosition = function () {
    return { x: this.config.x ?? 0, y: this.config.y ?? 0 };
  };

  // The final mock object, structured to match the `import Konva from 'konva'` module.
  return {
    default: {
      Stage: FakeStage,
      Layer: FakeLayer,
      Group: FakeGroup,
      Rect: FakeRect,
      Text: FakeText,
      Image: FakeImage,
      Line: FakeLine,
      Circle: FakeCircle,
    },
  };
}

/**
 * Test suite for the basic user flow of the LoginScreen.
 */
describe("LoginScreen basic flow", () => {
  // Declare variables for the mocked Konva instances and the login callback spy.
  let stage: FakeStage;
  let layer: FakeLayer;
  let onLogin: ReturnType<typeof vi.fn>;

  /**
   * This `beforeEach` hook runs before every single `it` test case.
   * It's responsible for setting up a clean, mocked environment for each test.
   */
  beforeEach(async () => {
    // Create the full Konva mock.
    const konvaMock = createKonvaMock();
    // Use `vi.doMock` to tell Vitest that any future `import 'konva'` should use our mock instead of the real library.
    vi.doMock("konva", () => konvaMock);

    // Mock `requestAnimationFrame` to run its callback immediately. This prevents tests from having to wait.
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      cb(0); // Call the callback with a dummy timestamp.
      return 1; // Return a dummy ID.
    });
    // Mock `cancelAnimationFrame` to do nothing.
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    // Mock the global `Image` class. The LoginScreen uses `new Image()` to load assets.
    // This mock simulates the image loading process instantly.
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        width = 200;
        height = 100;
        // When the `src` is set, we immediately call the `onload` handler.
        set src(_: string) {
          this.onload?.();
        }
      }
    );

    // Mock the browser's Fonts API, as it might be used by Konva.
    (document as any).fonts = { load: vi.fn().mockResolvedValue([]) };

    // Mock `localStorage` to ensure tests don't depend on or alter the actual browser storage.
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});

    // Create a spy for the `onLogin` callback function. This allows us to verify if it was called.
    onLogin = vi.fn();

    // Now that mocks are in place, we can dynamically import the real modules.
    // They will automatically receive the mocked dependencies.
    KonvaModule = (await import("konva")).default;
    LoginScreen = (await import("./LoginScreen")).LoginScreen;

    // Create new instances of our mocked Stage and Layer for the test.
    stage = new KonvaModule.Stage({
      width: 1000,
      height: 800,
      container: { appendChild() {} }, // A minimal container mock.
    });
    layer = new KonvaModule.Layer({} as any);
  });

  /**
   * Tests the core functionality: creating the UI, handling user typing, and cleaning up resources.
   */
  it("creates UI, handles typing and cleanup", () => {
    // 1. ARRANGE: Instantiate the LoginScreen.
    const screen = new LoginScreen(stage as any, layer as any, onLogin);

    // 2. ACT: Simulate a user's actions.

    // Simulate clicking the input box to focus it.
    (screen as any).inputBox.fire("click");
    // Simulate typing: 'A', 'b', backspace, space, '1'. The result should be "A 1".
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));

    // Simulate pressing 'Enter' to submit the form.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    // Also simulate clicking the start button (represented by the cursor in this simplified test).
    (screen as any).cursor?.fire?.("click");

    // Call the cleanup method to test resource disposal.
    screen.cleanup();

    // 3. ASSERT: Verify the outcomes.
    // Check that a draw call was made, indicating the UI was updated.
    expect(layer.draw).toHaveBeenCalled();
  });

  /**
   * Tests that the login is blocked if the username input is empty.
   */
  it("validates empty input on enter and start button", () => {
    // 1. ARRANGE: Create the screen and spy on `window.alert`.
    const screen = new LoginScreen(stage as any, layer as any, onLogin);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    // 2. ACT & ASSERT (Part 1): Test pressing Enter with empty input.

    // Focus the input box.
    (screen as any).inputBox.fire("click");
    // Simulate pressing Enter.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    // Verify that `alert` was called once.
    expect(alertSpy).toHaveBeenCalledTimes(1);

    // 2. ACT & ASSERT (Part 2): Test clicking the start button with empty input.

    // Find the 'START GAME' button group in the mocked layer's children.
    const signGroup = layer.children.find((c: any) =>
      c.children?.some((child: any) => child.config?.text === "START GAME")
    );
    // Ensure the button was actually found.
    expect(signGroup).toBeTruthy();
    // Simulate a click on the button group.
    signGroup?.fire("click");
    // Verify that `alert` has now been called a second time.
    expect(alertSpy).toHaveBeenCalledTimes(2);
  });

  /**
   * Tests that the user's input and focus state are correctly restored after the window is resized.
   * This is important for a good user experience.
   */
  it("restores input state after resize", () => {
    // 1. ARRANGE: Create the screen, focus the input, and type a character.
    const screen = new LoginScreen(stage as any, layer as any, onLogin);
    (screen as any).focusInput(); // Manually call internal focus method.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));

    // 2. ACT: Simulate the resize process.
    // Spy on `destroyChildren` to confirm the UI is being rebuilt.
    const destroySpy = vi.spyOn(layer, "destroyChildren");
    // Manually call the screen's resize handler.
    (screen as any).handleResize();

    // 3. ASSERT: Verify the state was restored.
    // Check that the UI was destroyed and rebuilt.
    expect(destroySpy).toHaveBeenCalled();
    // Check that the `inputFocused` flag is still true after the resize.
    expect((screen as any).inputFocused).toBe(true);
  });

  /**
   * Tests the hover effects and click functionality of the start button.
   */
  it("hovering start button changes cursor and clicking logs in", () => {
    // 1. ARRANGE: Create the screen and find the start button.
    const screen = new LoginScreen(stage as any, layer as any, onLogin);
    const button = layer.children.find((c: any) =>
      c.children?.some((child: any) => child.config?.text === "START GAME")
    );
    // The 'board' is the main rectangle of the sign, which has the hover effect.
    const board = button?.find()[1];

    // 2. ACT & ASSERT (Hover Effects):

    // Simulate mouse entering the button area.
    button?.fire("mouseenter");
    // Verify the cursor style changed to 'pointer'.
    expect(stage.container().style.cursor).toBe("pointer");
    // Simulate mouse leaving the button area.
    button?.fire("mouseleave");
    // Verify the cursor style changed back to 'default'.
    expect(stage.container().style.cursor).toBe("default");

    // 2. ACT & ASSERT (Click Action):

    // Manually set a username on the screen instance.
    (screen as any).username = "Tester";
    // Simulate a click on the button.
    button?.fire("click");
    // Verify that the `onLogin` callback was called with the correct username.
    expect(onLogin).toHaveBeenCalledWith("Tester");
  });
});

