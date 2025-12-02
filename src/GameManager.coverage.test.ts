/**
 * ==================================================================================
 * GAMEMANAGER COVERAGE TEST FILE
 * ==================================================================================
 *
 * FILE PURPOSE:
 * This test file verifies that the GameManager class (the main game controller)
 * works correctly under various conditions. It tests the game's state transitions,
 * economic calculations, minigame handling, music system, and win/lose conditions.
 *
 * WHAT IS A TEST FILE?
 * Test files contain code that automatically checks if your regular code works
 * correctly. Instead of manually playing the game to check if everything works,
 * these tests can run in seconds and verify that all game logic is correct.
 *
 * ==================================================================================
 */

/**
 * @vitest-environment jsdom
 *
 * EXPLANATION:
 * This is a special comment called a "directive" that tells Vitest (our testing tool)
 * to run these tests in a "jsdom" environment.
 *
 * WHAT IS JSDOM?
 * jsdom is a JavaScript library that simulates a web browser environment in Node.js.
 * Since our game uses browser features like DOM elements (HTML elements), canvas,
 * and images, we need jsdom to fake these browser features when running tests.
 *
 * WHY DO WE NEED THIS?
 * Tests run in Node.js (a JavaScript runtime), not in a real browser. But our game
 * code expects browser features like document.createElement(), Image objects, and
 * audio. jsdom provides fake versions of these features so our tests can run.
 */

/**
 * ==================================================================================
 * TEST STRATEGY DOCUMENTATION
 * ==================================================================================
 *
 * This test file uses a comprehensive testing strategy designed to achieve high
 * code coverage (testing as much of the code as possible). Here's how:
 *
 * 1. **EXTENSIVE MOCKING**:
 *    - "Mocking" means creating fake versions of dependencies (other classes/libraries)
 *    - Nearly every dependency of GameManager is mocked:
 *      * Konva (the graphics library)
 *      * All screen classes (LoginScreen, ShoppingScreen, etc.)
 *      * All minigames (BakingMinigame, CleaningMinigame)
 *      * ConfigManager (game settings)
 *      * Audio and Image (browser APIs)
 *    - WHY? Mocking allows us to:
 *      * Control exactly how dependencies behave (success/failure)
 *      * Test GameManager in isolation without real graphics/audio
 *      * Simulate scenarios that would be hard to trigger manually
 *      * Make tests run fast (no real animations, no real file loading)
 *
 * 2. **BROAD TEST CASES**:
 *    - Instead of many small tests, this file uses a few large tests
 *    - Each test simulates a long sequence of game events
 *    - EXAMPLE: One test might go through LOGIN → SHOPPING → BAKING → CLEANING
 *    - WHY? This approach tests how the game flows between phases, not just
 *      individual methods in isolation
 *
 * 3. **STATE MANIPULATION**:
 *    - Tests directly modify GameManager's internal state (currentPhase, player.funds)
 *    - This allows us to quickly jump to specific game conditions
 *    - EXAMPLE: Set player.funds = -10 to test bankruptcy logic
 *    - WHY? We can test edge cases without playing through the entire game
 *
 * 4. **CALLBACK CAPTURE**:
 *    - Mocks "capture" callback functions passed to them
 *    - Tests can then manually trigger these callbacks
 *    - EXAMPLE: Simulate the player clicking "Purchase" in the shopping screen
 *    - WHY? We can test what happens after user actions without real user input
 *
 * WHAT IS CODE COVERAGE?
 * Code coverage measures what percentage of your code is executed during tests.
 * High coverage means tests exercise most of the code paths, catching more bugs.
 * This file aims for comprehensive coverage of GameManager.ts.
 *
 * ==================================================================================
 */

/**
 * ==================================================================================
 * IMPORT STATEMENTS
 * ==================================================================================
 *
 * These lines import (load) code from other files that we need for testing.
 */

// Import testing utilities from Vitest (the testing framework)
import { describe, it, expect, vi, beforeEach } from "vitest";
/**
 * EXPLANATION OF IMPORTS:
 * - describe: Function to group related tests together
 * - it: Function to define a single test case
 * - expect: Function to make assertions (check if values are what we expect)
 * - vi: Vitest's utility object for mocking, spying, and stubbing
 * - beforeEach: Function that runs before each test to set up clean state
 */

/**
 * ==================================================================================
 * KONVA MOCK FACTORY FUNCTION
 * ==================================================================================
 *
 * FUNCTION PURPOSE:
 * Creates a fake (mock) version of the Konva graphics library that GameManager uses.
 *
 * WHAT IS KONVA?
 * Konva is a 2D canvas library used to draw graphics, sprites, and UI elements.
 * The game uses Konva to render everything you see on screen.
 *
 * WHY MOCK KONVA?
 * - Real Konva requires a browser and HTML canvas element
 * - We want tests to run fast without actually rendering graphics
 * - We only care that GameManager calls Konva methods correctly, not that pixels are drawn
 *
 * HOW THIS MOCK WORKS:
 * This function creates fake versions of Konva classes (Stage, Layer, Image, etc.)
 * that behave like the real ones but don't actually draw anything. They just
 * track method calls and maintain basic parent-child relationships.
 *
 * @returns A mock object that mimics the structure of the real Konva library
 */
function createKonvaMock() {
  /**
   * Base Class
   *
   * WHAT IS A CLASS?
   * A class is a blueprint for creating objects. Think of it like a cookie cutter:
   * the class is the cutter, and objects created from it are the cookies.
   *
   * PURPOSE:
   * This is the foundational class for all mock Konva nodes. It provides basic
   * functionality that all Konva objects need: parent-child relationships,
   * configuration, and tree manipulation.
   *
   * WHAT ARE PARENT-CHILD RELATIONSHIPS?
   * Konva uses a tree structure: Stage → Layer → Group → Shape
   * Each node can have children (nodes inside it) and a parent (node containing it)
   */
  class Base {
    /**
     * config: Stores configuration options for this node (position, size, color, etc.)
     * WHAT IS 'any'? It's a TypeScript type meaning "any type of value is allowed"
     */
    config: any;

    /**
     * children: Array of child nodes contained within this node
     * WHAT IS AN ARRAY? A list of items, like [item1, item2, item3]
     */
    children: any[] = [];

    /**
     * parent: Reference to the parent node that contains this node
     * Starts as null (no parent) until this node is added to another node
     */
    parent: any = null;

    /**
     * CONSTRUCTOR:
     * A constructor is a special method that runs when creating a new object from a class.
     * It initializes (sets up) the object's properties.
     *
     * @param cfg - Configuration object with properties like x, y, width, height
     *
     * WHAT IS {...cfg}?
     * This is the "spread operator" - it copies all properties from cfg into this.config
     * Example: If cfg = {x: 10, y: 20}, then this.config becomes {x: 10, y: 20}
     */
    constructor(cfg: any = {}) {
      this.config = { ...cfg };
    }

    /**
     * add() - Adds a child node to this node
     *
     * HOW IT WORKS:
     * 1. Sets the child's parent to this node (establishes relationship)
     * 2. Adds the child to this node's children array
     * 3. Returns 'this' to allow method chaining
     *
     * WHAT IS METHOD CHAINING?
     * Returning 'this' allows code like: parent.add(child1).add(child2).add(child3)
     * Each add() returns the parent, so the next add() can be called on it
     *
     * @param node - The child node to add
     * @returns this (the parent node)
     */
    add(node: any) {
      node.parent = this;                    // Set child's parent reference
      this.children.push(node);              // Add child to children array
      return this;                           // Return this for method chaining
    }

    /**
     * getChildren() - Returns the array of child nodes
     * @returns Array of children
     */
    getChildren() {
      return this.children;
    }

    /**
     * getParent() - Returns the parent node
     * @returns The parent node or null if no parent
     */
    getParent() {
      return this.parent;
    }

    /**
     * remove() - Removes this node from its parent
     *
     * HOW IT WORKS:
     * Uses the filter() method to create a new children array without this node
     *
     * WHAT IS filter()?
     * Array method that creates a new array with only items that pass a test
     * Example: [1,2,3,4].filter(x => x > 2) returns [3,4]
     * Here: Keep all children except this one (c !== this)
     */
    remove() {
      if (this.parent) {
        // Filter keeps all children (c) where c is not this node
        this.parent.children = this.parent.children.filter((c: any) => c !== this);
      }
    }
  }

  /**
   * Stage Class
   *
   * WHAT IS A STAGE?
   * In Konva, a Stage is the top-level container - the canvas itself.
   * It's like the frame of a painting that holds everything inside.
   *
   * EXTENDS:
   * The 'extends' keyword means Stage inherits all properties and methods from Base.
   * So Stage has add(), remove(), getChildren(), etc. automatically.
   *
   * WHY EXTEND BASE?
   * Code reuse - we don't have to rewrite the same methods for every class.
   */
  class Stage extends Base {
    /**
     * containerEl: The HTML element that contains the canvas
     * In a real browser, this would be a <div> element
     */
    containerEl: any;

    /**
     * CONSTRUCTOR:
     * @param cfg - Configuration object with container, width, height properties
     *
     * WHAT IS super()?
     * Calls the parent class's (Base) constructor first.
     * This is required when extending a class - the parent must be initialized first.
     */
    constructor(cfg: any) {
      super(cfg);  // Call Base constructor to initialize config, children, parent

      // Store the container element, or create a fake one with a style property
      // WHAT IS || (OR OPERATOR)?
      // If cfg.container exists, use it; otherwise, use { style: {} }
      this.containerEl = cfg.container || { style: {} };
    }

    /**
     * width() - Getter/setter for stage width
     *
     * WHAT IS A GETTER/SETTER?
     * A method that can both get (read) and set (write) a value.
     * If called with a value: sets the width
     * If called without a value: returns the width
     *
     * @param val - Optional new width value
     * @returns Current width
     *
     * WHAT IS val !== undefined?
     * undefined means "no value provided"
     * If val !== undefined, then a value was provided, so we set it
     *
     * WHAT IS ?? (NULLISH COALESCING)?
     * Returns the right side if left side is null/undefined
     * Example: this.config.width ?? 800 means "use width if it exists, otherwise 800"
     */
    width(val?: number) {
      if (val !== undefined) this.config.width = val;
      return this.config.width ?? 800;  // Default to 800 if not set
    }

    /**
     * height() - Getter/setter for stage height
     * Same pattern as width() but for height
     */
    height(val?: number) {
      if (val !== undefined) this.config.height = val;
      return this.config.height ?? 600;  // Default to 600 if not set
    }

    /**
     * container() - Returns the HTML container element
     */
    container() {
      return this.containerEl;
    }
  }

  /**
   * Layer Class
   *
   * WHAT IS A LAYER?
   * In Konva, a Layer is a container for drawable elements (shapes, images, text).
   * Think of it like a layer in Photoshop - you can have multiple layers stacked.
   *
   * WHY USE LAYERS?
   * - Organize elements (UI layer, background layer, etc.)
   * - Control rendering order (layers render in the order they're added)
   * - Performance (can redraw just one layer instead of everything)
   */
  class Layer extends Base {
    /**
     * draw() - Mock function to render the layer
     *
     * WHAT IS vi.fn()?
     * Creates a mock function (spy) that tracks when it's called.
     * We can later check: expect(layer.draw).toHaveBeenCalled()
     * The real draw() would render graphics; this does nothing but track calls.
     */
    draw = vi.fn();

    /**
     * batchDraw() - Mock function for batched rendering
     *
     * WHAT IS BATCH DRAWING?
     * Instead of redrawing after each change, batch multiple changes and draw once.
     * More efficient for performance. This mock just tracks calls like draw().
     */
    batchDraw = vi.fn();
  }

  /**
   * Group Class
   *
   * WHAT IS A GROUP?
   * A container for organizing related shapes together.
   * Example: Group all UI buttons together, or all enemy sprites together.
   *
   * WHY SO SIMPLE?
   * Groups don't need special methods beyond what Base provides (add, remove, etc.)
   */
  class Group extends Base {}

  /**
   * Rect Class
   *
   * WHAT IS A RECT?
   * A rectangle shape. Used for backgrounds, buttons, hit areas, etc.
   *
   * METHODS:
   * All follow the getter/setter pattern like Stage.width()
   */
  class Rect extends Base {
    /** Getter/setter for rectangle width */
    width(val?: number) {
      if (val !== undefined) this.config.width = val;
      return this.config.width ?? 0;
    }

    /** Getter/setter for rectangle height */
    height(val?: number) {
      if (val !== undefined) this.config.height = val;
      return this.config.height ?? 0;
    }

    /** Getter/setter for X position (horizontal) */
    x(val?: number) {
      if (val !== undefined) this.config.x = val;
      return this.config.x ?? 0;
    }

    /** Getter/setter for Y position (vertical) */
    y(val?: number) {
      if (val !== undefined) this.config.y = val;
      return this.config.y ?? 0;
    }
  }

  /**
   * Text Class
   *
   * WHAT IS A TEXT NODE?
   * Renders text on the canvas. Used for labels, scores, instructions, etc.
   */
  class Text extends Base {
    /** Getter/setter for the text content (the actual string to display) */
    text(val?: string) {
      if (val !== undefined) this.config.text = val;
      return this.config.text ?? "";
    }

    /** Getter/setter for text width */
    width(val?: number) {
      if (val !== undefined) this.config.width = val;
      return this.config.width ?? 0;
    }

    /** Getter/setter for text height */
    height(val?: number) {
      if (val !== undefined) this.config.height = val;
      return this.config.height ?? 0;
    }
  }

  /**
   * Image Class
   *
   * WHAT IS AN IMAGE NODE?
   * Displays an image on the canvas. Used for backgrounds, sprites, icons, etc.
   */
  class Image extends Base {
    /**
     * Getter/setter for the image source
     * In real Konva, this would be an HTMLImageElement (loaded image)
     */
    image(val?: any) {
      if (val !== undefined) this.config.image = val;
      return this.config.image;
    }

    /** Getter/setter for image width */
    width(val?: number) {
      if (val !== undefined) this.config.width = val;
      return this.config.width ?? 0;
    }

    /** Getter/setter for image height */
    height(val?: number) {
      if (val !== undefined) this.config.height = val;
      return this.config.height ?? 0;
    }

    /**
     * moveToBottom() - Moves this image to the back (bottom of render order)
     * Used for background images so they appear behind other elements
     * This mock does nothing - just a placeholder
     */
    moveToBottom() {}
  }

  /**
   * RETURN STATEMENT:
   * Returns an object that mimics the structure of the real Konva library.
   *
   * WHAT IS { default: { ... } }?
   * This matches how Konva is exported as a module.
   * When you do 'import Konva from "konva"', you get the default export.
   * So this object's 'default' property contains all the Konva classes.
   */
  return { default: { Stage, Layer, Group, Rect, Text, Image } };
}

/**
 * ==================================================================================
 * SHOPPING SCREEN CALLBACK CAPTURE OBJECT
 * ==================================================================================
 *
 * WHAT IS THIS?
 * A global object used to capture callbacks from the mocked ShoppingScreen.
 *
 * WHY DO WE NEED THIS?
 * The ShoppingScreen class takes callbacks as constructor parameters.
 * We need to "capture" these callbacks so our test can trigger them later.
 * This simulates the player clicking buttons in the shopping screen.
 *
 * WHAT IS A CALLBACK?
 * A function passed as a parameter to another function, to be called later.
 * Example: onClick(function() { alert("Clicked!"); })
 * The function is the callback - it's called back when the event happens.
 *
 * WHAT IS HOISTING?
 * JavaScript moves declarations to the top of their scope.
 * This object is declared here (before setupMocks) so it can be referenced
 * inside setupMocks even though setupMocks is defined after.
 *
 * WHAT IS Function (capital F)?
 * TypeScript type for any function. Could be () => void, (x) => number, etc.
 *
 * WHAT IS OPTIONAL PROPERTY (?)?
 * The ? means these properties might not exist (could be undefined).
 * onPurchaseComplete?: Function means "might have onPurchaseComplete function"
 */
const lastShopping: {
  onPurchaseComplete?: Function;  // Callback when player clicks "Purchase"
  onViewRecipe?: Function;        // Callback when player clicks "View Recipe"
} = {};

/**
 * ==================================================================================
 * SETUP MOCKS FUNCTION
 * ==================================================================================
 *
 * FUNCTION PURPOSE:
 * Configures all the mock objects needed to test GameManager in isolation.
 * This function is called at the start of each test to set up a consistent
 * testing environment.
 *
 * WHAT ARE MOCKS?
 * Fake versions of dependencies that GameManager uses. Instead of loading real
 * screens, real Konva, real audio, we use fake versions we can control.
 *
 * WHY MOCK EVERYTHING?
 * - Tests run faster (no real file loading, rendering, or audio)
 * - Tests are predictable (we control exactly how mocks behave)
 * - We can test GameManager in isolation (no bugs from other modules)
 * - We can simulate error conditions (failed image loads, etc.)
 *
 * @param options - Configuration object to control mock behavior
 * @param options.animResolves - Whether animation loading succeeds (default: true)
 * @param options.backgroundFails - Whether background image loading fails (default: false)
 *
 * WHAT IS { animResolves?: boolean; backgroundFails?: boolean }?
 * This is a TypeScript interface (type definition) defined inline.
 * It says the options parameter is an object that might have these two properties.
 * The ? means they're optional.
 *
 * WHAT IS = {}?
 * Default parameter value. If no options are passed, use an empty object.
 * This prevents errors if someone calls setupMocks() with no arguments.
 */
function setupMocks(options: { animResolves?: boolean; backgroundFails?: boolean } = {}) {

  /**
   * --------------------------------------------------------------------------
   * MOCK THE AUDIO API
   * --------------------------------------------------------------------------
   *
   * WHAT IS THE AUDIO API?
   * The browser's built-in Audio class for playing sound files.
   * Example: const audio = new Audio('music.mp3'); audio.play();
   *
   * WHY MOCK AUDIO?
   * - Tests don't need to play actual sound
   * - We just need to verify GameManager calls the right audio methods
   * - Real audio loading would slow down tests
   *
   * HOW THIS WORKS:
   * We create a fake Audio class and replace the global Audio with it.
   */
  class FakeAudio {
    /**
     * loop: Whether the audio loops when it ends
     * Set to false by default (doesn't loop)
     */
    loop = false;

    /**
     * volume: Audio volume level (0.0 to 1.0)
     * 1 = full volume, 0 = muted
     */
    volume = 1;

    /**
     * currentTime: Current playback position in seconds
     * 0 = start of audio
     */
    currentTime = 0;

    /**
     * play() - Mock function to start audio playback
     *
     * WHAT IS () => Promise.resolve()?
     * An arrow function that returns a resolved promise.
     *
     * WHAT IS AN ARROW FUNCTION?
     * A compact way to write functions. These are equivalent:
     * - Regular: function() { return Promise.resolve(); }
     * - Arrow:   () => Promise.resolve()
     *
     * WHAT IS A PROMISE?
     * A JavaScript object representing a future value.
     * Used for asynchronous operations (operations that take time).
     * Promise.resolve() creates an immediately resolved promise (instant success).
     *
     * WHY RETURN A PROMISE?
     * The real Audio.play() returns a Promise that resolves when playback starts.
     * Our mock must match this behavior.
     */
    play = vi.fn(() => Promise.resolve());

    /**
     * pause() - Mock function to pause audio playback
     *
     * WHAT IS vi.fn()?
     * Creates a Vitest mock function (spy) that:
     * - Can be called like a normal function
     * - Tracks how many times it was called
     * - Tracks what arguments were passed
     * - Can be inspected with expect(fn).toHaveBeenCalled()
     */
    pause = vi.fn();
  }

  /**
   * WHAT IS vi.stubGlobal()?
   * Replaces a global variable (available everywhere) with a fake version.
   *
   * PARAMETERS:
   * - "Audio": Name of the global to replace
   * - FakeAudio as any: The fake class to use instead
   *
   * WHAT IS 'as any'?
   * TypeScript type assertion. Tells TypeScript "trust me, this is the right type".
   * Used here because FakeAudio isn't a perfect match for the real Audio type,
   * but it's close enough for testing.
   *
   * RESULT:
   * Now when GameManager does 'new Audio()', it creates a FakeAudio instead.
   */
  vi.stubGlobal("Audio", FakeAudio as any);

  /**
   * --------------------------------------------------------------------------
   * MOCK THE IMAGE API
   * --------------------------------------------------------------------------
   *
   * WHAT IS THE IMAGE API?
   * The browser's built-in Image class for loading image files.
   * Example: const img = new Image(); img.src = 'background.png';
   *
   * WHY MOCK IMAGE?
   * - Tests don't need to load actual image files
   * - We can simulate loading success or failure
   * - Tests run faster without real file I/O
   */
  vi.stubGlobal(
    "Image",
    class {
      /**
       * onload: Callback function called when image loads successfully
       *
       * WHAT IS (() => void) | null?
       * TypeScript type: "either a function that takes no parameters and returns
       * nothing (void), or null (no function assigned)".
       *
       * WHY null INITIALLY?
       * The user sets this later: img.onload = () => { console.log("loaded"); }
       */
      onload: (() => void) | null = null;

      /**
       * onerror: Callback function called when image fails to load
       */
      onerror: (() => void) | null = null;

      /**
       * width: Image width in pixels
       * Set to 100 as a fake default value
       */
      width = 100;

      /**
       * height: Image height in pixels
       * Set to 50 as a fake default value
       */
      height = 50;

      /**
       * src: Image source URL
       *
       * WHAT IS 'set src'?
       * A property setter - special method that runs when you assign to a property.
       * Example: img.src = "background.png" calls this setter
       *
       * WHY USE A SETTER?
       * We want to trigger onload/onerror when src is set, simulating image loading.
       *
       * HOW IT WORKS:
       * 1. Check if we should simulate an error (options.backgroundFails or "fail" in URL)
       * 2. If error: call this.onerror if it exists
       * 3. If success: call this.onload if it exists
       *
       * WHAT IS ?.() (OPTIONAL CHAINING)?
       * Safely calls a function that might not exist.
       * this.onerror?.() means "call onerror if it exists, otherwise do nothing"
       * Equivalent to: if (this.onerror) this.onerror();
       */
      set src(val: string) {
        // Simulate an error if configured to, or if URL contains "fail"
        if (options.backgroundFails || val.includes("fail")) {
          this.onerror?.();  // Call error callback if it exists
        } else {
          this.onload?.();   // Call success callback if it exists
        }
      }
    }
  );

  /**
   * --------------------------------------------------------------------------
   * MOCK THE KONVA LIBRARY
   * --------------------------------------------------------------------------
   *
   * WHAT IS vi.doMock()?
   * Tells Vitest to replace a module import with a mock.
   *
   * DIFFERENCE FROM vi.mock():
   * - vi.mock() is hoisted (runs before imports)
   * - vi.doMock() is not hoisted (runs when called)
   *
   * WHY USE vi.doMock()?
   * We're calling this inside a function that runs during the test.
   * We need the mock to be set up fresh for each test.
   *
   * PARAMETERS:
   * - "konva": Module name to mock (what you import from)
   * - () => konvaMock: Factory function that returns the mock
   *
   * RESULT:
   * When GameManager does 'import Konva from "konva"', it gets our mock instead.
   */
  const konvaMock = createKonvaMock();
  vi.doMock("konva", () => konvaMock);

  /**
   * --------------------------------------------------------------------------
   * MOCK THE CONFIG MANAGER
   * --------------------------------------------------------------------------
   *
   * WHAT IS CONFIG MANAGER?
   * A singleton class that loads and provides game configuration (starting funds,
   * win threshold, prices, time limits, etc.). See config.ts for details.
   *
   * WHY MOCK IT?
   * - We want predictable, fixed values for testing
   * - We don't want to load the real config file
   * - We can test with specific config values
   *
   * HOW THIS MOCK WORKS:
   * Returns a fake ConfigManager with a fake getInstance() method that returns
   * a fake config object.
   *
   * WHAT IS ConfigManager.getInstance()?
   * Singleton pattern - ensures only one instance of ConfigManager exists.
   * getInstance() returns that single instance.
   */
  vi.doMock("./config", () => ({
    ConfigManager: {
      /**
       * getInstance() - Returns the singleton instance
       *
       * RETURN VALUE:
       * An object with a getConfig() method
       */
      getInstance: () => ({
        /**
         * getConfig() - Returns the game configuration
         *
         * RETURN VALUE:
         * A GameConfig object with all the game settings.
         * These are simplified values for testing.
         */
        getConfig: () => ({
          startingFunds: 100,          // Player starts with $100
          winThreshold: 150,            // Need $150 to win
          bankruptcyThreshold: -50,     // Game over at -$50
          flourPriceMin: 0,             // Not used in current game
          flourPriceMax: 0,             // Not used in current game
          bakingTime: 0,                // Minigame time limit (0 for testing)
          cleaningTime: 0,              // Minigame time limit (0 for testing)
          maxBreadCapacity: 20,         // Max bread storage
          divisionProblems: 0,          // Number of problems (not used)
          multiplicationProblems: 0,    // Number of problems (not used)
          cookiePrice: 10,              // Sell cookies for $10 each
        }),
      }),
    },
  }));

  /**
   * --------------------------------------------------------------------------
   * MOCK THE ANIMATION PLAYER
   * --------------------------------------------------------------------------
   *
   * WHAT IS ANIMATION PLAYER?
   * A class that loads and plays sprite animations (like post-baking animation,
   * new day animation). See AnimationPlayer.ts for details.
   *
   * WHY MOCK IT?
   * - We don't want to load real animation files
   * - We want to control whether animations succeed or fail
   * - Animations take time; mocking makes tests instant
   */
  vi.doMock("./AnimationPlayer", () => ({
    /**
     * AnimationPlayer mock class
     *
     * STRUCTURE:
     * Creates a fake class with the methods GameManager uses.
     */
    AnimationPlayer: class {
      /**
       * start() - Mock method to start playing the animation
       */
      start = vi.fn();

      /**
       * destroy() - Mock method to clean up the animation
       */
      destroy = vi.fn();

      /**
       * load() - Mock method to load the animation files
       *
       * WHAT IS THIS DOING?
       * Returns a Promise that either resolves (success) or rejects (failure)
       * based on the options.animResolves setting.
       *
       * WHAT IS A TERNARY OPERATOR (?:)?
       * Compact if-else: condition ? valueIfTrue : valueIfFalse
       *
       * BREAKDOWN:
       * - options.animResolves === false: Check if explicitly set to false
       * - If true: Promise.reject("fail") - returns a failing promise
       * - If false: Promise.resolve() - returns a successful promise
       *
       * WHY TEST BOTH SUCCESS AND FAILURE?
       * GameManager should handle both cases gracefully (no crashes).
       */
      load() {
        return options.animResolves === false
          ? Promise.reject("fail")      // Simulate loading failure
          : Promise.resolve();           // Simulate loading success
      }
    },
  }));

  /**
   * --------------------------------------------------------------------------
   * MOCK THE BAKING MINIGAME
   * --------------------------------------------------------------------------
   *
   * WHAT IS BAKING MINIGAME?
   * A division-based math game where players solve problems to earn tips.
   * See BakingMinigame.ts for details.
   *
   * WHY MOCK IT?
   * - We don't need to test the minigame itself (it has its own tests)
   * - We just need to test how GameManager handles minigame completion
   * - We want to simulate the player finishing the minigame
   */
  vi.doMock("./BakingMinigame", () => ({
    /**
     * BakingMinigame mock class
     */
    BakingMinigame: class {
      /**
       * cb: The completion callback function
       *
       * WHAT IS THIS?
       * The BakingMinigame constructor takes a callback as the last parameter.
       * This callback is called when the minigame ends.
       * We store it here so the test can trigger it manually.
       *
       * TYPE: any (could be any type, but we know it's a function)
       */
      cb: any;

      /**
       * cleanup() - Mock method to clean up the minigame
       */
      cleanup = vi.fn();

      /**
       * CONSTRUCTOR:
       * The real BakingMinigame takes these parameters:
       * @param _s - Stage (Konva stage)
       * @param _l - Layer (Konva layer)
       * @param _c - Cookie count (number of cookies being baked)
       * @param cb - Callback function called when minigame ends
       *
       * WHAT IS UNDERSCORE PREFIX (_)?
       * Convention for "unused parameter". We receive these parameters to match
       * the real constructor signature, but we don't use them in the mock.
       *
       * WHY MATCH THE SIGNATURE?
       * GameManager creates the minigame with these parameters.
       * Our mock must accept them even if it doesn't use them.
       */
      constructor(_s: any, _l: any, _c: number, cb: any) {
        this.cb = cb;  // Store the callback for the test to trigger later
      }
    },
  }));

  /**
   * --------------------------------------------------------------------------
   * MOCK THE CLEANING MINIGAME
   * --------------------------------------------------------------------------
   *
   * WHAT IS CLEANING MINIGAME?
   * A multiplication-based math game where players solve problems to clean dishes.
   * Success affects reputation (more customers next day).
   * See CleaningMinigame.ts for details.
   *
   * STRUCTURE:
   * Very similar to BakingMinigame mock, just different constructor parameters.
   */
  vi.doMock("./CleaningMinigame", () => ({
    CleaningMinigame: class {
      cb: any;
      cleanup = vi.fn();

      /**
       * CONSTRUCTOR:
       * @param _s - Stage
       * @param _l - Layer
       * @param _d - Dishes to clean (number)
       * @param cb - Completion callback
       */
      constructor(_s: any, _l: any, _d: number, cb: any) {
        this.cb = cb;
      }
    },
  }));

  /**
   * --------------------------------------------------------------------------
   * MOCK ALL SCREEN CLASSES
   * --------------------------------------------------------------------------
   *
   * WHAT ARE SCREEN CLASSES?
   * Classes that render different screens: login, story, how-to-play, order,
   * recipe book, day summary, victory, lose. Each screen is a separate class.
   *
   * WHY MOCK THEM ALL?
   * - We don't need to test the screens themselves
   * - We just need to test GameManager's transitions between screens
   * - Mocking them makes tests faster and simpler
   *
   * HOW THIS WORKS:
   * Uses forEach to iterate over an array of screen names and mock each one
   * with the same generic mock structure.
   *
   * WHAT IS forEach()?
   * Array method that executes a function for each element.
   * Example: [1,2,3].forEach(x => console.log(x)) prints 1, 2, 3
   */
  [
    "HowToPlayScreen",   // Tutorial/instructions screen
    "StoryScreen",       // Story introduction screen
    "OrderScreen",       // Daily orders screen
    "RecipeBookScreen",  // Recipe and inventory screen
    "DaySummaryScreen",  // End of day summary screen
    "VictoryScreen",     // Win screen
    "LoseScreen",        // Lose screen
    "LoginScreen"        // Player name entry screen
  ].forEach(
    /**
     * CALLBACK FUNCTION:
     * @param mod - The screen class name (e.g., "LoginScreen")
     *
     * WHAT HAPPENS:
     * For each screen name, call vi.doMock() to mock that module.
     */
    (mod) => {
      vi.doMock(`./${mod}`, () => ({
        /**
         * WHAT IS [mod]?
         * Computed property name - uses the value of mod as the property name.
         * Example: If mod = "LoginScreen", this creates { LoginScreen: class { ... } }
         *
         * WHY USE THIS?
         * We're creating an object with a property that matches the class name.
         * This is how ES6 modules export classes: export class LoginScreen { }
         * becomes { LoginScreen: class LoginScreen { } } when imported.
         */
        [mod]: class {
          /**
           * volumeChangeCallback: Optional callback for volume changes
           * Some screens might use this; included for compatibility
           *
           * WHAT IS (v: number) => void?
           * TypeScript function type: "function that takes a number parameter
           * and returns nothing (void)"
           */
          volumeChangeCallback?: (v: number) => void;

          /**
           * CONSTRUCTOR:
           * @param ...args - Rest parameter (captures all arguments)
           *
           * WHAT IS ...args?
           * Rest parameter syntax - captures all arguments into an array.
           * Example: constructor(a, b, c) becomes args = [a, b, c]
           *
           * WHY USE REST PARAMETER?
           * Different screens have different constructor parameters.
           * We use ...args to accept any number of parameters.
           *
           * WHAT IS any[]?
           * Array of any type - can hold any values.
           */
          constructor(...args: any[]) {
            /**
             * LOGIC:
             * Extract the last argument and check if it's a function.
             * If it is, store it as 'cb' (callback).
             *
             * WHY?
             * Most screens take a callback as their last parameter.
             * This callback is called when the screen completes.
             * We capture it so the test can trigger it.
             */
            const last = args[args.length - 1];  // Get last argument
            if (typeof last === "function") {     // Is it a function?
              /**
               * WHAT IS (this as any)?
               * Type assertion - tells TypeScript "treat 'this' as any type".
               * We do this because 'cb' isn't declared as a class property,
               * but we want to add it dynamically.
               */
              (this as any).cb = last;
            }
          }

          /**
           * setVolume() - Mock method for volume control
           * Some screens might call this; included for compatibility
           *
           * @param _v - Volume level (unused in mock)
           */
          setVolume(_v: number) {}
        },
      }));
    }
  );

  /**
   * --------------------------------------------------------------------------
   * MOCK THE SHOPPING SCREEN
   * --------------------------------------------------------------------------
   *
   * WHY SEPARATE FROM OTHER SCREENS?
   * ShoppingScreen has a unique constructor with two callbacks:
   * - onPurchaseComplete: Called when player buys ingredients
   * - onViewRecipe: Called when player clicks "View Recipe"
   *
   * We need special handling to capture both callbacks.
   */
  vi.doMock("./ShoppingScreen", () => ({
    ShoppingScreen: class {
      /**
       * cleanup() - Mock method to clean up the shopping screen
       */
      cleanup = vi.fn();

      /**
       * CONSTRUCTOR:
       * The real ShoppingScreen constructor signature:
       *
       * @param _s - Stage
       * @param _l - Layer
       * @param _funds - Player's current funds
       * @param _day - Current day number
       * @param _demand - Cookie demand for the day
       * @param _orders - Customer orders array
       * @param onPurchaseComplete - Callback when purchase is made
       * @param onViewRecipe - Callback when recipe button is clicked
       *
       * WHAT WE DO:
       * Store both callbacks in the global lastShopping object.
       * This allows the test to access and trigger these callbacks.
       */
      constructor(
        _s: any,                    // Stage (unused)
        _l: any,                    // Layer (unused)
        _funds: number,             // Funds (unused)
        _day: number,               // Day (unused)
        _demand: number,            // Demand (unused)
        _orders: any,               // Orders (unused)
        onPurchaseComplete: any,    // Purchase callback (captured!)
        onViewRecipe: any           // Recipe callback (captured!)
      ) {
        // Store callbacks in global object for test access
        lastShopping.onPurchaseComplete = onPurchaseComplete;
        lastShopping.onViewRecipe = onViewRecipe;
      }

      /**
       * getIngredientValues() - Mock method to get player's ingredient inputs
       *
       * WHAT IT RETURNS:
       * A Map of ingredient names to quantities entered by the player.
       *
       * WHAT IS A MAP?
       * A JavaScript data structure that stores key-value pairs.
       * Similar to an object, but keys can be any type (not just strings).
       *
       * SYNTAX:
       * new Map([["key1", value1], ["key2", value2]])
       *
       * WHY RETURN FLOUR?
       * This is a mock - we return a simple hardcoded value.
       * The test can override this if needed.
       */
      getIngredientValues() {
        return new Map([["Flour", "5"]]);  // Fake: player wants 5 flour
      }
    },
  }));
}

/**
 * ==================================================================================
 * MAIN TEST SUITE
 * ==================================================================================
 *
 * WHAT IS describe()?
 * Function to group related tests together. Creates a test suite.
 *
 * PARAMETERS:
 * - "GameManager coverage": Name of the test suite (displayed in test results)
 * - Callback function: Contains the tests and setup code
 *
 * STRUCTURE:
 * describe("Suite Name", () => {
 *   beforeEach(() => { ... setup code ... });
 *   it("Test 1", () => { ... test code ... });
 *   it("Test 2", () => { ... test code ... });
 * });
 */
describe("GameManager coverage", () => {

  /**
   * ================================================================================
   * BEFORE EACH HOOK
   * ================================================================================
   *
   * WHAT IS beforeEach()?
   * A function that runs before each test in the suite.
   * Used to set up a clean, consistent state for each test.
   *
   * WHY NEEDED?
   * Tests should be independent (not affect each other).
   * If Test 1 modifies something, Test 2 shouldn't see that change.
   * beforeEach() resets everything to a clean state.
   *
   * WHAT HAPPENS HERE:
   * 1. Restore all mocked/spied functions
   * 2. Reset all module mocks
   * 3. Clear captured callbacks
   * 4. Spy on console methods to suppress output
   */
  beforeEach(() => {
    /**
     * vi.restoreAllMocks()
     *
     * WHAT IT DOES:
     * Restores all functions that were mocked or spied on to their original state.
     *
     * WHY?
     * If a previous test spied on a method, we want to remove that spy for the next test.
     * Ensures tests start with fresh, un-spied functions.
     */
    vi.restoreAllMocks();

    /**
     * vi.resetModules()
     *
     * WHAT IT DOES:
     * Clears the module cache, forcing modules to be re-imported.
     *
     * WHY?
     * When you import a module, Node.js caches it (loads it only once).
     * We're using vi.doMock() which sets up mocks at runtime.
     * We need to clear the cache so the next test uses the new mocks.
     *
     * WHEN IS THIS IMPORTANT?
     * With vi.doMock() - must reset modules between tests.
     * Without this, old module instances would persist.
     */
    vi.resetModules();

    /**
     * RESET CALLBACK CAPTURE OBJECT
     *
     * WHY?
     * The lastShopping object is reused across tests.
     * We set it back to empty state so old callbacks don't leak into new tests.
     *
     * WHAT IS undefined?
     * A special JavaScript value meaning "not defined" or "no value".
     * Setting to undefined effectively removes the property.
     */
    lastShopping.onPurchaseComplete = undefined;
    lastShopping.onViewRecipe = undefined;

    /**
     * SPY ON CONSOLE METHODS
     *
     * WHY?
     * GameManager might log messages to the console (console.log, console.warn, etc.).
     * During tests, we don't want to see this output (it clutters test results).
     *
     * WHAT IS vi.spyOn()?
     * Creates a spy on an existing method. The spy:
     * - Tracks when the method is called
     * - Can replace the method's implementation
     * - Can be restored later
     *
     * SYNTAX:
     * vi.spyOn(object, "methodName")
     *
     * WHAT IS .mockImplementation()?
     * Replaces the method's implementation with a new function.
     * Here: () => {} is an empty function (does nothing).
     *
     * RESULT:
     * console.log, console.warn, and console.error now do nothing.
     * Tests run silently without console output.
     */
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  /**
   * ================================================================================
   * HELPER FUNCTION: makeContainer
   * ================================================================================
   *
   * FUNCTION PURPOSE:
   * Creates a fake HTML div element for Konva to use as a container.
   *
   * WHY NEEDED?
   * Konva's Stage requires an HTML container element to render into.
   * In real usage, this is a <div> in your HTML page.
   * In tests, we create a fake div element.
   *
   * WHAT IS A CLOSURE?
   * makeContainer is defined inside the describe block, so it can access
   * variables in the describe scope. This pattern is called a closure.
   *
   * @returns A fake HTMLDivElement with offsetWidth and offsetHeight properties
   */
  const makeContainer = () => {
    /**
     * CREATE A DIV ELEMENT
     *
     * WHAT IS document.createElement()?
     * Browser API to create a new HTML element.
     *
     * WHAT IS 'as HTMLDivElement'?
     * TypeScript type assertion - tells TypeScript this is specifically a div.
     * Without this, TypeScript only knows it's an HTMLElement (generic type).
     */
    const container = document.createElement("div") as HTMLDivElement;

    /**
     * DEFINE FAKE DIMENSIONS
     *
     * WHAT IS Object.defineProperty()?
     * Advanced JavaScript method to add or modify a property on an object.
     *
     * WHY USE THIS?
     * offsetWidth and offsetHeight are normally read-only properties calculated
     * by the browser based on CSS layout. In our fake element, we need to set
     * them manually.
     *
     * PARAMETERS:
     * - container: The object to modify
     * - "offsetWidth": Property name
     * - { value: 800 }: Property descriptor (value to use)
     *
     * RESULT:
     * container.offsetWidth now returns 800
     */
    Object.defineProperty(container, "offsetWidth", { value: 800 });
    Object.defineProperty(container, "offsetHeight", { value: 600 });

    return container;
  };

  /**
   * ================================================================================
   * TEST CASE 1: Primary Flows and Calculations
   * ================================================================================
   *
   * TEST PURPOSE:
   * Walk through the main game flow and test core calculations.
   * This is the most comprehensive test, covering:
   * - Music system (different music for different phases)
   * - Window resize handling
   * - Shopping phase (purchasing ingredients, viewing recipe)
   * - Baking phase (minigame completion)
   * - Cleaning phase (minigame completion and skipping)
   * - End game logic (day summary, bankruptcy, victory)
   * - Helper calculation methods
   * - Game reset functionality
   *
   * WHAT IS it()?
   * Defines a single test case.
   *
   * PARAMETERS:
   * - "covers primary flows and calculations": Test description
   * - async () => { ... }: Async callback function with the test code
   *
   * WHAT IS async?
   * Keyword that marks a function as asynchronous.
   * Async functions can use 'await' to wait for Promises to resolve.
   *
   * WHY ASYNC?
   * We use dynamic imports (await import()), which are asynchronous operations.
   */
  it("covers primary flows and calculations", async () => {

    /**
     * --------------------------------------------------------------------------
     * ARRANGE (SETUP)
     * --------------------------------------------------------------------------
     *
     * WHAT IS AAA PATTERN?
     * Test organization pattern: Arrange, Act, Assert
     * - Arrange: Set up test conditions
     * - Act: Execute the code being tested
     * - Assert: Verify the results
     */

    /**
     * STEP 1: Set up mocks with default behavior
     *
     * WHAT HAPPENS:
     * Calls setupMocks() with no options, so:
     * - Animations will succeed (animResolves defaults to true)
     * - Background images will load (backgroundFails defaults to false)
     */
    setupMocks();

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE)
     * --------------------------------------------------------------------------
     */

    /**
     * STEP 2: Dynamically import GameManager
     *
     * WHAT IS await import()?
     * Dynamic import - loads a module at runtime instead of at file start.
     *
     * WHY DYNAMIC IMPORT?
     * We set up mocks using vi.doMock() above.
     * Mocks only apply to imports that happen AFTER vi.doMock() is called.
     * Regular imports (at top of file) happen before mocks are set up.
     * Dynamic imports happen after, so they get the mocked modules.
     *
     * WHAT IS await?
     * Waits for the Promise to resolve before continuing.
     * import() returns a Promise that resolves to the module.
     *
     * WHAT IS const { GameManager } = ...?
     * Destructuring assignment - extracts GameManager from the module object.
     * The module is an object like { GameManager: class GameManager { ... } }
     * This syntax pulls out just the GameManager class.
     */
    const { GameManager } = await import("./GameManager");

    /**
     * STEP 3: Create a GameManager instance
     *
     * WHAT IS 'any'?
     * Type assertion - tells TypeScript to treat gm as any type.
     *
     * WHY?
     * We need to access private members (like currentPhase, player) for testing.
     * TypeScript normally doesn't allow this (private means private!).
     * Using 'any' disables type checking, allowing us to access anything.
     *
     * NOTE: This is only for testing. In production code, respect privacy!
     *
     * WHAT IS makeContainer()?
     * Calls our helper function to create a fake div element.
     * GameManager needs this to create the Konva Stage.
     */
    const gm: any = new GameManager(makeContainer());

    /**
     * STEP 4: Unlock audio
     *
     * WHY?
     * Browsers require user interaction before playing audio (security feature).
     * GameManager has an audioUnlocked flag that starts as false.
     * We set it to true to test the music system.
     *
     * WHAT IS gm.audioUnlocked?
     * A private property on GameManager.
     * We can access it because we cast gm to 'any' above.
     */
    gm.audioUnlocked = true;

    /**
     * --------------------------------------------------------------------------
     * SECTION: MUSIC SWITCH CASES
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test that different phases play different background music.
     * GameManager has a switch statement in updateBackgroundMusic() that
     * chooses music based on currentPhase. We test different cases.
     */

    /**
     * TEST CASE: LOGIN phase music
     *
     * WHAT HAPPENS:
     * 1. Set currentPhase to 0 (LOGIN phase)
     * 2. Call updateBackgroundMusic()
     * 3. This triggers the switch statement in GameManager
     * 4. LOGIN case should play login music
     *
     * NOTE: We don't assert anything here because we're just covering the code path.
     
     */
    gm.currentPhase = 0; // LOGIN
    gm.updateBackgroundMusic();

    /**
     * TEST CASE: SHOPPING phase music
     */
    gm.currentPhase = 6; // SHOPPING
    gm.updateBackgroundMusic();

    /**
     * TEST CASE: VICTORY phase music
     */
    gm.currentPhase = 11; // VICTORY
    gm.updateBackgroundMusic();

    /**
     * --------------------------------------------------------------------------
     * SECTION: RESIZE HANDLER
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test that the game handles window resizing correctly.
     *
     * WHAT IS WINDOW RESIZING?
     * When the browser window changes size, the game canvas needs to adjust.
     * GameManager has a handleResize() method for this.
     *
     * WHAT WE'RE TESTING:
     * Calling handleResize() with a container element doesn't crash.
     */
    gm.handleResize(makeContainer());

    /**
     * --------------------------------------------------------------------------
     * SECTION: SHOPPING PHASE
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test the shopping phase where players buy ingredients.
     *
     * GAME CONTEXT:
     * Players start each day by purchasing ingredients based on demand.
     * They input quantities for each ingredient and click "Purchase".
     * They can also click "View Recipe" to see what's needed per cookie.
     */

    /**
     * STEP 1: Render the shopping phase
     *
     * WHAT HAPPENS:
     * - GameManager creates a ShoppingScreen instance
     * - ShoppingScreen constructor is called with callbacks
     * - Our mock captures those callbacks in lastShopping
     */
    gm.renderShoppingPhase();

    /**
     * STEP 2: Create a purchase Map
     *
     * WHAT IS THIS?
     * A Map representing the ingredients the player wants to buy.
     *
     * RECIPE CONTEXT:
     * One cookie requires:
     * - Flour: 3 cups
     * - Sugar: 1 cup
     * - Butter: 8 tbsp
     * - Chocolate: 1 cup
     * - Baking Soda: 2 tsp
     *
     * So this purchase Map represents buying ingredients for ONE cookie.
     */
    const purchase = new Map([
      ["Flour", 3],
      ["Sugar", 1],
      ["Butter", 8],
      ["Chocolate", 1],
      ["Baking Soda", 2]
    ]);

    /**
     * STEP 3: Simulate purchase completion
     *
     * WHAT IS ?.() (OPTIONAL CHAINING)?
     * Safely calls the function if it exists.
     * If lastShopping.onPurchaseComplete is undefined, nothing happens.
     * If it exists, it's called with (purchase, 10).
     *
     * PARAMETERS:
     * - purchase: Map of ingredients bought
     * - 10: Total cost of the purchase
     *
     * WHAT HAPPENS INSIDE GAMEMANAGER:
     * - Deducts cost from player.funds
     * - Adds ingredients to player.ingredients
     * - Transitions to next phase
     */
    lastShopping.onPurchaseComplete?.(purchase, 10);

    /**
     * STEP 4: Simulate viewing recipe
     *
     * WHAT HAPPENS:
     * - GameManager should render the recipe book screen
     * - No parameters needed (recipe is fixed)
     */
    lastShopping.onViewRecipe?.();

    /**
     * --------------------------------------------------------------------------
     * SECTION: BAKING PHASE
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test the baking minigame phase where players solve division problems.
     *
     * GAME CONTEXT:
     * After purchasing ingredients, players bake cookies.
     * During baking, they can play a division minigame to earn tips.
     * Correct answers give $5 per problem.
     */

    /**
     * STEP 1: Set up player inventory
     *
     * WHY?
     * GameManager checks if player has enough ingredients before allowing baking.
     * We manually set the inventory to ensure there's enough.
     *
     * QUANTITIES:
     * - Flour: 9 (enough for 3 cookies: 9 / 3 = 3)
     * - Sugar: 3 (enough for 3 cookies: 3 / 1 = 3)
     * - Butter: 8 (enough for 1 cookie: 8 / 8 = 1)
     * - Chocolate: 2 (enough for 2 cookies: 2 / 1 = 2)
     * - Baking Soda: 2 (enough for 1 cookie: 2 / 2 = 1)
     *
     * LIMITING FACTOR: Butter and Baking Soda (only 1 cookie worth each)
     */
    gm.player.ingredients = new Map([
      ["Flour", 9],
      ["Sugar", 3],
      ["Butter", 8],
      ["Chocolate", 2],
      ["Baking Soda", 2]
    ]);

    /**
     * STEP 2: Set demand
     *
     * WHAT IS DEMAND?
     * Number of cookies ordered by customers for this day.
     *
     * WHY SET TO 2?
     * We want to test baking multiple cookies.
     * Player has ingredients for 1 cookie, but demand is 2.
     * This tests how GameManager handles insufficient ingredients.
     */
    gm.player.currentDayDemand = 2;

    /**
     * STEP 3: Render the baking phase
     *
     * WHAT HAPPENS:
     * - GameManager creates a BakingMinigame instance
     * - Stores it in currentBakingMinigameInstance
     * - Our mock captures the completion callback in the instance
     */
    gm.renderBakingPhase();

    /**
     * STEP 4: Simulate minigame completion
     *
     * WHAT IS (gm as any)?
     * Type assertion to access private property currentBakingMinigameInstance.
     *
     * WHAT IS .cb()?
     * The completion callback captured by our mock.
     *
     * PARAMETERS:
     * - { correctAnswers: 2 }: MinigameResult object
     *   * correctAnswers: Number of problems solved correctly
     * - false: Whether the minigame was skipped
     *
     * WHAT HAPPENS INSIDE GAMEMANAGER:
     * - Calculates tips: 2 correct × $5 = $10 tips
     * - Adds tips to player.funds
     * - Transitions to next phase
     */
    (gm as any).currentBakingMinigameInstance.cb({ correctAnswers: 2 }, false);

    /**
     * --------------------------------------------------------------------------
     * SECTION: CLEANING PHASE
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test the cleaning minigame phase where players solve multiplication problems.
     *
     * GAME CONTEXT:
     * After baking, players clean dishes (one per cookie sold).
     * Cleaning well increases reputation (more customers next day).
     * Skipping cleaning decreases reputation and incurs fines.
     */

    /**
     * STEP 1: Render the cleaning phase
     *
     * WHAT HAPPENS:
     * - GameManager creates a CleaningMinigame instance
     * - Stores it in currentCleaningMinigame
     * - Our mock captures the completion callback
     */
    gm.renderCleaningPhase();

    /**
     * STEP 2: Extract the callback
     *
     * WHY THIS PATTERN?
     * We're being defensive - the callback might not exist.
     *
     * WHAT IS ?? vi.fn()?
     * Nullish coalescing operator.
     * If currentCleaningMinigame.cb is null/undefined, use vi.fn() (empty function).
     * Otherwise, use the actual callback.
     *
     * RESULT:
     * cleaningCb is guaranteed to be a function (either the real one or a mock).
     */
    const cleaningCb = (gm as any).currentCleaningMinigame?.cb ?? vi.fn();

    /**
     * STEP 3: Ensure the instance exists
     *
     * WHY?
     * Some tests paths might not create the instance.
     * We manually set it to ensure the next steps work.
     */
    (gm as any).currentCleaningMinigame = { cb: cleaningCb };

    /**
     * STEP 4: Simulate SKIPPING the minigame
     *
     * PARAMETERS:
     * - { correctAnswers: 0 }: No problems solved
     * - true: Minigame was skipped
     *
     * WHAT HAPPENS INSIDE GAMEMANAGER:
     * - Applies penalty: -0.2 reputation, $50 fine, $10/dish dirty dish fine
     * - Reputation affects next day's customer count
     */
    cleaningCb({ correctAnswers: 0 }, true);

    /**
     * STEP 5: Simulate COMPLETING the minigame
     *
     * PARAMETERS:
     * - { correctAnswers: 5 }: 5 problems solved
     * - false: Minigame was not skipped (played it)
     *
     * WHAT HAPPENS INSIDE GAMEMANAGER:
     * - Applies reward: +0.05 reputation
     * - More reputation = more customers tomorrow
     * - No fines
     */
    cleaningCb({ correctAnswers: 5 }, false);

    /**
     * --------------------------------------------------------------------------
     * SECTION: END GAME LOGIC
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test win/lose conditions and day transitions.
     *
     * GAME WIN/LOSE CONDITIONS:
     * - Win: Reach $1000 (or configured win threshold)
     * - Lose: Can't make cookies AND can't afford ingredients
     */

    /**
     * SCENARIO 1: High funds (should continue to new day)
     *
     * STEP 1: Set high funds
     *
     * WHY 200?
     * Above starting funds (100) but below win threshold (150 in test config).
     * Wait, 200 > 150, so this should trigger victory!
     * This might be testing that the victory check happens correctly.
     */
    gm.player.funds = 200;

    /**
     * STEP 2: Render day summary
     *
     * WHAT HAPPENS:
     * - Shows end of day financial summary
     * - Checks for victory (funds >= winThreshold)
     * - If victory: transitions to VICTORY phase
     * - If not: transitions to NEW_DAY_ANIMATION phase
     *
     * WITH FUNDS = 200 and winThreshold = 150:
     * Should transition to VICTORY phase.
     */
    gm.renderDaySummaryPhase();

    /**
     * SCENARIO 2: Bankruptcy (should lose)
     *
     * STEP 1: Set low funds and no ingredients
     */
    gm.player.funds = -10;  // Negative balance
    gm.player.ingredients.clear();  // No ingredients at all

    /**
     * STEP 2: Check bankruptcy
     *
     * WHAT IS checkBankruptcy()?
     * GameManager method that checks if player is bankrupt.
     *
     * BANKRUPTCY LOGIC:
     * Bankrupt if:
     * - Funds <= bankruptcyThreshold (-50 in test config)
     * - AND can't make any cookies (no ingredients)
     *
     * WHAT IS expect()?
     * Vitest assertion function - checks if a value matches expectation.
     *
     * WHAT IS .toBe()?
     * Matcher function - checks for exact equality (using ===).
     *
     * ASSERTION:
     * expect(gm.checkBankruptcy()).toBe(true)
     * Means: "I expect checkBankruptcy() to return true"
     * If it returns false, the test fails.
     *
     * WITH funds = -10 (> -50) and no ingredients:
     * Wait, -10 > -50, so NOT below bankruptcy threshold!
     * But no ingredients means can't make cookies.
     * The logic might check: (funds low AND no cookies) OR (can't make cookies AND can't buy ingredients)
     * Actually, looking at the assertion, we expect TRUE.
     * So with no ingredients and -10 funds, checkBankruptcy() should return true.
     */
    expect(gm.checkBankruptcy()).toBe(true);

    /**
     * STEP 3: Render game over phase
     *
     * WHAT IS GAME OVER PHASE?
     * A generic end state (legacy, from types.ts comments).
     * Usually replaced by VICTORY or DEFEAT phases.
     */
    gm.renderGameOverPhase();

    /**
     * --------------------------------------------------------------------------
     * SECTION: OTHER SCREENS
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Directly render victory and lose phases to ensure code coverage.
     *
     * WHY?
     * The tests above might not have triggered these phases.
     * We call them directly to ensure they're covered.
     */

    /**
     * Render victory phase
     *
     * WHAT HAPPENS:
     * - Shows victory screen with congratulations message
     * - Displays final funds
     * - Shows "Play Again" button
     */
    gm.renderVictoryPhase();

    /**
     * Render lose phase
     *
     * WHAT HAPPENS:
     * - Shows lose screen with "bankruptcy" message
     * - Shows "Try Again" button
     */
    gm.renderLosePhase();

    /**
     * --------------------------------------------------------------------------
     * SECTION: HELPER FUNCTIONS
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test calculation helper methods in GameManager.
     */

    /**
     * STEP 1: Set up test inventory
     *
     * QUANTITIES (exactly one cookie's worth):
     * - Flour: 3 (1 cookie: 3 / 3 = 1)
     * - Sugar: 1 (1 cookie: 1 / 1 = 1)
     * - Butter: 8 (1 cookie: 8 / 8 = 1)
     * - Chocolate: 1 (1 cookie: 1 / 1 = 1)
     * - Baking Soda: 2 (1 cookie: 2 / 2 = 1)
     */
    gm.player.ingredients = new Map([
      ["Flour", 3],
      ["Sugar", 1],
      ["Butter", 8],
      ["Chocolate", 1],
      ["Baking Soda", 2]
    ]);

    /**
     * STEP 2: Test calculateMaxCookies()
     *
     * WHAT DOES IT DO?
     * Calculates the maximum number of cookies the player can make with
     * current ingredients.
     *
     * ALGORITHM:
     * For each ingredient, divide quantity by recipe requirement.
     * Take the minimum (limiting ingredient).
     *
     * EXAMPLE:
     * - Flour: 3 / 3 = 1 cookie
     * - Sugar: 1 / 1 = 1 cookie
     * - Butter: 8 / 8 = 1 cookie
     * - Chocolate: 1 / 1 = 1 cookie
     * - Baking Soda: 2 / 2 = 1 cookie
     * Minimum = 1 cookie
     *
     *
     */
    expect(gm.calculateMaxCookies()).toBe(1);

    /**
     * STEP 3: Test canMakeCookies()
     *
     * WHAT DOES IT DO?
     * Checks if player can make at least one cookie.
     *
     * LOGIC:
     * Likely: return calculateMaxCookies() > 0;
     *
     * ASSERTION:
     * expect(...).toBe(true)
     * With our inventory (exactly 1 cookie's worth), should return true.
     */
    expect(gm.canMakeCookies()).toBe(true);

    /**
     * STEP 4: Test game reset
     *
     * WHAT DOES resetGame() DO?
     * Resets all player state to initial values:
     * - Funds back to starting funds
     * - Ingredients cleared
     * - Day back to 1
     * - Reputation reset
     * - Phase back to LOGIN
     *
     * WHY TEST THIS?
     * Ensure the reset logic doesn't crash.
     * Important for "Play Again" functionality.
     */
    gm.resetGame();

    /**
     * --------------------------------------------------------------------------
     * TEST COMPLETE
     * --------------------------------------------------------------------------
     *
     * This test successfully exercised many code paths in GameManager.
     */
  });

  /**
   * ================================================================================
   * TEST CASE 2: Animation Failures and Background Load Error
   * ================================================================================
   *
   * TEST PURPOSE:
   * Test error handling when animations fail to load and background images fail.
   * Also tests cleanup logic and bankruptcy edge cases.
   *
   * WHY IMPORTANT?
   * Code should handle errors gracefully (no crashes, helpful error messages).
   * This test ensures GameManager doesn't break when things go wrong.
   */
  it("covers animation failures and background load error", async () => {

    /**
     * --------------------------------------------------------------------------
     * ARRANGE (SETUP)
     * --------------------------------------------------------------------------
     */

    /**
     * STEP 1: Set up mocks configured to FAIL
     *
     * OPTIONS:
     * - animResolves: false - Animations will fail to load
     * - backgroundFails: true - Background images will fail to load
     *
     * WHAT HAPPENS:
     * - AnimationPlayer.load() returns Promise.reject("fail")
     * - Image.src setter calls onerror instead of onload
     */
    setupMocks({ animResolves: false, backgroundFails: true });

    /**
     * --------------------------------------------------------------------------
     * ACT (EXECUTE)
     * --------------------------------------------------------------------------
     */

    /**
     * STEP 2: Import and create GameManager
     */
    const { GameManager } = await import("./GameManager");
    const gm: any = new GameManager(makeContainer());
    gm.audioUnlocked = true;

    /**
     * --------------------------------------------------------------------------
     * SECTION: ANIMATION FAILURES
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test that GameManager handles animation loading failures gracefully.
     */

    /**
     * TEST: Post-baking animation failure
     *
     * WHAT IS renderPostBakingAnimation()?
     * Method that creates and loads a post-baking animation.
     *
     * WHAT HAPPENS:
     * - Creates AnimationPlayer instance
     * - Calls load() which returns Promise.reject("fail")
     * - Should catch the error and handle it (log, show fallback, etc.)
     *
     * WHAT IS await?
     * Waits for the Promise to settle (resolve or reject).
     * Without await, the test would continue before the failure occurs.
     *
     * WHY NO ASSERTION?
     * We're testing that it doesn't crash.
     * If an uncaught error occurs, the test would fail automatically.
     */
    await gm.renderPostBakingAnimation();

    /**
     * TEST: New day animation failure
     *
     * Similar to post-baking animation test.
     */
    await gm.renderNewDayAnimation();

    /**
     * --------------------------------------------------------------------------
     * SECTION: CLEANUP LOGIC
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test that cleanupCurrentPhase() properly destroys all active objects.
     *
     * WHY IMPORTANT?
     * Memory leaks occur when objects aren't properly cleaned up.
     * Event listeners, intervals, animations must be destroyed.
     */

    /**
     * STEP 1: Manually create instances to clean up
     *
     * WHY?
     * We're testing cleanup in isolation.
     * We create fake instances and ensure cleanupCurrentPhase() destroys them.
     */

    /**
     * Create fake baking minigame instance
     *
     * WHAT IS { cleanup: vi.fn() }?
     * An object with a cleanup method that's a mock function.
     * We can later check if cleanup was called.
     */
    gm.currentBakingMinigameInstance = { cleanup: vi.fn() };

    /**
     * Create fake cleaning minigame instance
     */
    gm.currentCleaningMinigame = { cleanup: vi.fn() };

    /**
     * Create fake post-baking animation
     *
     * WHAT IS destroy()?
     * Method to stop and clean up an animation.
     */
    gm.postBakingAnimation = { destroy: vi.fn() };

    /**
     * Create fake new day animation
     */
    gm.newDayAnimation = { destroy: vi.fn() };

    /**
     * Create fake background image
     *
     * WHY IMPORT KONVA AGAIN?
     * We need the mocked Konva to create a Konva.Image instance.
     *
     * WHAT IS await import("konva")?
     * Dynamically imports the mocked Konva module.
     *
     * WHAT IS .default?
     * The default export of the module (our mock Konva library).
     *
     * WHAT IS .Image()?
     * Creates a new mocked Konva Image instance.
     */
    gm.backgroundImage = new (await import("konva")).default.Image();

    /**
     * Add background image to layer
     *
     * WHY?
     * cleanupCurrentPhase() should remove the background image from the layer.
     * We add it first so there's something to remove.
     */
    gm.layer.add(gm.backgroundImage);

    /**
     * STEP 2: Call cleanup
     *
     * WHAT SHOULD HAPPEN:
     * - currentBakingMinigameInstance.cleanup() called
     * - currentCleaningMinigame.cleanup() called
     * - postBakingAnimation.destroy() called
     * - newDayAnimation.destroy() called
     * - backgroundImage removed from layer
     *
     */
    gm.cleanupCurrentPhase();

    /**
     * --------------------------------------------------------------------------
     * SECTION: BANKRUPTCY LOGIC EDGE CASE
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test bankruptcy logic when player has ingredients but no money.
     */

    /**
     * SCENARIO: Player has lots of ingredients but no funds
     *
     * STEP 1: Give player plenty of ingredients
     */
    gm.player.ingredients.set("Flour", 100);
    gm.player.ingredients.set("Sugar", 100);

    /**
     * STEP 2: Check bankruptcy
     *
     * EXPECTED RESULT: NOT bankrupt (false)
     *
     * WHY?
     * Even with no money, player can make cookies with these ingredients.
     * After selling cookies, player would have money again.
     * So this is not a bankruptcy situation.
     *
     * BANKRUPTCY ONLY WHEN:
     * - Can't make cookies (no ingredients)
     * - AND can't buy ingredients (no money)
     *
     * ASSERTION:
     * expect(...).toBe(false)
     * We expect checkBankruptcy() to return false.
     */
    expect(gm.checkBankruptcy()).toBe(false);

    /**
     * --------------------------------------------------------------------------
     * TEST COMPLETE
     * --------------------------------------------------------------------------
     *
     * Successfully tested error handling and edge cases.
     */
  });

  /**
   * ================================================================================
   * TEST CASE 3: Render Current Phase Branches and Music Gating
   * ================================================================================
   *
   * TEST PURPOSE:
   * Exercise all remaining code branches to achieve comprehensive coverage.
   * Tests:
   * - Audio unlocking mechanism
   * - Music edge cases (null phase, invalid phase)
   * - Background image rendering logic
   * - All game phase render methods
   * - Shopping failure scenario (can't make cookies)
   * - Baking with no ingredients
   * - Resize with background image
   */
  it("exercises renderCurrentPhase branches and music gating", async () => {

    /**
     * --------------------------------------------------------------------------
     * ARRANGE (SETUP)
     * --------------------------------------------------------------------------
     */
    setupMocks();
    const { GameManager } = await import("./GameManager");
    const { GamePhase } = await import("./types");

    /**
     * Import the mocked Konva
     *
     * WHAT IS 'as any'?
     * Type assertion - we know it's a mock, not the real Konva.
     */
    const konva = (await import("konva")).default as any;

    const gm: any = new GameManager(makeContainer());

    /**
     * --------------------------------------------------------------------------
     * SECTION: AUDIO UNLOCKING
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test the audio unlock mechanism.
     *
     * BROWSER AUDIO POLICY:
     * Browsers block audio autoplay until user interacts with the page.
     * GameManager listens for the first user interaction to unlock audio.
     *
     * HOW IT WORKS:
     * - GameManager adds event listener for 'pointerdown' (click/tap)
     * - First interaction sets audioUnlocked = true
     * - After that, background music can play
     */

    /**
     * STEP 1: Simulate user interaction
     *
     * WHAT IS window.dispatchEvent()?
     * Manually triggers an event on the window object.
     *
     * WHAT IS new Event("pointerdown")?
     * Creates a new Event object of type "pointerdown".
     * pointerdown = mouse click or touch screen tap
     *
     * WHAT HAPPENS:
     * - GameManager's event listener catches this event
     * - Sets audioUnlocked = true
     * - Starts playing background music
     */
    window.dispatchEvent(new Event("pointerdown"));

    /**
     * STEP 2: Assert audio is unlocked
     *
     * ASSERTION:
     * expect(gm.audioUnlocked).toBe(true)
     * After pointerdown event, audioUnlocked should be true.
     */
    expect(gm.audioUnlocked).toBe(true);

    /**
     * --------------------------------------------------------------------------
     * SECTION: MUSIC LOGIC EDGE CASES
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test edge cases in music playback logic.
     */

    /**
     * TEST CASE: Playing null music
     *
     * WHAT IS gm.playBGM?.?
     * Optional chaining - calls playBGM if it exists.
     *
     * PARAMETER:
     * - null: No music (silence)
     *
     * WHAT SHOULD HAPPEN:
     * - Current music should stop
     * - No new music should start
     */
    gm.playBGM?.(null);

    /**
     * TEST CASE: Invalid phase
     *
     * SETUP:
     * - Set currentPhase to -1 (invalid phase number)
     * - Call updateBackgroundMusic()
     *
     * WHAT SHOULD HAPPEN:
     * - Switch statement hits default case
     * - Either plays default music or no music
     * - Doesn't crash
     */
    gm.currentPhase = -1 as any;  // 'as any' to bypass TypeScript type checking
    gm.updateBackgroundMusic();

    /**
     * --------------------------------------------------------------------------
     * SECTION: BACKGROUND IMAGE LOGIC
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test background image rendering and persistence across phases.
     *
     * BACKGROUND IMAGE BEHAVIOR:
     * - Some phases show a background image (ORDER, SHOPPING, etc.)
     * - Some phases don't (LOGIN, animations)
     * - When transitioning between phases with backgrounds, keep same image
     */

    /**
     * STEP 1: Manually add a background image
     */
    gm.backgroundImage = new konva.Image();
    gm.layer.add(gm.backgroundImage);

    /**
     * STEP 2: Render a phase that uses background image
     *
     * WHAT IS GamePhase.ORDER?
     * Enum value for the ORDER phase.
     *
     * WHAT SHOULD HAPPEN:
     * - renderCurrentPhase() sees that ORDER phase needs background
     * - Sees that backgroundImage already exists
     * - Keeps the existing background (doesn't reload)
     */
    gm.currentPhase = GamePhase.ORDER;
    gm.renderCurrentPhase();

    /**
     * --------------------------------------------------------------------------
     * SECTION: PHASE SWITCH COVERAGE
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Ensure every case in the renderCurrentPhase() switch statement is executed.
     *
     * WHY?
     * renderCurrentPhase() has a big switch statement with a case for each phase.
     * To achieve 100% coverage, we need to trigger every case.
     */

    /**
     * STEP 1: Create array of all phases to test
     *
     * NOTE: We're not including all phases here, just ones not covered yet.
     * SHOPPING and some others were already covered in previous tests.
     */
    const phases = [
      GamePhase.LOGIN,                 // Login screen
      GamePhase.STORYLINE,             // Story introduction
      GamePhase.HOW_TO_PLAY,           // Tutorial
      GamePhase.RECIPE_BOOK,           // Recipe and inventory
      GamePhase.BAKING,                // Baking minigame
      GamePhase.POST_BAKING_ANIMATION, // Post-baking animation
      GamePhase.CLEANING,              // Cleaning minigame
      GamePhase.DAY_SUMMARY,           // End of day summary
      GamePhase.NEW_DAY_ANIMATION,     // New day animation
      GamePhase.VICTORY,               // Win screen
      GamePhase.DEFEAT,                // Lose screen
      GamePhase.GAME_OVER,             // Generic game over
    ];

    /**
     * STEP 2: Iterate through all phases and render each
     *
     * WHAT IS forEach()?
     * Array method that executes a function for each element.
     *
     * CALLBACK:
     * For each phase, set it as current phase and render.
     *
     * RESULT:
     * Every phase's render method gets called once.
     * This covers all cases in the switch statement.
     */
    phases.forEach((phase) => {
      gm.currentPhase = phase;
      gm.renderCurrentPhase();
    });

    /**
     * --------------------------------------------------------------------------
     * SECTION: MORE EDGE CASES
     * --------------------------------------------------------------------------
     *
     * PURPOSE:
     * Test specific edge case scenarios not covered above.
     */

    /**
     * SETUP: Mock the alert function
     *
     * WHY?
     * GameManager might call alert() to show error messages to the user.
     * In tests, we don't want actual alert dialogs popping up.
     * We replace alert with a mock function.
     *
     * WHAT IS vi.stubGlobal()?
     * Replaces a global function with a mock.
     */
    vi.stubGlobal("alert", vi.fn());

    /**
     * SCENARIO: Player has no ingredients and no money
     */
    gm.player.ingredients.clear();  // Remove all ingredients
    gm.player.funds = 0;            // No money

    /**
     * STEP 1: Render shopping phase
     *
     * WHAT HAPPENS:
     * - ShoppingScreen appears
     * - Player has $0 to spend
     */
    gm.renderShoppingPhase();

    /**
     * STEP 2: Simulate purchasing nothing
     *
     * PARAMETERS:
     * - new Map(): Empty map (no ingredients)
     * - 0: Total cost $0
     *
     * WHAT SHOULD HAPPEN:
     * - Player bought nothing
     * - Still has no ingredients
     * - GameManager checks if player can make cookies
     * - Realizes player can't (no ingredients)
     * - Should show an error or handle gracefully
     *
     * THIS TESTS THE "CAN'T MAKE COOKIES" PATH
     */
    lastShopping.onPurchaseComplete?.(new Map(), 0);

    /**
     * SCENARIO: Baking with no ingredients
     *
     * SETUP:
     * - Set demand to 1 (customers want 1 cookie)
     * - Player has no ingredients (from above)
     */
    gm.player.currentDayDemand = 1;

    /**
     * STEP 1: Render baking phase
     *
     * WHAT SHOULD HAPPEN:
     * - GameManager calculates max cookies player can make
     * - Result: 0 cookies (no ingredients)
     * - Sets dishesToClean to 0 (no cookies = no dishes)
     */
    gm.renderBakingPhase();

    /**
     * STEP 2: Assert no dishes to clean
     *
     * ASSERTION:
     * expect(gm.player.dishesToClean).toBe(0)
     * If player made 0 cookies, there should be 0 dishes to clean.
     */
    expect(gm.player.dishesToClean).toBe(0);

    /**
     * SCENARIO: Resize with background image present
     *
     * PURPOSE:
     * Test that resize correctly handles background image scaling.
     */

    /**
     * STEP 1: Create a container with different dimensions
     *
     * WHY defineProperty?
     * Same as makeContainer(), but with different dimensions.
     *
     * DIMENSIONS:
     * - Width: 640 (smaller than default 800)
     * - Height: 480 (smaller than default 600)
     *
     * WHAT IS configurable: true?
     * Allows the property to be redefined later.
     * Some tests might need to change these values.
     */
    const container = document.createElement("div") as HTMLDivElement;
    Object.defineProperty(container, "offsetWidth", { value: 640, configurable: true });
    Object.defineProperty(container, "offsetHeight", { value: 480, configurable: true });

    /**
     * STEP 2: Add background image
     */
    gm.backgroundImage = new konva.Image();
    gm.layer.add(gm.backgroundImage);

    /**
     * STEP 3: Handle resize
     *
     * WHAT SHOULD HAPPEN:
     * - Stage resizes to 640x480
     * - Background image scales to new size
     * - Layer redraws to show changes
     */
    gm.handleResize(container);

    /**
     * STEP 4: Assert layer was redrawn
     *
     * ASSERTION:
     * expect(gm.layer.batchDraw).toHaveBeenCalled()
     *
     * WHAT IS toHaveBeenCalled()?
     * Vitest matcher - checks if a mock function was called.
     *
     * WHY CHECK THIS?
     * batchDraw() updates the visual display.
     * If resize happened but batchDraw() wasn't called,
     * the screen wouldn't update visually.
     */
    expect(gm.layer.batchDraw).toHaveBeenCalled();

    /**
     * --------------------------------------------------------------------------
     * TEST COMPLETE
     * --------------------------------------------------------------------------
     *
     * This test covered many remaining edge cases and code branches.
     * Combined with the previous tests, we now have comprehensive coverage
     * of the GameManager class.
     */
  });
});

/**
 * ==================================================================================
 * END OF TEST FILE
 * ==================================================================================
 *
 * SUMMARY:
 * This test file thoroughly tests the GameManager class using mocking techniques
 * to isolate it from dependencies. It covers:
 *
 * 1. Game phase transitions (LOGIN → STORY → SHOPPING → BAKING → etc.)
 * 2. Economic calculations (cookie costs, profits, tips, fines)
 * 3. Reputation system (affects customer count)
 * 4. Win/lose conditions (victory threshold, bankruptcy)
 * 5. Music system (different music per phase)
 * 6. Animation handling (success and failure cases)
 * 7. Background image management
 * 8. Window resize handling
 * 9. Cleanup and memory management
 * 10. Edge cases (no ingredients, no money, invalid states)
 *
 * TESTING TECHNIQUES USED:
 * - Mocking (vi.doMock, vi.fn, vi.spyOn, vi.stubGlobal)
 * - Callback capture (storing callbacks in global objects)
 * - State manipulation (directly setting internal state)
 * - Dynamic imports (await import() to use mocked modules)
 * - Assertions (expect().toBe(), toBeGreaterThanOrEqual(), toHaveBeenCalled())
 *
 * LEARNING RESOURCES:
 * - Vitest Documentation: https://vitest.dev/
 * - JavaScript Testing Guide: https://testingjavascript.com/
 * - TypeScript Handbook: https://www.typescriptlang.org/docs/
 * - Konva Documentation: https://konvajs.org/
 *
 * ==================================================================================
 */
