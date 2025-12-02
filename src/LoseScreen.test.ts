/**
 * ==================================================================================
 * LOSESCREEN TEST FILE
 * ==================================================================================
 *
 * FILE PURPOSE:
 * This test file verifies that the LoseScreen class works correctly. The LoseScreen
 * is displayed when the player loses the game (goes bankrupt). It shows:
 * - A "game over" message
 * - Statistics (total days played, final cash balance)
 * - A "Return to Login" button
 *
 * WHAT IS THE LOSESCREEN?
 * When players run out of money and can't make any more cookies, they lose the game.
 * The LoseScreen appears showing their final stats and giving them the option to
 * return to the login screen to try again.
 *
 * WHAT DOES THIS TEST CHECK?
 * - That the LoseScreen creates all necessary UI elements
 * - That the "Return to Login" button works correctly
 * - That clicking the button triggers the onReturnHome callback
 * - That the screen renders properly on the Konva layer
 *
 * ==================================================================================
 */

/**
 * ==================================================================================
 * IMPORT STATEMENTS
 * ==================================================================================
 *
 * These lines import the testing tools and modules we need.
 */

// Import testing utilities from Vitest (the testing framework)
import { describe, it, expect, beforeEach, vi } from "vitest";
/**
 * EXPLANATION OF IMPORTS:
 * - describe: Groups related tests together into a test suite
 * - it: Defines a single test case (also called "test")
 * - expect: Makes assertions (checks if values match expectations)
 * - beforeEach: Runs setup code before each test
 * - vi: Vitest utility for mocking, spying, and stubbing
 *
 * WHAT IS VITEST?
 * Vitest is a modern JavaScript testing framework. It runs your tests and tells
 * you if they pass or fail. Think of it like a teacher grading your homework.
 */

/**
 * ==================================================================================
 * MODULE-LEVEL VARIABLES
 * ==================================================================================
 *
 * These variables are declared at the top level and will be reassigned in each test.
 *
 * WHY DECLARE THEM HERE?
 * We need to import modules dynamically (after setting up mocks) using await import().
 * Dynamic imports must happen inside async functions, so we declare these variables
 * here and assign them later in beforeEach().
 */

/**
 * KonvaModule: Will hold the mocked Konva library
 *
 * WHAT IS 'any'?
 * TypeScript type meaning "any type of value". We use 'any' because we're storing
 * a dynamically imported module whose exact type TypeScript can't infer at compile time.
 *
 * WHY 'let' INSTEAD OF 'const'?
 * We need to reassign this variable in beforeEach(), and 'const' doesn't allow reassignment.
 */
let KonvaModule: any;

/**
 * LoseScreen: Will hold the LoseScreen class
 *
 * We import this dynamically so it uses our mocked Konva instead of the real one.
 */
let LoseScreen: any;

/**
 * ==================================================================================
 * KONVA MOCK FACTORY FUNCTION
 * ==================================================================================
 *
 * FUNCTION PURPOSE:
 * Creates a comprehensive fake (mock) version of the Konva graphics library.
 *
 * WHAT IS KONVA?
 * Konva is a 2D canvas library for drawing graphics in web browsers.
 * The game uses Konva to render all visual elements (backgrounds, buttons, text, etc.).
 *
 * WHY MOCK KONVA?
 * - Tests run faster without actually rendering pixels
 * - We can simulate user interactions (clicks, hovers) programmatically
 * - We only care that LoseScreen calls Konva methods correctly, not that pixels are drawn
 * - Tests work in Node.js (which doesn't have a real canvas)
 *
 * HOW THIS MOCK DIFFERS FROM GAMEMANAGER MOCK:
 * This mock is more advanced - it includes event handling (click, mouseenter, mouseleave)
 * because LoseScreen uses interactive buttons with hover effects.
 *
 * @returns A mock object that mimics the Konva library structure
 */
function createKonvaMock() {
  /**
   * FakeNode Class
   *
   * WHAT IS THIS?
   * The base class for all mock Konva objects. It provides core functionality:
   * - Configuration storage (position, size, color, etc.)
   * - Parent-child relationships (tree structure)
   * - Event handling (click, mouseenter, mouseleave, etc.)
   * - Accessor pattern for getter/setter methods
   *
   * WHY CALLED "NODE"?
   * In Konva, all visual elements are "nodes" in a tree structure.
   * Stage → Layer → Group → Shape (like HTML: document → div → span → text)
   *
   * INHERITANCE TREE:
   * FakeNode (base)
   *   ├─ FakeStage (top-level container)
   *   ├─ FakeLayer (render layer)
   *   ├─ FakeGroup (container for grouping shapes)
   *   ├─ FakeRect (rectangle shape)
   *   ├─ FakeText (text element)
   *   ├─ FakeImage (image element)
   *   └─ FakeLine (line shape)
   */
  class FakeNode {
    /**
     * config: Stores all configuration properties for this node
     *
     * WHAT IS Record<string, any>?
     * TypeScript type meaning "an object where keys are strings and values can be anything"
     * Example: { x: 10, y: 20, fill: "red", width: 100 }
     *
     * This is more specific than just 'any' - it tells us config is an object with
     * string keys, not a number or array.
     */
    config: Record<string, any>;

    /**
     * children: Array of child nodes contained within this node
     *
     * WHAT IS A CHILD NODE?
     * In a tree structure, children are nodes nested inside a parent.
     * Example: A Group can have Rect and Text children inside it.
     */
    children: any[] = [];

    /**
     * handlers: Map storing event listeners
     *
     * WHAT IS A MAP?
     * JavaScript data structure for storing key-value pairs.
     * Similar to an object, but more flexible with keys.
     *
     * STRUCTURE:
     * Map<string, (evt?: any) => void>
     * - Key (string): Event name like "click", "mouseenter", "mouseleave"
     * - Value (function): Handler function that runs when the event fires
     *
     * WHAT IS (evt?: any) => void?
     * TypeScript function type:
     * - evt?: any means "optional parameter named evt of any type"
     * - => void means "returns nothing"
     * Example: (evt) => { console.log("clicked!"); }
     *
     * WHY USE MAP INSTEAD OF OBJECT?
     * - Maps have better iteration methods (.keys(), .values(), .entries())
     * - Maps can have any type of key (not just strings)
     * - Maps track insertion order
     */
    handlers = new Map<string, (evt?: any) => void>();

    /**
     * CONSTRUCTOR
     *
     * Initializes a new FakeNode instance.
     *
     * @param config - Configuration object (position, size, style, etc.)
     *
     * WHAT IS Record<string, any> = {}?
     * - Record<string, any>: Type annotation (config must be an object)
     * - = {}: Default parameter (if no config provided, use empty object)
     *
     * WHY DEFAULT TO EMPTY OBJECT?
     * Some Konva nodes can be created without any config: new Konva.Group()
     * The default prevents errors if config is undefined.
     */
    constructor(config: Record<string, any> = {}) {
      /**
       * WHAT IS { ...config }?
       * Spread operator - creates a shallow copy of the config object.
       *
       * WHY COPY?
       * - Prevents external code from modifying our internal config
       * - Each node has its own independent config object
       *
       * EXAMPLE:
       * const original = { x: 10, y: 20 };
       * const copy = { ...original };
       * copy.x = 30;  // Doesn't affect original.x (still 10)
       */
      this.config = { ...config };
    }

    /**
     * add() - Adds one or more child nodes to this node
     *
     * @param nodes - One or more nodes to add as children
     * @returns this (for method chaining)
     *
     * WHAT IS ...nodes: any[]?
     * Rest parameter - captures all arguments into an array.
     *
     * EXAMPLES:
     * group.add(rect);              // nodes = [rect]
     * group.add(rect, text);        // nodes = [rect, text]
     * group.add(rect, text, image); // nodes = [rect, text, image]
     *
     * WHY USE REST PARAMETER?
     * Konva's real add() method accepts multiple arguments.
     * We match that behavior for compatibility.
     *
     * WHAT IS this.children.push(...nodes)?
     * - push(): Array method to add items to the end
     * - ...nodes: Spread operator unpacks the array
     *
     * EXAMPLE:
     * children = [a, b];
     * nodes = [c, d];
     * children.push(...nodes);  // children is now [a, b, c, d]
     * This is equivalent to: children.push(c, d);
     *
     * WHAT IS METHOD CHAINING?
     * Returning 'this' allows chaining: group.add(a).add(b).add(c)
     */
    add(...nodes: any[]) {
      this.children.push(...nodes);
      return this;
    }

    /**
     * getChildren() - Returns the array of child nodes
     *
     * @returns Array of all children
     *
     * WHY NOT JUST ACCESS children DIRECTLY?
     * Konva uses a method (getChildren()) instead of a property.
     * We match the real API for compatibility.
     */
    getChildren() {
      return this.children;
    }

    /**
     * on() - Registers an event listener
     *
     * @param event - Event name (e.g., "click", "mouseenter", "tap")
     * @param handler - Function to call when event fires
     *
     * WHAT IS AN EVENT LISTENER?
     * A function that waits for a specific event to happen, then runs.
     * Like a security guard watching for a specific alarm.
     *
     * EXAMPLES:
     * button.on("click", () => { console.log("Clicked!"); });
     * button.on("mouseenter", () => { console.log("Mouse entered!"); });
     *
     * HOW IT WORKS:
     * Stores the handler function in the handlers Map with the event name as key.
     * Later, when fire() is called with that event name, the handler runs.
     */
    on(event: string, handler: (evt?: any) => void) {
      this.handlers.set(event, handler);
    }

    /**
     * fire() - Manually triggers an event
     *
     * @param event - Event name to fire
     * @param payload - Optional data to pass to the handler
     *
     * WHAT DOES THIS DO?
     * Looks up the handler for the given event and calls it.
     *
     * HOW IT WORKS:
     * 1. this.handlers.get(event): Gets the handler function from the Map
     * 2. ?.(payload): Optional chaining - calls the function if it exists
     *
     * WHAT IS OPTIONAL CHAINING (?.)?
     * Safely calls a function/property that might not exist.
     * - If handler exists: calls it with payload
     * - If handler is undefined: does nothing (no error)
     *
     * EXAMPLE:
     * button.on("click", () => { console.log("Clicked!"); });
     * button.fire("click");  // Logs "Clicked!"
     * button.fire("hover");  // Does nothing (no handler for "hover")
     *
     * WHY IS THIS USEFUL IN TESTS?
     * We can simulate user interactions programmatically:
     * button.fire("click");  // Simulates a click without a real mouse
     */
    fire(event: string, payload?: any) {
      this.handlers.get(event)?.(payload);
    }

    /**
     * findOne() - Finds and returns the first child node
     *
     * @returns The first child, or a new empty FakeNode if no children
     *
     * WHAT IS ??
     * Nullish coalescing operator - returns right side if left side is null/undefined.
     *
     * EXAMPLE:
     * this.children[0] ?? new FakeNode()
     * - If children[0] exists: return it
     * - If children[0] is undefined: return new FakeNode()
     *
     * WHY RETURN EMPTY NODE INSTEAD OF undefined?
     * Prevents "cannot read property of undefined" errors.
     * Code like findOne().width() will work even if no children exist.
     *
     * NOTE:
     * The real Konva findOne() takes a selector (like ".className" or "#id").
     * This mock is simplified - it just returns the first child.
     */
    findOne() {
      return this.children[0] ?? new FakeNode();
    }

    /**
     * accessor() - Factory function for creating getter/setter methods
     *
     * @param key - Property name in the config object
     * @param fallback - Default value if property not set
     * @returns A getter/setter function
     *
     * WHAT IS THIS?
     * A helper that creates getter/setter methods dynamically.
     * This pattern is used for width(), height(), x(), y(), fill(), etc.
     *
     * WHY USE THIS PATTERN?
     * Konva properties work as both getters and setters:
     * - rect.width()     // Get width (no argument)
     * - rect.width(100)  // Set width (with argument)
     *
     * HOW IT WORKS:
     * Returns a function that:
     * 1. If called with a value: sets config[key] = value
     * 2. If called without a value: returns config[key] (or fallback if not set)
     *
     * EXAMPLE:
     * const widthAccessor = this.accessor("width", 100);
     * widthAccessor();      // Returns 100 (fallback)
     * widthAccessor(200);   // Sets width to 200
     * widthAccessor();      // Returns 200
     *
     * WHAT IS A CLOSURE?
     * The returned function "closes over" (remembers) the key and fallback variables.
     * Even after accessor() finishes, the returned function still has access to them.
     *
     * DETAILED BREAKDOWN:
     * return (value?: any) => { ... }
     * - Returns an arrow function that takes an optional value parameter
     *
     * if (value !== undefined) this.config[key] = value;
     * - If value was provided (not undefined), store it in config
     * - Example: If key="width" and value=200, sets config.width = 200
     *
     * return this.config[key] ?? fallback;
     * - Returns the stored value, or fallback if not set
     * - Example: If config.width doesn't exist, return fallback
     */
    accessor(key: string, fallback: any = 0) {
      return (value?: any) => {
        if (value !== undefined) this.config[key] = value;
        return this.config[key] ?? fallback;
      };
    }

    /**
     * ============================================================================
     * PROPERTY ACCESSORS
     * ============================================================================
     *
     * These are the actual getter/setter methods for common Konva properties.
     * They use the accessor() factory function defined above.
     */

    /**
     * width() - Getter/setter for width property
     *
     * CREATED BY: this.accessor("width", 100)
     *
     * USAGE:
     * rect.width();      // Get width (returns 100 if not set)
     * rect.width(200);   // Set width to 200
     * rect.width();      // Returns 200
     *
     * DEFAULT VALUE: 100 pixels
     */
    width = this.accessor("width", 100);

    /**
     * height() - Getter/setter for height property
     * DEFAULT VALUE: 50 pixels
     */
    height = this.accessor("height", 50);

    /**
     * x() - Getter/setter for X position (horizontal)
     * DEFAULT VALUE: 0 (left edge)
     */
    x = this.accessor("x", 0);

    /**
     * y() - Getter/setter for Y position (vertical)
     * DEFAULT VALUE: 0 (top edge)
     */
    y = this.accessor("y", 0);

    /**
     * fill() - Getter/setter for fill color
     *
     * WHAT IS FILL?
     * The color that fills the inside of a shape.
     * Examples: "red", "#FF0000", "rgba(255, 0, 0, 0.5)"
     *
     * DEFAULT VALUE: "" (empty string, no fill)
     */
    fill = this.accessor("fill", "");

    /**
     * shadowBlur() - Getter/setter for shadow blur radius
     *
     * WHAT IS SHADOW BLUR?
     * How blurry/soft the shadow appears.
     * Higher values = more blur, lower values = sharper shadow
     *
     * DEFAULT VALUE: 0 (no blur)
     */
    shadowBlur = this.accessor("shadowBlur", 0);

    /**
     * shadowOffset() - Getter/setter for shadow offset
     *
     * WHAT IS SHADOW OFFSET?
     * How far the shadow is offset from the shape.
     * - x: Horizontal offset (positive = right, negative = left)
     * - y: Vertical offset (positive = down, negative = up)
     *
     * EXAMPLE:
     * shadowOffset({ x: 5, y: 10 }) creates a shadow 5px right and 10px down
     *
     * DEFAULT VALUE: { x: 0, y: 0 } (no offset, shadow directly under shape)
     */
    shadowOffset = this.accessor("shadowOffset", { x: 0, y: 0 });

    /**
     * moveToBottom() - Moves this node to the bottom of render order
     *
     * WHAT IS RENDER ORDER?
     * The order in which elements are drawn. Later elements appear on top.
     * moveToBottom() makes this element render first (behind everything else).
     *
     * USE CASE:
     * Background images should be behind all other elements.
     *
     * WHY EMPTY FUNCTION?
     * This is a mock - we don't actually reorder anything.
     * We just provide the method so code doesn't crash when calling it.
     */
    moveToBottom() {}
  }

  /**
   * ============================================================================
   * FAKESTAGE CLASS
   * ============================================================================
   *
   * WHAT IS A STAGE?
   * The top-level container in Konva - represents the entire canvas.
   * Everything else (layers, shapes, text) goes inside the stage.
   *
   * REAL-WORLD ANALOGY:
   * If Konva is a theater, the Stage is the entire theater building.
   * Layers are like transparent sheets on the stage.
   * Shapes are like actors on those sheets.
   *
   * EXTENDS FakeNode:
   * FakeStage inherits all methods from FakeNode (add, getChildren, on, fire, etc.)
   */
  class FakeStage extends FakeNode {
    /**
     * containerElement: The HTML element that holds the canvas
     *
     * WHAT IS THIS?
     * In a real browser, the Stage creates a <canvas> element inside a container <div>.
     * The container has a style property that we can modify (like cursor).
     *
     * STRUCTURE:
     * { style: { cursor: "default" } }
     * - style: Object containing CSS properties
     * - cursor: Mouse cursor appearance ("default", "pointer", "move", etc.)
     *
     * WHY cursor: "default"?
     * The normal arrow cursor. Interactive elements change it to "pointer".
     */
    containerElement = { style: { cursor: "default" } };

    /**
     * container() - Returns the container element
     *
     * @returns The container element object
     *
     * WHY A METHOD?
     * Konva uses container() as a method, not a property.
     * We match the real API.
     *
     * USE CASE:
     * stage.container().style.cursor = "pointer";
     * Changes the mouse cursor when hovering over the canvas.
     */
    container() {
      return this.containerElement;
    }
  }

  /**
   * ============================================================================
   * FAKELAYER CLASS
   * ============================================================================
   *
   * WHAT IS A LAYER?
   * A container for shapes and groups. Layers are added to the Stage.
   * Think of layers like transparent sheets in a projector - you can stack them.
   *
   * WHY USE LAYERS?
   * - Organization: UI layer, background layer, game layer
   * - Performance: Redraw only the layer that changed
   * - Control: Show/hide entire layers at once
   *
   * EXTENDS FakeNode:
   * Inherits add(), getChildren(), on(), fire(), etc.
   */
  class FakeLayer extends FakeNode {
    /**
     * draw() - Redraws the layer
     *
     * WHAT IS vi.fn()?
     * Creates a Vitest mock function (spy).
     *
     * WHAT IS A SPY?
     * A function that tracks when it's called and with what arguments.
     * We can later check: expect(layer.draw).toHaveBeenCalled()
     *
     * WHY MOCK draw()?
     * - The real draw() renders pixels on canvas (slow, not needed in tests)
     * - We just want to verify that draw() was called (the screen updates)
     * - Tests run faster without actual rendering
     */
    draw = vi.fn();

    /**
     * batchDraw() - Schedules a redraw for the next animation frame
     *
     * WHAT IS BATCH DRAWING?
     * Instead of redrawing immediately after each change, batch multiple changes
     * and redraw once. More efficient for performance.
     *
     * EXAMPLE:
     * rect.fill("red");
     * rect.x(100);
     * rect.y(200);
     * layer.batchDraw();  // Redraws once with all changes
     *
     * VS:
     * rect.fill("red");
     * layer.draw();  // Redraw
     * rect.x(100);
     * layer.draw();  // Redraw again
     * rect.y(200);
     * layer.draw();  // Redraw a third time (inefficient!)
     */
    batchDraw = vi.fn();

    /**
     * destroyChildren() - Removes and destroys all child nodes
     *
     * WHAT DOES "DESTROY" MEAN?
     * Completely removes nodes from memory, cleaning up event listeners.
     *
     * USE CASE:
     * When switching screens, destroy the old screen's elements:
     * layer.destroyChildren();  // Clear everything
     * // Add new screen's elements
     *
     * WHY MOCK THIS?
     * We want to verify that LoseScreen clears the layer before adding its UI.
     */
    destroyChildren = vi.fn();
  }

  /**
   * ============================================================================
   * OTHER KONVA NODE CLASSES
   * ============================================================================
   *
   * These are simple mock classes that just extend FakeNode.
   * They inherit all functionality from FakeNode without adding anything new.
   */

  /**
   * FakeGroup - Container for grouping related shapes
   *
   * WHAT IS A GROUP?
   * A container that holds multiple shapes and treats them as one unit.
   *
   * EXAMPLE USE CASE:
   * A button consists of a rectangle (background) + text (label).
   * Group them together so you can position/click the button as one unit.
   */
  class FakeGroup extends FakeNode {}

  /**
   * FakeRect - Rectangle shape
   *
   * WHAT IS A RECT?
   * A rectangular shape with width, height, fill color, border, etc.
   *
   * USE CASES:
   * - Button backgrounds
   * - Colored panels
   * - Hit areas for click detection
   */
  class FakeRect extends FakeNode {}

  /**
   * FakeText - Text element
   *
   * WHAT IS TEXT IN KONVA?
   * Renders text on the canvas with customizable font, size, color, alignment.
   *
   * USE CASES:
   * - Labels, buttons, instructions
   * - Game messages, scores
   * - Any text that needs to appear on the canvas
   */
  class FakeText extends FakeNode {}

  /**
   * FakeImage - Image element
   *
   * WHAT IS AN IMAGE NODE?
   * Displays an image (PNG, JPG, etc.) on the canvas.
   *
   * USE CASES:
   * - Background images
   * - Sprites, icons
   * - Character/object graphics
   */
  class FakeImage extends FakeNode {}

  /**
   * FakeLine - Line shape
   *
   * WHAT IS A LINE?
   * Draws a line (or connected series of lines) on the canvas.
   *
   * USE CASES:
   * - Borders, dividers
   * - Drawing tools
   * - Vector graphics
   *
   * NOTE:
   * Not used in LoseScreen, but included for completeness.
   */
  class FakeLine extends FakeNode {}

  /**
   * ============================================================================
   * RETURN STATEMENT
   * ============================================================================
   *
   * Returns the mock Konva library structure.
   *
   * STRUCTURE:
   * {
   *   default: {
   *     Stage: FakeStage,
   *     Layer: FakeLayer,
   *     ... etc
   *   }
   * }
   *
   * WHY { default: { ... } }?
   * This matches how Konva is exported as an ES6 module.
   * When you do: import Konva from "konva"
   * You get the 'default' export, which contains all the classes.
   */
  return {
    default: {
      Stage: FakeStage,
      Layer: FakeLayer,
      Group: FakeGroup,
      Rect: FakeRect,
      Text: FakeText,
      Image: FakeImage,
      Line: FakeLine,
    },
  };
}

/**
 * ==================================================================================
 * TEST SUITE
 * ==================================================================================
 *
 * WHAT IS describe()?
 * Groups related tests together into a "test suite".
 *
 * PARAMETERS:
 * - "LoseScreen": Name of the test suite
 * - Callback function: Contains setup code and tests
 *
 * ORGANIZATION:
 * describe("LoseScreen", () => {
 *   beforeEach(() => { ... setup ... });
 *   it("test 1", () => { ... });
 *   it("test 2", () => { ... });
 * });
 */
describe("LoseScreen", () => {
  /**
   * ================================================================================
   * TEST SUITE VARIABLES
   * ================================================================================
   *
   * These variables are declared at the suite level but assigned in beforeEach().
   * Each test gets fresh instances of these objects.
   *
   * WHY DECLARE HERE?
   * - Shared across all tests in this suite
   * - TypeScript can infer types from the initial values
   * - Tests can access and modify these as needed
   */

  /**
   * stage: The mock Konva Stage instance
   *
   * WHAT IS FakeStage?
   * The type annotation - tells TypeScript that stage is a FakeStage instance.
   *
   * WHY NOT INITIALIZE HERE?
   * We create a fresh stage in beforeEach() for each test.
   * This ensures tests don't interfere with each other.
   */
  let stage: FakeStage;

  /**
   * layer: The mock Konva Layer instance
   *
   * Each test gets a clean layer to work with.
   */
  let layer: FakeLayer;

  /**
   * onReturn: Mock callback function for "Return to Login" button
   *
   * WHAT IS ReturnType<typeof vi.fn>?
   * TypeScript utility type that extracts the return type of vi.fn().
   * This tells TypeScript that onReturn is a Vitest mock function.
   *
   * BREAKDOWN:
   * - typeof vi.fn: Gets the type of the vi.fn function itself
   * - ReturnType<...>: Extracts what vi.fn returns (a mock function)
   *
   * WHY SO COMPLEX?
   * TypeScript needs to know that onReturn is a mock function so we can use
   * methods like toHaveBeenCalled() on it.
   *
   * SIMPLER ALTERNATIVE:
   * let onReturn: any;
   * But that loses type safety.
   */
  let onReturn: ReturnType<typeof vi.fn>;

  /**
   * ================================================================================
   * BEFORE EACH HOOK
   * ================================================================================
   *
   * WHAT IS beforeEach()?
   * A function that runs before each test in the suite.
   * Used to set up a clean, consistent state for every test.
   *
   * WHY ASYNC?
   * We use dynamic imports (await import()) which are asynchronous operations.
   * The async keyword lets us use await inside.
   *
   * WHAT HAPPENS HERE:
   * 1. Create and register Konva mock
   * 2. Mock the Image class
   * 3. Dynamically import the mocked modules
   * 4. Create fresh stage and layer instances
   * 5. Create a fresh mock callback
   */
  beforeEach(async () => {
    /**
     * --------------------------------------------------------------------------
     * STEP 1: CREATE AND REGISTER KONVA MOCK
     * --------------------------------------------------------------------------
     */

    /**
     * Create the mock Konva library
     *
     * WHAT IS konvaMock?
     * An object containing all the fake Konva classes we defined above.
     */
    const konvaMock = createKonvaMock();

    /**
     * Register the Konva mock
     *
     * WHAT IS vi.doMock()?
     * Tells Vitest to replace the "konva" module with our mock.
     *
     * HOW IT WORKS:
     * - "konva": The module name to mock
     * - () => konvaMock: Factory function that returns the mock
     *
     * RESULT:
     * When any code does import Konva from "konva", it gets our mock instead.
     *
     * WHY vi.doMock() INSTEAD OF vi.mock()?
     * - vi.mock() is hoisted (runs before all code)
     * - vi.doMock() runs when called (inside beforeEach)
     * - We need fresh mocks for each test, so we use vi.doMock()
     */
    vi.doMock("konva", () => konvaMock);

    /**
     * --------------------------------------------------------------------------
     * STEP 2: MOCK THE IMAGE CLASS
     * --------------------------------------------------------------------------
     *
     * WHY MOCK IMAGE?
     * LoseScreen loads a background image using the browser's Image class.
     * In tests, we don't want to load real image files.
     */

    /**
     * Replace the global Image class with a fake one
     *
     * WHAT IS vi.stubGlobal()?
     * Replaces a global variable (available everywhere) with a fake version.
     *
     * PARAMETERS:
     * - "Image": Name of the global to replace
     * - class { ... }: The fake Image class
     */
    vi.stubGlobal(
      "Image",
      class {
        /**
         * onload: Callback called when image loads successfully
         *
         * WHAT IS (() => void) | null?
         * TypeScript type: "either a function with no parameters returning nothing,
         * or null (no function assigned yet)"
         *
         * HOW IT'S USED:
         * const img = new Image();
         * img.onload = () => { console.log("Image loaded!"); };
         * img.src = "background.png";  // Triggers onload
         *
         * INITIAL VALUE: null (no handler yet)
         */
        onload: (() => void) | null = null;

        /**
         * src: Image source URL (setter)
         *
         * WHAT IS 'set src'?
         * A property setter - special method that runs when you assign to a property.
         *
         * SYNTAX:
         * set propertyName(value) { ... }
         *
         * USAGE:
         * img.src = "background.png";  // Calls this setter
         *
         * @param _ - The URL string (we don't use it, hence the underscore)
         *
         * WHAT IS THE UNDERSCORE (_)?
         * Convention for "unused parameter". We receive the value but don't need it.
         *
         * WHAT HAPPENS:
         * this.onload?.();
         * - Gets the onload function
         * - Calls it immediately (simulating instant image load)
         * - ?.() means "call if it exists" (optional chaining)
         *
         * RESULT:
         * Our mock Image instantly "loads" - no waiting for actual file I/O.
         * This makes tests run fast and work without real image files.
         */
        set src(_: string) {
          this.onload?.();
        }
      }
    );

    /**
     * --------------------------------------------------------------------------
     * STEP 3: DYNAMICALLY IMPORT MODULES
     * --------------------------------------------------------------------------
     *
     * WHY DYNAMIC IMPORTS?
     * We set up mocks above using vi.doMock().
     * Mocks only affect imports that happen AFTER vi.doMock() is called.
     * Dynamic imports (await import()) happen now, after the mocks are ready.
     */

    /**
     * Import the mocked Konva library
     *
     * WHAT IS await import("konva")?
     * - import("konva"): Dynamically loads the konva module
     * - Returns a Promise that resolves to the module
     * - await: Waits for the Promise to resolve
     *
     * WHAT IS .default?
     * ES6 modules have a 'default' export.
     * Our mock returns { default: { Stage, Layer, ... } }
     * We extract the 'default' property to get the Konva classes.
     *
     * RESULT:
     * KonvaModule now contains our mock: { Stage: FakeStage, Layer: FakeLayer, ... }
     */
    KonvaModule = (await import("konva")).default;

    /**
     * Import the LoseScreen class
     *
     * WHAT IS .LoseScreen?
     * The LoseScreen module exports: export class LoseScreen { ... }
     * We destructure it to get just the class.
     *
     * RESULT:
     * LoseScreen is now the real LoseScreen class, but it will use our mocked
     * Konva instead of the real one (because we imported Konva first with the mock).
     */
    LoseScreen = (await import("./LoseScreen")).LoseScreen;

    /**
     * --------------------------------------------------------------------------
     * STEP 4: CREATE FRESH INSTANCES
     * --------------------------------------------------------------------------
     *
     * Each test gets brand new stage, layer, and callback instances.
     * This ensures tests are independent and don't affect each other.
     */

    /**
     * Create a new Stage instance
     *
     * CONFIGURATION:
     * - width: 1000: Stage is 1000 pixels wide
     * - height: 700: Stage is 700 pixels tall
     * - container: { appendChild() {} }: Fake container element
     *
     * WHAT IS appendChild() {}?
     * Empty function - the real container.appendChild() adds the canvas to the DOM.
     * We provide a fake one so the Stage constructor doesn't crash.
     *
     * WHY THESE DIMENSIONS?
     * Arbitrary test values. LoseScreen should work with any reasonable size.
     */
    stage = new KonvaModule.Stage({
      width: 1000,
      height: 700,
      container: { appendChild() {} },
    });

    /**
     * Create a new Layer instance
     *
     * NO CONFIGURATION NEEDED:
     * Layers don't require any constructor parameters.
     * We just create an empty one that LoseScreen will add elements to.
     */
    layer = new KonvaModule.Layer();

    /**
     * Create a fresh mock callback function
     *
     * WHAT IS vi.fn()?
     * Creates a new Vitest mock function (spy).
     *
     * WHAT CAN WE DO WITH IT?
     * - Call it like a normal function: onReturn()
     * - Check if it was called: expect(onReturn).toHaveBeenCalled()
     * - Check how many times: expect(onReturn).toHaveBeenCalledTimes(1)
     * - Check arguments: expect(onReturn).toHaveBeenCalledWith(arg1, arg2)
     *
     * USE CASE:
     * LoseScreen takes an onReturnHome callback. When the "Return to Login"
     * button is clicked, LoseScreen calls this callback. We use a mock to
     * verify the callback was called.
     */
    onReturn = vi.fn();
  });

  /**
   * ================================================================================
   * TEST CASE: Creates UI and triggers callbacks
   * ================================================================================
   *
   * TEST PURPOSE:
   * Verify that LoseScreen:
   * 1. Creates all necessary UI elements (background, text, button)
   * 2. Sets up click event listeners on the button
   * 3. Calls the onReturnHome callback when button is clicked
   * 4. Redraws the layer to show the UI
   *
   * WHAT IS it()?
   * Defines a single test case.
   *
   * PARAMETERS:
   * - "creates UI and triggers callbacks": Test description
   * - () => { ... }: Test function (NOT async - no await needed)
   *
   * WHY NOT ASYNC?
   * This test doesn't use any await statements, so it doesn't need to be async.
   */
  it("creates UI and triggers callbacks", () => {
    /**
     * --------------------------------------------------------------------------
     * ARRANGE (SETUP)
     * --------------------------------------------------------------------------
     *
     * WHAT IS AAA PATTERN?
     * Test organization: Arrange, Act, Assert
     * - Arrange: Set up test conditions and inputs
     * - Act: Execute the code being tested
     * - Assert: Verify the results are correct
     */

    /**
     * Create a LoseScreen instance
     *
     * PARAMETERS:
     * - stage as any: The mock stage (cast to 'any' to bypass TypeScript checking)
     * - layer as any: The mock layer (cast to 'any')
     * - Configuration object:
     *   * totalDaysPlayed: 2 - Player survived 2 days
     *   * cashBalance: 1000 - Player ended with $1000 (but still lost somehow?)
     *   * onReturnHome: onReturn - Callback to call when "Return" button is clicked
     *
     * WHAT IS 'as any'?
     * TypeScript type assertion - tells TypeScript to treat our mocks as the real types.
     * LoseScreen expects Konva.Stage and Konva.Layer, but we're passing FakeStage
     * and FakeLayer. The 'as any' tells TypeScript "trust me, this is fine".
     *
     * WHAT HAPPENS DURING CONSTRUCTION:
     * 1. LoseScreen stores stage, layer, and opts
     * 2. Calls setupUI() which:
     *    - Clears the layer (destroyChildren)
     *    - Loads background image
     *    - Creates "Owl needs to make more cookies." text
     *    - Creates stats text (days played, final balance)
     *    - Creates "RETURN TO LOGIN" button
     *    - Sets up click handlers on the button
     *    - Draws everything on the layer
     */
    const screen = new LoseScreen(stage as any, layer as any, {
      totalDaysPlayed: 2,
      cashBalance: 1000,
      onReturnHome: onReturn,
    });

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE)
     * --------------------------------------------------------------------------
     *
     * Find and click the button to simulate user interaction.
     */

    /**
     * STEP 1: Find the button element
     *
     * HOW WE FIND IT:
     * We look for a child node that has a click event handler registered.
     *
     * BREAKDOWN:
     * layer.getChildren() - Get all elements added to the layer
     * .find((c: any) => ...) - Find the first element that matches a condition
     *
     * WHAT IS find()?
     * Array method that returns the first element that passes a test.
     * Returns undefined if no match found.
     *
     * THE TEST:
     * Array.from(c.handlers?.keys?.() ?? [])
     * - c.handlers: The Map of event handlers on this child
     * - ?.keys?.(): Safely get the keys (event names) from the Map
     * - ?? []: If undefined, use empty array
     * - Array.from(...): Convert the keys to an array
     *
     * .some((key) => key.includes("click"))
     * - Check if any event name includes "click"
     * - Returns true if found, false otherwise
     *
     * WHAT IS some()?
     * Array method that returns true if ANY element passes a test.
     * Example: [1, 2, 3].some(x => x > 2) returns true (3 > 2)
     *
     * WHY key.includes("click")?
     * LoseScreen uses "click tap" as the event name (for both mouse and touch).
     * includes("click") matches any event name containing "click".
     *
     * RESULT:
     * button is the Group containing the "RETURN TO LOGIN" button.
     */
    const button = layer
      .getChildren()
      .find((c: any) =>
        Array.from(c.handlers?.keys?.() ?? []).some((key) => key.includes("click"))
      );

    /**
     * STEP 2: Find the click event name
     *
     * WHY?
     * The event might be "click", "click tap", or something else.
     * We need to find the exact event name to trigger it.
     *
     * BREAKDOWN:
     * Array.from(button?.handlers.keys?.() ?? [])
     * - button?.handlers: Get handlers Map (or undefined if button not found)
     * - .keys?.(): Get event names (or undefined)
     * - ?? []: Default to empty array if undefined
     * - Array.from(...): Convert to array
     *
     * .find((key) => key.includes("click"))
     * - Find the first key that contains "click"
     *
     * RESULT:
     * clickEvent is the event name, probably "click tap"
     */
    const clickEvent = Array.from(button?.handlers.keys?.() ?? []).find((key) =>
      key.includes("click")
    );

    /**
     * STEP 3: Trigger the click event
     *
     * BREAKDOWN:
     * clickEvent && button?.handlers.get(clickEvent)?.()
     *
     * WHAT IS &&?
     * Logical AND - only evaluates right side if left side is truthy.
     * If clickEvent is undefined, the right side doesn't run (prevents errors).
     *
     * button?.handlers.get(clickEvent)
     * - Get the handler function for this event
     *
     * ?.()
     * - Call the function if it exists
     *
     * WHAT HAPPENS:
     * The click handler runs, which calls this.opts.onReturnHome(),
     * which calls our mock onReturn function.
     *
     * RESULT:
     * Simulates a user clicking the "RETURN TO LOGIN" button.
     */
    clickEvent && button?.handlers.get(clickEvent)?.();

    /**
     * --------------------------------------------------------------------------
     * ASSERT (VERIFY)
     * --------------------------------------------------------------------------
     *
     * Check that the expected things happened.
     */

    /**
     * ASSERTION 1: Callback was called exactly once
     *
     * WHAT IS expect()?
     * Vitest function to make assertions about values.
     *
     * WHAT IS toHaveBeenCalledTimes()?
     * Matcher that checks how many times a mock function was called.
     *
     * WHAT WE'RE CHECKING:
     * The onReturn callback should be called exactly once when the button is clicked.
     *
     * WHY EXACTLY 1?
     * - 0 times: Button click didn't work (bug!)
     * - 2+ times: Button triggered multiple times (bug!)
     * - Exactly 1: Perfect! Works as expected.
     *
     * IF THIS FAILS:
     * - Test fails with error message showing expected vs actual call count
     * - Indicates the button click handler isn't working correctly
     */
    expect(onReturn).toHaveBeenCalledTimes(1);

    /**
     * ASSERTION 2: Layer was drawn
     *
     * WHAT IS toHaveBeenCalled()?
     * Matcher that checks if a mock function was called at least once.
     * Doesn't care how many times, just that it was called.
     *
     * WHAT WE'RE CHECKING:
     * layer.draw() should be called to render the UI on screen.
     *
     * WHY CHECK THIS?
     * If draw() isn't called, the UI won't be visible.
     * This is a common bug - forgetting to redraw after adding elements.
     *
     * WHEN IS draw() CALLED?
     * - After adding all UI elements (in setupUI)
     * - After hover effects (mouseenter/mouseleave)
     *
     * IF THIS FAILS:
     * - LoseScreen forgot to call layer.draw()
     * - The UI would exist but wouldn't be visible to the user
     */
    expect(layer.draw).toHaveBeenCalled();

    /**
     * --------------------------------------------------------------------------
     * TEST COMPLETE
     * --------------------------------------------------------------------------
     *
     * Both assertions passed, meaning:
     * 1. LoseScreen successfully created the UI
     * 2. The "Return to Login" button works
     * 3. Clicking the button triggers the callback
     * 4. The UI is rendered on the layer
     *
     * The LoseScreen is working correctly! ✓
     */
  });
});

/**
 * ==================================================================================
 * END OF TEST FILE
 * ==================================================================================
 *
 * SUMMARY:
 * This test file verifies that LoseScreen works correctly:
 *
 * WHAT WE TESTED:
 * 1. UI Creation: LoseScreen creates all necessary elements
 * 2. Event Handling: Button click handlers are registered
 * 3. Callback Execution: onReturnHome is called when button is clicked
 * 4. Rendering: layer.draw() is called to show the UI
 *
 * TESTING TECHNIQUES USED:
 * - Mocking: Created fake Konva and Image classes
 * - Dynamic Imports: Loaded modules after setting up mocks
 * - Spying: Used vi.fn() to track callback calls
 * - Event Simulation: Manually triggered click events
 * - Assertions: Verified callbacks were called and UI was drawn
 *
 * KEY CONCEPTS LEARNED:
 * - Event listeners: on(), fire()
 * - Mock functions: vi.fn(), toHaveBeenCalled()
 * - Optional chaining: ?.
 * - Type assertions: as any
 * - Dynamic imports: await import()
 * - Array methods: find(), some()
 * - Getter/setter pattern: accessor()
 *
 * WHAT ISN'T TESTED:
 * - Visual appearance (colors, fonts, sizes)
 * - Hover effects (mouseenter/mouseleave)
 * - Background image loading (we mock it to succeed instantly)
 * - Responsive layout at different screen sizes
 *
 * WHY NOT TEST THESE?
 * - Visual tests are better done manually or with screenshot testing tools
 * - Hover effects would need more complex event simulation
 * - This test focuses on core functionality: "Does clicking the button work?"
 *
 * LEARNING RESOURCES:
 * - Vitest Documentation: https://vitest.dev/
 * - Konva Documentation: https://konvajs.org/
 * - JavaScript Testing Best Practices: https://testingjavascript.com/
 * - TypeScript Handbook: https://www.typescriptlang.org/docs/
 *
 * ==================================================================================
 */
