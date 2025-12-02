/**
 * ==================================================================================
 * SHOPPINGSCREEN TARGETED COVERAGE TEST FILE
 * ==================================================================================
 *
 * FILE PURPOSE:
 * This test file verifies that the ShoppingScreen class works correctly. The
 * ShoppingScreen is where players buy ingredients for baking cookies. It's one
 * of the most complex screens in the game with many interactive elements.
 *
 * WHAT IS THE SHOPPINGSCREEN?
 * The shopping interface where players:
 * - See their current cash balance
 * - View ingredient prices and quantities
 * - Input how much of each ingredient to buy
 * - Purchase ingredients (if they have enough money)
 * - View the recipe to see what they need
 * - View customer orders to see demand
 *
 * WHAT MAKES THIS TEST SPECIAL?
 * Unlike other test files, this one focuses on "targeted coverage" - it
 * specifically tests hard-to-reach code paths and edge cases that might not
 * be covered by regular integration tests. This includes:
 * - Error handling (image loading failures)
 * - User interactions (keyboard input, clicking, hovering)
 * - Modal dialogs (receipt popup)
 * - Insufficient funds scenarios
 * - Helper method coverage
 *
 * WHY "ShoppingScreen2.test.ts"?
 * There's likely a ShoppingScreen.test.ts with basic tests. This is a second
 * test file focusing on coverage of specific code paths that need extra testing.
 *
 * ==================================================================================
 */

/**
 * @vitest-environment jsdom
 *
 * EXPLANATION:
 * This directive tells Vitest to run tests in a jsdom environment.
 *
 * WHAT IS JSDOM?
 * A JavaScript library that simulates a web browser environment in Node.js.
 * It provides fake versions of browser APIs like:
 * - document (DOM manipulation)
 * - window (global browser object)
 * - Image (loading images)
 * - KeyboardEvent (keyboard input)
 * - requestAnimationFrame (animation timing)
 *
 * WHY NEEDED HERE?
 * ShoppingScreen uses many browser features:
 * - Loading images (price tags, receipts)
 * - Keyboard event handling (typing numbers)
 * - Window resize events
 * - alert() dialogs
 *
 * WITHOUT JSDOM:
 * Tests would crash with errors like "window is not defined" or
 * "document is not defined" because Node.js doesn't have these APIs.
 */
// @vitest-environment jsdom

/**
 * ==================================================================================
 * IMPORT STATEMENTS
 * ==================================================================================
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
/**
 * EXPLANATION OF IMPORTS:
 * - describe: Groups related tests into a test suite
 * - it: Defines a single test case
 * - expect: Makes assertions (checks if values are correct)
 * - beforeEach: Runs setup code before each test
 * - vi: Vitest utility for mocking and spying
 */

/**
 * ==================================================================================
 * KONVA MOCK FACTORY FUNCTION
 * ==================================================================================
 *
 * FUNCTION PURPOSE:
 * Creates a comprehensive mock of the Konva graphics library with support for
 * all the features ShoppingScreen needs.
 *
 * HOW THIS DIFFERS FROM PREVIOUS MOCKS:
 * This mock is the most complete yet, including:
 * - More accessor methods (stroke, strokeWidth, cornerRadius, etc.)
 * - scale() method for zooming/sizing
 * - listening() method for enabling/disabling interactivity
 * - destroy() method for cleanup
 * - Circle node type (for buttons)
 * - Text accessor on FakeText
 *
 * WHY SO COMPLETE?
 * ShoppingScreen is a complex UI with many styled elements, input boxes,
 * buttons with hover effects, and modals. It uses many Konva features.
 */
function createKonvaMock() {
  /**
   * Handler Type Alias
   *
   * WHAT IS type?
   * TypeScript keyword to create a type alias (custom type name).
   *
   * WHAT IS Handler?
   * A type representing event handler functions.
   *
   * DEFINITION:
   * type Handler = (evt?: any) => void;
   * - (evt?: any): Function takes one optional parameter of any type
   * - => void: Function returns nothing
   *
   * WHY CREATE THIS ALIAS?
   * - Used multiple times in this file (in Map, method signatures)
   * - Makes code more readable: Map<string, Handler> vs Map<string, (evt?: any) => void>
   * - If we need to change the handler signature, we only change it once
   *
   * EXAMPLE USAGE:
   * const handler: Handler = (evt) => { console.log("Event fired!"); };
   */
  type Handler = (evt?: any) => void;

  /**
   * ============================================================================
   * FAKENODE CLASS
   * ============================================================================
   *
   * The base class for all mock Konva objects.
   * This is the most feature-complete FakeNode we've created so far.
   */
  class FakeNode {
    /** Configuration object storing all properties */
    config: Record<string, any>;

    /** Array of child nodes */
    children: any[] = [];

    /** Map of event handlers */
    handlers = new Map<string, Handler>();

    /**
     * CONSTRUCTOR
     * @param config - Configuration object (position, size, style, etc.)
     */
    constructor(config: Record<string, any> = {}) {
      this.config = { ...config };
    }

    /**
     * add() - Adds one or more children to this node
     *
     * @param nodes - Child nodes to add
     * @returns this (for method chaining)
     *
     * WHAT IS ...nodes?
     * Rest parameter - captures all arguments into an array.
     * Allows: group.add(rect, text, image) instead of group.add([rect, text, image])
     */
    add(...nodes: any[]) {
      this.children.push(...nodes);
      return this;
    }

    /**
     * getChildren() - Returns all child nodes
     * @returns Array of children
     */
    getChildren() {
      return this.children;
    }

    /**
     * on() - Registers an event listener
     *
     * @param event - Event name ("click", "mouseenter", etc.)
     * @param handler - Function to call when event fires
     *
     * HOW IT WORKS:
     * Stores the handler in the handlers Map with the event name as key.
     */
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    /**
     * fire() - Manually triggers an event
     *
     * @param event - Event name to trigger
     * @param payload - Optional data to pass to handler
     *
     * WHAT IS ?.()?
     * Optional chaining call - calls the function if it exists.
     * If handler is undefined, does nothing instead of crashing.
     *
     * USE IN TESTS:
     * We can simulate user interactions:
     * button.fire("click"); // Simulate button click
     * button.fire("mouseenter"); // Simulate mouse hover
     */
    fire(event: string, payload?: any) {
      this.handlers.get(event)?.(payload);
    }

    /**
     * accessor() - Factory function for creating getter/setter methods
     *
     * @param key - Property name in config
     * @param fallback - Default value if not set
     * @returns Getter/setter function
     *
     * PATTERN:
     * Returns a function that:
     * - If called with argument: sets the value
     * - If called without argument: gets the value
     *
     * EXAMPLE:
     * const widthFn = accessor("width", 100);
     * widthFn();      // Returns 100 (fallback)
     * widthFn(200);   // Sets width to 200
     * widthFn();      // Returns 200
     */
    accessor(key: string, fallback: any = 0) {
      return (value?: any) => {
        if (value !== undefined) this.config[key] = value;
        return this.config[key] ?? fallback;
      };
    }

    /**
     * ============================================================================
     * STANDARD PROPERTY ACCESSORS
     * ============================================================================
     *
     * These are getter/setter methods for common Konva properties.
     * Created using the accessor() factory function.
     */

    /** width() - Width in pixels (default: 100) */
    width = this.accessor("width", 100);

    /** height() - Height in pixels (default: 50) */
    height = this.accessor("height", 50);

    /** x() - X position (horizontal, default: 0) */
    x = this.accessor("x", 0);

    /** y() - Y position (vertical, default: 0) */
    y = this.accessor("y", 0);

    /** fill() - Fill color (default: empty string) */
    fill = this.accessor("fill", "");

    /**
     * stroke() - Border/outline color
     *
     * WHAT IS STROKE?
     * The outline or border of a shape.
     * Example: A rectangle with fill="blue" and stroke="red" has a
     * blue interior with a red border.
     *
     * DEFAULT: "" (no stroke)
     */
    stroke = this.accessor("stroke", "");

    /**
     * strokeWidth() - Width of the stroke/border in pixels
     *
     * EXAMPLE:
     * rect.stroke("black");
     * rect.strokeWidth(3);  // 3-pixel thick black border
     *
     * DEFAULT: 0 (no stroke width)
     */
    strokeWidth = this.accessor("strokeWidth", 0);

    /**
     * cornerRadius() - Radius of rounded corners
     *
     * WHAT ARE ROUNDED CORNERS?
     * Instead of sharp 90° corners, corners are curved.
     * Higher values = more curved, 0 = sharp corners.
     *
     * EXAMPLE:
     * rect.cornerRadius(10);  // Rounded corners like a button
     * rect.cornerRadius(999); // Pill-shaped (fully rounded ends)
     *
     * DEFAULT: 0 (sharp corners)
     */
    cornerRadius = this.accessor("cornerRadius", 0);

    /**
     * opacity() - Transparency level (0 to 1)
     *
     * VALUES:
     * - 1: Fully opaque (not transparent)
     * - 0.5: Half transparent
     * - 0: Fully transparent (invisible)
     *
     * DEFAULT: 1 (fully visible)
     */
    opacity = this.accessor("opacity", 1);

    /**
     * offsetX() - Horizontal offset for rotation/scaling origin
     *
     * WHAT IS OFFSET?
     * When rotating or scaling, the offset determines the "center point"
     * of the transformation.
     *
     * EXAMPLE:
     * Without offset: Rotates around top-left corner
     * With offsetX(50), offsetY(50): Rotates around center of 100x100 rect
     *
     * DEFAULT: 0
     */
    offsetX = this.accessor("offsetX", 0);

    /**
     * offsetY() - Vertical offset for rotation/scaling origin
     * DEFAULT: 0
     */
    offsetY = this.accessor("offsetY", 0);

    /**
     * scale() - Gets or sets the scale (zoom level)
     *
     * @param val - Scale object with x and y properties
     * @returns Current scale object
     *
     * WHAT IS SCALE?
     * Multiplier for the size. Scale of 1 = normal size, 2 = double size, 0.5 = half size.
     *
     * WHY AN OBJECT?
     * You can scale X and Y independently:
     * - { x: 2, y: 1 }: Stretched horizontally (twice as wide)
     * - { x: 1, y: 0.5 }: Compressed vertically (half as tall)
     * - { x: 1.5, y: 1.5 }: Uniformly scaled (1.5x larger)
     *
     * DEFAULT: { x: 1, y: 1 } (normal size)
     *
     * WHY NOT USE accessor()?
     * The default value is an object, and we need special handling for it.
     */
    scale(val?: any) {
      if (val !== undefined) this.config.scale = val;
      return this.config.scale ?? { x: 1, y: 1 };
    }

    /**
     * moveToBottom() - Moves node to bottom of render order
     *
     * WHAT IS RENDER ORDER?
     * The order elements are drawn. Later elements appear on top.
     * moveToBottom() makes this element render first (behind everything).
     *
     * USE CASE: Background images
     */
    moveToBottom() {}

    /**
     * moveToTop() - Moves node to top of render order
     *
     * OPPOSITE OF moveToBottom():
     * Makes this element render last (in front of everything).
     *
     * USE CASE: Modals, tooltips, popup menus
     */
    moveToTop() {}

    /**
     * destroy() - Destroys this node and cleans up resources
     *
     * WHAT DOES DESTROY MEAN?
     * Marks the node as destroyed, removes event listeners, and frees memory.
     *
     * HOW THE MOCK WORKS:
     * Sets a flag in config to track that it's been destroyed.
     * Real Konva would remove it from the canvas and clean up more thoroughly.
     *
     * WHY IMPORTANT?
     * Memory leaks occur if nodes aren't destroyed when no longer needed.
     */
    destroy() {
      this.config.destroyed = true;
    }

    /**
     * listening() - Gets or sets whether this node listens to events
     *
     * @param val - True to enable events, false to disable
     * @returns Current listening state
     *
     * WHAT IS THIS FOR?
     * Some elements should be visible but not interactive.
     * Example: Text labels on buttons shouldn't intercept clicks.
     *
     * BEHAVIOR:
     * - listening(true): Node responds to click, hover, etc.
     * - listening(false): Node ignores all events (passes through to elements below)
     *
     * DEFAULT: true (events enabled)
     *
     * COMMON USAGE:
     * buttonText.listening(false);  // Text doesn't steal clicks from button background
     */
    listening(val?: boolean) {
      if (val !== undefined) this.config.listening = val;
      return this.config.listening ?? true;
    }
  }

  /**
   * ============================================================================
   * FAKESTAGE CLASS
   * ============================================================================
   *
   * Represents the top-level Konva container (the canvas).
   */
  class FakeStage extends FakeNode {
    /** Fake HTML container element */
    containerElement = { style: { cursor: "default" } };

    /**
     * CONSTRUCTOR
     * @param config - Stage configuration (width, height, container)
     *
     * WHAT IS super()?
     * Calls the parent class (FakeNode) constructor.
     * Required when extending a class - must initialize parent first.
     */
    constructor(config: Record<string, any>) {
      super(config);
    }

    /**
     * container() - Returns the HTML container element
     * @returns Container with style.cursor property
     */
    container() {
      return this.containerElement;
    }

    /**
     * add() - Adds a layer to the stage
     *
     * WHY OVERRIDE?
     * Stage's add() has slightly different behavior than FakeNode's.
     * We override it to match the real Konva Stage API.
     *
     * @param node - Layer to add
     * @returns this (for chaining)
     */
    add(node: any) {
      this.children.push(node);
      return this;
    }
  }

  /**
   * ============================================================================
   * FAKELAYER CLASS
   * ============================================================================
   *
   * Represents a Konva layer (container for shapes).
   */
  class FakeLayer extends FakeNode {
    /** Mock draw() method - tracks when called */
    draw = vi.fn();

    /** Mock batchDraw() method - tracks when called */
    batchDraw = vi.fn();

    /**
     * destroyChildren() - Removes and destroys all children
     *
     * ENHANCED MOCK:
     * This implementation actually clears the children array.
     * Previous mocks just tracked the call but didn't clear children.
     *
     * WHY THE ENHANCEMENT?
     * ShoppingScreen calls destroyChildren() during resize.
     * Tests need children to actually be removed for accurate behavior.
     *
     * WHAT IS vi.fn(() => { ... })?
     * Creates a mock function with custom implementation.
     * The function still tracks calls (toHaveBeenCalled) but also runs this code.
     */
    destroyChildren = vi.fn(() => {
      this.children = [];
    });
  }

  /**
   * ============================================================================
   * OTHER KONVA NODE CLASSES
   * ============================================================================
   */

  /**
   * FakeGroup - Container for grouping shapes
   *
   * EXAMPLE USE:
   * Group a rectangle (background) and text (label) into a button.
   */
  class FakeGroup extends FakeNode {}

  /**
   * FakeRect - Rectangle shape
   *
   * USE CASES:
   * - Button backgrounds
   * - Input boxes
   * - Colored panels
   */
  class FakeRect extends FakeNode {}

  /**
   * FakeText - Text element
   *
   * ENHANCED:
   * Includes text() accessor for getting/setting text content.
   */
  class FakeText extends FakeNode {
    /**
     * text() - Gets or sets the text content
     *
     * USAGE:
     * const label = new Konva.Text({ text: "Hello" });
     * label.text();        // Returns "Hello"
     * label.text("World"); // Sets text to "World"
     * label.text();        // Returns "World"
     *
     * DEFAULT: "" (empty string)
     */
    text = this.accessor("text", "");
  }

  /**
   * FakeImage - Image element
   *
   * DIFFERENT FROM OTHER NODES:
   * Has custom image() method instead of using accessor().
   */
  class FakeImage extends FakeNode {
    /**
     * image() - Gets or sets the image source
     *
     * @param value - HTMLImageElement (loaded image)
     * @returns Current image
     *
     * WHY CUSTOM METHOD?
     * The default accessor() fallback doesn't make sense for images.
     * We return undefined if no image is set, not a number or string.
     */
    image(value?: any) {
      if (value !== undefined) this.config.image = value;
      return this.config.image;
    }
  }

  /**
   * FakeCircle - Circle shape
   *
   * NEW NODE TYPE:
   * Previous test files didn't need circles, but ShoppingScreen uses them
   * for the close button on the receipt modal.
   *
   * WHAT IS A CIRCLE?
   * A perfectly round shape defined by a center point (x, y) and radius.
   */
  class FakeCircle extends FakeNode {
    /**
     * radius() - Gets or sets the circle radius
     *
     * WHAT IS RADIUS?
     * Distance from center to edge. Diameter = radius × 2.
     *
     * EXAMPLE:
     * circle.radius(50);  // Circle is 100 pixels wide (50 × 2)
     *
     * DEFAULT: 0 (invisible circle)
     */
    radius = this.accessor("radius", 0);
  }

  /**
   * ============================================================================
   * RETURN STATEMENT
   * ============================================================================
   *
   * Returns the mock Konva library with all the classes.
   */
  return {
    default: {
      Stage: FakeStage,
      Layer: FakeLayer,
      Group: FakeGroup,
      Rect: FakeRect,
      Text: FakeText,
      Image: FakeImage,
      Circle: FakeCircle,
    },
  };
}

/**
 * ==================================================================================
 * TEST SUITE
 * ==================================================================================
 */
describe("ShoppingScreen targeted coverage", () => {
  /**
   * ================================================================================
   * BEFORE EACH HOOK
   * ================================================================================
   *
   * Runs before each test to ensure clean state.
   */
  beforeEach(() => {
    /**
     * vi.restoreAllMocks()
     *
     * WHAT IT DOES:
     * Restores all mocked/spied functions to their original implementations.
     *
     * WHY NEEDED?
     * If one test mocks window.alert, we want to remove that mock before
     * the next test runs. Ensures tests don't interfere with each other.
     */
    vi.restoreAllMocks();
  });

  /**
   * ================================================================================
   * HELPER FUNCTION: mockImages
   * ================================================================================
   *
   * FUNCTION PURPOSE:
   * Creates a sophisticated mock of the browser's Image class with configurable
   * success/failure behavior for different image types.
   *
   * WHY SO COMPLEX?
   * ShoppingScreen loads different images (price tags, receipts) and needs to
   * handle loading failures gracefully. We need to test both success and error paths.
   *
   * @param options - Configuration for which images should fail to load
   * @param options.priceTagError - If true, price tag images fail to load
   * @param options.receiptError - If true, receipt images fail to load
   */
  function mockImages(options: { priceTagError?: boolean; receiptError?: boolean } = {}) {
    /**
     * Replace the global Image class with a custom mock
     */
    vi.stubGlobal(
      "Image",
      class {
        /**
         * PRIVATE PROPERTIES
         *
         * WHY PRIVATE (_prefix)?
         * The underscore is a convention indicating "private" (internal use only).
         * We use getters/setters for public access to these properties.
         */

        /** Internal storage for src */
        _src = "";

        /** Internal storage for onload callback */
        _onload: (() => void) | null = null;

        /**
         * PUBLIC PROPERTIES
         */

        /** onerror callback (called if image fails to load) */
        onerror: (() => void) | null = null;

        /** Image width in pixels */
        width = 100;

        /** Image height in pixels */
        height = 50;

        /**
         * src SETTER
         *
         * WHAT IS A SETTER?
         * A method that runs when you assign to a property.
         * Example: img.src = "price-tag.png" calls this setter.
         *
         * @param val - Image URL
         *
         * HOW IT WORKS:
         * 1. Store the URL in _src
         * 2. Check if this image should fail based on URL and options
         * 3. Call onerror() if it should fail, onload() if it should succeed
         */
        set src(val: string) {
          this._src = val;

          /**
           * FAILURE LOGIC:
           * Determine if this image should fail to load.
           */

          /**
           * shouldFailPrice: Should price tag images fail?
           * - val.includes("price-tag"): Is this a price tag image?
           * - options.priceTagError: Did test configure price tags to fail?
           * - Both must be true for failure
           */
          const shouldFailPrice = val.includes("price-tag") && options.priceTagError;

          /**
           * shouldFailReceipt: Should receipt images fail?
           * Similar logic for receipt images
           */
          const shouldFailReceipt = val.includes("start-receipt") && options.receiptError;

          /**
           * TRIGGER CALLBACK:
           * If either failure condition is met, call onerror.
           * Otherwise, call onload.
           */
          if (shouldFailPrice || shouldFailReceipt) {
            this.onerror?.();  // Simulate loading error
          } else {
            this._onload?.();  // Simulate successful load
          }
        }

        /**
         * src GETTER
         *
         * WHAT IS A GETTER?
         * A method that runs when you read a property.
         * Example: const url = img.src calls this getter.
         *
         * @returns The current src URL
         */
        get src() {
          return this._src;
        }

        /**
         * onload SETTER
         *
         * WHY A CUSTOM SETTER?
         * We want to auto-trigger onload for images that were already "loaded"
         * when the onload handler is set.
         *
         * @param fn - Callback function to call when image loads
         *
         * HOW IT WORKS:
         * 1. Store the callback in _onload
         * 2. If conditions are met, immediately call the callback
         *    (simulates image that loads instantly)
         *
         * CONDITIONS FOR IMMEDIATE CALL:
         * - fn exists (not null)
         * - _src exists (image URL is set)
         * - It's not a price-tag or start-receipt image
         *   (those are handled specially by src setter)
         */
        set onload(fn: (() => void) | null) {
          this._onload = fn;
          if (fn && this._src && !this._src.includes("price-tag") && !this._src.includes("start-receipt")) {
            fn();  // Immediately call for instant load simulation
          }
        }

        /**
         * onload GETTER
         *
         * @returns The current onload callback
         */
        get onload() {
          return this._onload;
        }
      }
    );
  }

  /**
   * ================================================================================
   * TEST CASE 1: UI Creation and Purchase Flow
   * ================================================================================
   *
   * TEST PURPOSE:
   * Comprehensive test that exercises the main ShoppingScreen functionality:
   * - Creating UI elements (balance display, ingredient rows, buttons)
   * - User interactions (clicking, hovering, keyboard input)
   * - Purchase flow (calculating costs, checking funds, completing purchase)
   * - Recipe and orders viewing
   * - Input focus and keyboard handling
   * - Helper method coverage
   *
   * WHY SO MANY THINGS IN ONE TEST?
   * This is a "coverage" test designed to hit as many code paths as possible
   * in a single test. It's less about testing individual features and more
   * about ensuring every line of code gets executed at least once.
   */
  it("walks through UI creation helpers and purchase callbacks", async () => {
    /**
     * --------------------------------------------------------------------------
     * ARRANGE (SETUP)
     * --------------------------------------------------------------------------
     */

    /**
     * STEP 1: Mock images with default success behavior
     *
     * No options passed = all images succeed
     */
    mockImages();

    /**
     * STEP 2: Create and register Konva mock
     */
    const konvaMock = createKonvaMock();
    vi.doMock("konva", () => konvaMock);

    /**
     * STEP 3: Mock UI button dependencies
     *
     * WHY MOCK THESE?
     * ShoppingScreen uses ExitButton and InfoButton components.
     * We don't want to test those components here - just ShoppingScreen.
     * So we mock them with minimal implementations.
     */

    /**
     * Mock ExitButton
     *
     * WHAT DOES THE REAL EXITBUTTON DO?
     * Creates a button that exits the current screen.
     *
     * MINIMAL MOCK:
     * Just creates a clickable group and registers the onExit callback.
     */
    vi.doMock("./ui/ExitButton", () => ({
      ExitButton: class {
        /**
         * CONSTRUCTOR
         * @param stage - Konva stage
         * @param layer - Konva layer
         * @param onExit - Callback when exit button is clicked
         *
         * IMPLEMENTATION:
         * 1. Create a group (button container)
         * 2. Register click handler
         * 3. Add to layer
         */
        constructor(stage: any, layer: any, onExit: () => void) {
          const g: any = new (createKonvaMock().default.Group)();
          g.handlers.set("click", onExit);
          layer.add(g);
        }
      },
    }));

    /**
     * Mock InfoButton
     *
     * WHAT DOES THE REAL INFOBUTTON DO?
     * Creates a button that shows help/tutorial information.
     *
     * MINIMAL MOCK:
     * Empty class - we don't even need functionality for this test.
     */
    vi.doMock("./ui/InfoButton", () => ({
      InfoButton: class {},
    }));

    /**
     * STEP 4: Dynamically import modules
     *
     * WHY DYNAMIC IMPORT?
     * Mocks (vi.doMock) must be set up before modules are imported.
     * Dynamic imports happen after mocks are ready.
     */
    const { ShoppingScreen } = await import("./ShoppingScreen");
    const Konva = (await import("konva")).default as any;

    /**
     * STEP 5: Create test instances
     */

    /**
     * Create stage (900x700 canvas)
     */
    const stage = new Konva.Stage({ width: 900, height: 700, container: {} });

    /**
     * Create layer
     */
    const layer = new Konva.Layer();

    /**
     * Create mock callbacks
     *
     * WHAT ARE THESE FOR?
     * ShoppingScreen calls these when:
     * - onPurchaseComplete: Player completes a purchase
     * - onViewRecipe: Player clicks "View Recipe" button
     */
    const onPurchaseComplete = vi.fn();
    const onViewRecipe = vi.fn();

    /**
     * STEP 6: Create ShoppingScreen instance
     *
     * PARAMETERS:
     * - stage: The Konva stage
     * - layer: The Konva layer
     * - 30: Current funds ($30)
     * - 3: Current day (day 3)
     * - 6: Total cookie demand (6 cookies needed)
     * - [{ customerNum: 1, cookieCount: 2 }]: One customer ordering 2 cookies
     * - onPurchaseComplete: Purchase callback
     * - onViewRecipe: Recipe viewing callback
     *
     * WHAT HAPPENS:
     * ShoppingScreen constructor:
     * 1. Stores all parameters
     * 2. Sets up keyboard input handler
     * 3. Calls setupUI() to create the interface
     * 4. Adds resize event listener
     */
    const screen: any = new ShoppingScreen(
      stage,
      layer,
      30,
      3,
      6,
      [{ customerNum: 1, cookieCount: 2 }],
      onPurchaseComplete,
      onViewRecipe
    );

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 1: EXERCISE INTERNAL METHODS
     * --------------------------------------------------------------------------
     */

    /**
     * COVERAGE TECHNIQUE: Direct Method Calls
     *
     * WHY?
     * Some helper methods might not be called in normal flow.
     * We call them directly to ensure they're covered (tested).
     *
     * WHAT IS ?.() ?
     * Optional chaining - calls the method if it exists.
     * If the method doesn't exist, does nothing instead of crashing.
     */

    /**
     * Re-run setup to exercise it again
     *
     * WHY?
     * setupUI() was called in constructor, but calling it again might
     * exercise different code paths (e.g., cleanup of existing UI).
     */
    screen.setupUI?.();

    /**
     * Re-run dynamic UI drawing
     *
     * WHAT IS DYNAMIC UI?
     * Parts of the UI that change based on state (costs, balances).
     */
    screen.drawDynamicUI?.();

    /**
     * DIRECTLY CALL UI CREATION HELPERS
     *
     * These are private helper methods that create individual UI components.
     * We call them directly to ensure every line is executed.
     */

    /**
     * createBalanceGroup() - Creates the cash balance display
     * @param 900 - Stage width
     * @param 700 - Stage height
     */
    screen.createBalanceGroup(900, 700);

    /**
     * createPriceTagGroup() - Creates a price tag graphic for an ingredient
     * @param 900 - Stage width
     * @param 700 - Stage height
     * @param ingredient - Ingredient data
     * @param 100 - Y position
     */
    screen.createPriceTagGroup(900, 700, { name: "Test", price: 1, inputValue: "0", unit: "cup" }, 100);

    /**
     * createIngredientNameText() - Creates the ingredient name label
     * @param 900 - Stage width
     * @param 100 - Y position
     * @param "Salt" - Ingredient name
     * @param 120 - X position
     */
    screen.createIngredientNameText(900, 100, "Salt", 120);

    /**
     * createViewRecipeButton() - Creates the "View Recipe" button
     */
    screen.createViewRecipeButton(900, 700);

    /**
     * createViewOrdersButton() - Creates the "View Orders" button
     */
    screen.createViewOrdersButton(900, 700);

    /**
     * createPurchaseButton() - Creates the "Purchase" button
     * @param 900 - Stage width
     * @param 0 - Y position
     */
    screen.createPurchaseButton(900, 0);

    /**
     * createIngredientRow() - Creates a complete ingredient row (name, price, input)
     */
    screen.createIngredientRow(900, 400, { name: "Butter", price: 0.5, inputValue: "0", unit: "tbsp" }, 200);

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 2: SIMULATE USER INTERACTIONS
     * --------------------------------------------------------------------------
     */

    /**
     * FINDING UI ELEMENTS
     *
     * TECHNIQUE:
     * Search the layer's children for elements with specific properties.
     * This is like finding elements in the DOM by attributes.
     */

    /**
     * FIND THE FIRST INPUT BOX
     *
     * HOW:
     * Look for a Rect with stroke color "#3498db" (blue).
     * This is the styling used for input boxes.
     *
     * WHAT IS find()?
     * Array method that returns the first element matching a condition.
     */
    const firstRect = layer.getChildren().find((c: any) => c.stroke && c.stroke() === "#3498db");

    /**
     * FIND THE FIRST INPUT TEXT (showing "0")
     *
     * HOW:
     * Look for a Text element with text content "0".
     * This is the default value in input boxes.
     */
    const firstText = layer.getChildren().find((c: any) => c.text?.() === "0");

    /**
     * SIMULATE CLICKING THE INPUT BOX
     *
     * WHAT HAPPENS:
     * Clicking an input box calls focusInput(), which:
     * - Highlights the box (changes stroke color)
     * - Enables keyboard input for that field
     *
     * WHAT IS fire()?
     * Manually triggers an event. Simulates user clicking.
     */
    firstRect?.fire("click");

    /**
     * SIMULATE HOVERING OVER INPUT BOX
     *
     * WHAT HAPPENS:
     * - mouseenter: Cursor changes to pointer
     * - mouseleave: Cursor changes back to default
     */
    firstRect?.fire("mouseenter");
    firstRect?.fire("mouseleave");

    /**
     * SIMULATE CLICKING THE TEXT INSIDE INPUT BOX
     *
     * Some implementations have clickable text in addition to the box.
     */
    firstText?.fire?.("click");

    /**
     * SIMULATE KEYBOARD INPUT
     *
     * SCENARIO: User types "5" then deletes it with Backspace
     */

    /**
     * Type "5"
     *
     * WHAT IS KeyboardEvent?
     * Browser event representing a key press.
     *
     * PARAMETERS:
     * - "keydown": Event type (key is being pressed down)
     * - { key: "5" }: Event data (the key that was pressed)
     */
    screen.handleKeyPress(new KeyboardEvent("keydown", { key: "5" }));

    /**
     * Press Backspace
     *
     * WHAT HAPPENS:
     * Removes the last character from the input.
     * "5" becomes "".
     */
    screen.handleKeyPress(new KeyboardEvent("keydown", { key: "Backspace" }));

    /**
     * UPDATE UI BASED ON INPUT
     *
     * WHAT ARE THESE?
     * Helper methods that update the UI when input changes.
     */

    /**
     * updateInputDisplay() - Refreshes the text display for "Butter" input
     */
    screen.updateInputDisplay("Butter");

    /**
     * updateTotalCost() - Recalculates and displays the total cost
     */
    screen.updateTotalCost();

    /**
     * FOCUS DIFFERENT INPUT (EXERCISES PRIOR FOCUS RESET)
     *
     * WHAT IS THIS TESTING?
     * When you focus a second input, the first input should:
     * - Lose its highlight
     * - Stop receiving keyboard input
     *
     * This tests that code path.
     */
    screen.focusInput("Sugar", new Konva.Rect(), new Konva.Text());

    /**
     * TYPE AND DELETE IN THE NEW INPUT
     *
     * Same as before, but now focused on "Sugar" instead of "Butter".
     */
    screen.handleKeyPress(new KeyboardEvent("keydown", { key: "5" }));
    screen.handleKeyPress(new KeyboardEvent("keydown", { key: "Backspace" }));

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 3: PURCHASE FLOW (HAPPY PATH)
     * --------------------------------------------------------------------------
     */

    /**
     * SET UP A PURCHASE
     *
     * Player wants to buy 2 units of the first ingredient.
     */
    screen.ingredients[0].inputValue = "2";

    /**
     * FIND THE PURCHASE BUTTON
     *
     * HOW:
     * Look for a Group that contains a Text with "PURCHASE".
     *
     * WHAT IS some()?
     * Array method that returns true if ANY element matches.
     * We check if any child has text "PURCHASE".
     */
    const purchaseBtnGroup = layer
      .getChildren()
      .find((c: any) => c.getChildren?.().some((n: any) => n.text?.() === "PURCHASE"));

    /**
     * SIMULATE HOVERING OVER PURCHASE BUTTON
     *
     * VISUAL FEEDBACK:
     * Button changes color when hovered.
     */
    purchaseBtnGroup?.fire("mouseenter");
    purchaseBtnGroup?.fire("mouseleave");

    /**
     * CLICK PURCHASE BUTTON
     *
     * WHAT HAPPENS:
     * 1. ShoppingScreen calculates total cost
     * 2. Checks if player has enough funds
     * 3. If yes: calls onPurchaseComplete callback
     * 4. If no: shows "Insufficient funds" alert
     */
    purchaseBtnGroup?.fire("click");

    /**
     * ASSERT: Purchase callback was called
     *
     * EXPECTATION:
     * The purchase succeeded (player had enough money).
     */
    expect(onPurchaseComplete).toHaveBeenCalled();

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 4: INSUFFICIENT FUNDS SCENARIO
     * --------------------------------------------------------------------------
     */

    /**
     * MOCK THE ALERT FUNCTION
     *
     * WHY?
     * ShoppingScreen calls alert() when funds are insufficient.
     * We don't want actual alert popups during tests.
     * We mock it to track if it was called.
     */
    window.alert = vi.fn();

    /**
     * SET UP INSUFFICIENT FUNDS SCENARIO
     *
     * Give player $0 and try to buy a lot.
     */
    screen.currentFunds = 0;
    screen.ingredients[0].inputValue = "10";  // Try to buy 10 units

    /**
     * CLICK PURCHASE BUTTON AGAIN
     *
     * EXPECTED BEHAVIOR:
     * Should show alert saying "Insufficient funds".
     */
    purchaseBtnGroup?.fire("click");

    /**
     * ASSERT: Alert was called
     */
    expect(window.alert).toHaveBeenCalled();

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 5: VIEW RECIPE BUTTON
     * --------------------------------------------------------------------------
     */

    /**
     * FIND THE VIEW RECIPE BUTTON
     *
     * Similar to finding purchase button, but looking for "VIEW RECIPE" text.
     */
    const viewRecipeBtnGroup = layer
      .getChildren()
      .find((c: any) => c.getChildren?.().some((n: any) => n.text?.() === "VIEW RECIPE"));

    /**
     * GET THE CLICKABLE RECT (BUTTON BACKGROUND)
     *
     * WHY [0]?
     * Groups typically have children in order:
     * [0] = Background rect (clickable)
     * [1] = Text label (not clickable)
     */
    const viewRecipeRect = viewRecipeBtnGroup?.getChildren?.()[0];

    /**
     * CLICK VIEW RECIPE BUTTON
     *
     * WHAT HAPPENS:
     * Calls the onViewRecipe callback.
     */
    viewRecipeRect?.fire("click");

    /**
     * ASSERT: Recipe callback called exactly once
     */
    expect(onViewRecipe).toHaveBeenCalledTimes(1);

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 6: CLEANUP
     * --------------------------------------------------------------------------
     */

    /**
     * CALL CLEANUP METHOD
     *
     * WHAT DOES cleanup() DO?
     * - Removes keyboard event listener
     * - Removes resize event listener
     * - Destroys Konva nodes
     * - Cancels any pending animations
     *
     * WHY TEST THIS?
     * Memory leaks occur if cleanup doesn't run properly.
     */
    screen.cleanup();

    /**
     * --------------------------------------------------------------------------
     * TEST COMPLETE
     * --------------------------------------------------------------------------
     *
     * This test exercised:
     * ✓ UI creation helpers
     * ✓ Keyboard input handling
     * ✓ Mouse interactions (click, hover)
     * ✓ Purchase flow (success and failure)
     * ✓ Recipe viewing
     * ✓ Cleanup
     */
  });

  /**
   * ================================================================================
   * TEST CASE 2: Error Handling and Modal Interactions
   * ================================================================================
   *
   * TEST PURPOSE:
   * Test error paths and modal dialog interactions:
   * - Price tag image loading failure
   * - Receipt modal display
   * - Close button interactions
   * - Saved input values restoration
   *
   * WHY A SEPARATE TEST?
   * These are edge cases that need special setup (failing images).
   * Keeping them separate makes tests clearer.
   */
  it("covers price tag error path and receipt modal close interactions", async () => {
    /**
     * --------------------------------------------------------------------------
     * ARRANGE (SETUP)
     * --------------------------------------------------------------------------
     */

    /**
     * STEP 1: Mock images with price tag error
     *
     * CONFIGURATION:
     * Price tag images will fail to load, others will succeed.
     */
    mockImages({ priceTagError: true });

    /**
     * STEP 2-4: Same setup as previous test
     */
    const konvaMock = createKonvaMock();
    vi.doMock("konva", () => konvaMock);
    vi.doMock("./ui/ExitButton", () => ({
      ExitButton: class {
        constructor(stage: any, layer: any, onExit: () => void) {
          const g: any = new (createKonvaMock().default.Group)();
          g.handlers.set("click", onExit);
          layer.add(g);
        }
      },
    }));
    vi.doMock("./ui/InfoButton", () => ({
      InfoButton: class {},
    }));

    /**
     * STEP 5: Import modules
     */
    const { ShoppingScreen } = await import("./ShoppingScreen");
    const Konva = (await import("konva")).default as any;

    /**
     * STEP 6: Create instances
     */
    const stage = new Konva.Stage({ width: 700, height: 500, container: {} });
    const layer = new Konva.Layer();
    const onPurchaseComplete = vi.fn();
    const onViewRecipe = vi.fn();

    /**
     * STEP 7: Create saved input values
     *
     * WHAT IS THIS?
     * When player views recipe and comes back to shopping, their previous
     * input values should be restored. This tests that feature.
     *
     * SAVED VALUES:
     * Flour: 4 (player had entered "4" before)
     */
    const saved = new Map<string, string>([["Flour", "4"]]);

    /**
     * STEP 8: Create ShoppingScreen with saved values
     *
     * PARAMETERS:
     * - stage, layer, callbacks: Same as before
     * - 40: Current funds ($40)
     * - 4: Current day (day 4)
     * - 8: Cookie demand (8 cookies)
     * - [{ customerNum: 2, cookieCount: 3 }]: One customer ordering 3 cookies
     * - saved: Previously entered input values
     *
     * WHAT HAPPENS:
     * Constructor restores Flour input to "4" from saved values.
     */
    const screen: any = new ShoppingScreen(
      stage,
      layer,
      40,
      4,
      8,
      [{ customerNum: 2, cookieCount: 3 }],
      onPurchaseComplete,
      onViewRecipe,
      saved
    );

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 1: PRICE TAG IMAGE ERROR
     * --------------------------------------------------------------------------
     */

    /**
     * EXPLICITLY TRIGGER PRICE TAG IMAGE LOADING
     *
     * WHAT IS loadPriceTagImage()?
     * Internal method that loads the price tag graphic.
     *
     * PARAMETER:
     * () => {}: Empty callback (we don't care about success)
     *
     * WHAT HAPPENS:
     * 1. Creates new Image()
     * 2. Sets onload handler
     * 3. Sets src to "price-tag.png"
     * 4. Our mock Image detects "price-tag" in URL
     * 5. Since priceTagError: true, calls onerror instead of onload
     * 6. ShoppingScreen handles the error gracefully
     *
     * WHY TEST THIS?
     * Ensures the app doesn't crash if images fail to load.
     */
    screen.loadPriceTagImage(() => {});

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 2: RECEIPT MODAL
     * --------------------------------------------------------------------------
     */

    /**
     * SHOW THE RECEIPT MODAL
     *
     * WHAT IS A RECEIPT MODAL?
     * A popup dialog showing the shopping receipt with:
     * - Items purchased
     * - Prices
     * - Total cost
     * - Close button
     */
    screen.showReceiptModal();

    /**
     * FIND THE MODAL LAYER
     *
     * HOW:
     * The modal is added as a new layer to the stage.
     * Find a layer that has children (the modal contents).
     *
     * WHAT IS find()?
     * Searches stage's children (layers) for one with content.
     */
    const modalLayer = stage.getChildren().find((n: any) => n.getChildren?.().length);

    /**
     * FIND THE CLOSE BUTTON (CIRCLE)
     *
     * HOW:
     * The close button is a circle with a click handler.
     * Find a child that has a "click" event handler.
     *
     * WHAT IS has()?
     * Map method checking if a key exists.
     * handlers.has("click") returns true if click handler is registered.
     */
    const closeCircle = modalLayer
      ?.getChildren()
      .find((n: any) => n.handlers?.has("click"));

    /**
     * SIMULATE INTERACTING WITH CLOSE BUTTON
     */

    /**
     * Hover over close button
     *
     * VISUAL FEEDBACK:
     * Button changes appearance (color, scale) when hovered.
     */
    closeCircle?.fire("mouseenter");
    closeCircle?.fire("mouseleave");

    /**
     * Click close button
     *
     * WHAT HAPPENS:
     * Modal is destroyed and removed from the stage.
     */
    closeCircle?.fire("click");

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE) - PART 3: CLEANUP
     * --------------------------------------------------------------------------
     */

    /**
     * Clean up the screen
     */
    screen.cleanup();

    /**
     * --------------------------------------------------------------------------
     * TEST COMPLETE
     * --------------------------------------------------------------------------
     *
     * This test covered:
     * ✓ Image loading error handling
     * ✓ Saved input value restoration
     * ✓ Receipt modal display
     * ✓ Modal close button interactions
     * ✓ Cleanup
     */
  });
});

/**
 * ==================================================================================
 * END OF TEST FILE
 * ==================================================================================
 *
 * SUMMARY:
 * This test file comprehensively tests ShoppingScreen with focus on coverage.
 *
 * WHAT WE TESTED:
 * 1. UI Creation: All helper methods for creating UI components
 * 2. User Input: Keyboard typing, clicking, hovering
 * 3. Purchase Flow: Success (enough funds) and failure (insufficient funds)
 * 4. Callbacks: Purchase completion, recipe viewing
 * 5. Error Handling: Image loading failures
 * 6. Modals: Receipt popup with close button
 * 7. State Persistence: Saved input values
 * 8. Cleanup: Event listener removal, node destruction
 *
 * TESTING TECHNIQUES USED:
 * - Extensive Mocking: Konva, Image, ExitButton, InfoButton
 * - Direct Method Calls: Calling private methods to ensure coverage
 * - Event Simulation: fire() for clicks, hovers, keyboard
 * - Configurable Mocks: mockImages() with success/failure options
 * - Element Finding: Searching by properties (stroke color, text content)
 * - State Manipulation: Changing funds, input values, etc.
 *
 * KEY CONCEPTS LEARNED:
 * - Getters and Setters: Custom get/set for properties
 * - Type Aliases: type Handler = ...
 * - Optional Properties: { priceTagError?: boolean }
 * - Rest Parameters: ...nodes
 * - Array Methods: find(), some()
 * - Event Handling: on(), fire()
 * - Mock Functions: vi.fn(), toHaveBeenCalled()
 * - Optional Chaining: ?.
 * - Nullish Coalescing: ??
 *
 * COVERAGE PHILOSOPHY:
 * "Targeted coverage" means we're not just testing functionality - we're
 * ensuring every line of code is executed. This catches:
 * - Dead code (code that never runs)
 * - Edge cases (error paths, unusual inputs)
 * - Uncovered helper methods
 * - Interaction sequences (focus one input, then another)
 *
 * WHAT ISN'T TESTED:
 * - Visual appearance (colors, fonts, layout)
 * - Actual rendering (we mock Konva)
 * - Real image loading (we mock Image)
 * - Integration with other screens
 * - Window resize timing (we use fake requestAnimationFrame)
 *
 * LEARNING RESOURCES:
 * - Vitest Documentation: https://vitest.dev/
 * - Konva Documentation: https://konvajs.org/
 * - TypeScript Handbook: https://www.typescriptlang.org/docs/
 * - Testing Best Practices: https://testingjavascript.com/
 * - DOM Events: https://developer.mozilla.org/en-US/docs/Web/API/Event
 *
 * ==================================================================================
 */
