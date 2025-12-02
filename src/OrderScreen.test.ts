/**
 * OrderScreen.test.ts - Fully Annotated Flow for Customer Generation and UI Events
 *
 * PURPOSE:
 * These tests exercise the OrderScreen's core responsibilities—creating randomized customer
 * orders, presenting totals, and wiring button interactions—while documenting every step.
 * The goal is to make it obvious how the screen uses Konva primitives, how randomness is
 * controlled, and how callbacks are triggered.
 *
 * MOCK STRATEGY:
 * - Konva is replaced with lightweight fakes that record configuration and handlers.
 * - Math.random is stubbed with a queue to produce deterministic customer counts.
 * - Image and window are stubbed so asset loading and navigation remain synchronous and safe.
 * - ExitButton/InfoButton are mocked to avoid side effects while still capturing callbacks.
 */

// Vitest helpers bring in assertion (expect), test grouping (describe/it), lifecycle hooks, and mocking utilities.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import the component under test so we can instantiate it with our fakes.
import { OrderScreen } from "./OrderScreen";

/**
 * FakeStage mimics the minimal subset of Konva.Stage that OrderScreen touches:
 * width/height accessors for layout math and a container() method for cursor style updates.
 */
class FakeStage {
  private readonly widthValue: number; // store provided width for deterministic retrieval
  private readonly heightValue: number; // store provided height for deterministic retrieval
  private readonly containerElement = { style: { cursor: "default" } }; // mimic DOM container with mutable cursor

  constructor(widthValue: number, heightValue: number) {
    this.widthValue = widthValue; // capture width at construction
    this.heightValue = heightValue; // capture height at construction
  }

  width() {
    return this.widthValue; // return fixed width used in layout calculations
  }

  height() {
    return this.heightValue; // return fixed height used in layout calculations
  }

  container() {
    return this.containerElement; // expose container so tests can assert cursor changes
  }
}

/**
 * FakeLayer tracks added Konva nodes and exposes draw/batchDraw spies so we can verify
 * OrderScreen triggers re-renders at the right times.
 */
class FakeLayer {
  readonly addedNodes: unknown[] = []; // collects every node passed to add()
  readonly draw = vi.fn(); // spy for full redraws
  readonly batchDraw = vi.fn(); // spy for partial redraws

  add(node: unknown) {
    this.addedNodes.push(node); // record node for later inspection
  }
}

/**
 * konvaState is hoisted so the Konva mock (declared later) can push metadata into it
 * before the test bodies run. Each array mirrors a Konva shape category that OrderScreen creates.
 */
const konvaState = vi.hoisted(() => ({
  groups: [] as Array<{ config: Record<string, unknown>; handlers: Map<string, () => void> }>, // tracks buttons/containers
  texts: [] as Array<{ config: Record<string, unknown> }>, // captures all text labels rendered
  rects: [] as Array<{ config: Record<string, unknown>; fillHistory: string[]; handlers: Map<string, () => void> }>, // captures rectangles for hover/click checks
}));

/**
 * randomValues is a queue of deterministic numbers that Math.random will yield.
 * This ensures the customer generation logic is repeatable and easy to reason about.
 */
const randomValues = vi.hoisted(() => [] as number[]);

// Stub global Image so any Konva.Image creation immediately succeeds without hitting the network.
vi.stubGlobal(
  "Image",
  class {
    onload: (() => void) | null = null; // placeholder for load callback
    set src(_: string) {
      this.onload?.(); // invoke onload synchronously so rendering continues without delay
    }
  }
);

// Provide a minimal window stub for navigation checks; OrderScreen redirects on exit.
vi.stubGlobal("window", { location: { href: "about:blank" } });

// Mock ExitButton to immediately invoke its callback; this simulates the "Exit" press path without needing the actual UI implementation.
vi.mock("./ui/ExitButton", () => ({
  ExitButton: class {
    constructor(
      _stage: unknown,
      _layer: unknown,
      callback: () => void
    ) {
      callback(); // trigger immediately to mark the button as wired
    }
  },
}));

// Mock InfoButton as a no-op since its behavior isn't under test here.
vi.mock("./ui/InfoButton", () => ({
  InfoButton: class {},
}));

// Mock the entire Konva library with lightweight stand-ins that record configuration and handlers.
vi.mock("konva", () => {
  type Handler = () => void; // simple handler signature used for hover/click events

  // Base node class that simply stores the config object passed to the constructor.
  class FakeNode {
    config: Record<string, unknown>;
    constructor(config?: Record<string, unknown>) {
      this.config = { ...(config ?? {}) }; // shallow copy to avoid accidental mutation of the original object
    }
  }

  // FakeGroup collects children and event handlers; OrderScreen uses it for button groups.
  class FakeGroup extends FakeNode {
    readonly children: unknown[] = []; // store added children to reconstruct layout in assertions
    readonly handlers = new Map<string, Handler>(); // map of event -> handler for manual triggering
    removed = false; // flag toggled when remove() is called

    constructor(config?: Record<string, unknown>) {
      super(config);
      konvaState.groups.push({ config: this.config, handlers: this.handlers }); // expose this group to the test harness
    }

    add(...children: unknown[]) {
      this.children.push(...children); // append any number of children
      return this; // enable chaining like real Konva
    }

    on(event: string, handler: Handler) {
      this.handlers.set(event, handler); // register an event handler for later simulation
    }

    remove() {
      this.removed = true; // mark group as removed; used for cleanup assertions
    }
  }

  // FakeRect records fill changes and hover/click handlers; we inspect fillHistory to prove hover styling.
  class FakeRect extends FakeNode {
    readonly handlers = new Map<string, Handler>(); // store event handlers
    readonly fillHistory: string[] = []; // track every color applied to the rect

    constructor(config?: Record<string, unknown>) {
      super(config);
      konvaState.rects.push({ config: this.config, fillHistory: this.fillHistory, handlers: this.handlers }); // expose for assertions
    }

    fill(color: string) {
      this.fillHistory.push(color); // record color for later verification
      this.config.fill = color; // update stored config to mimic real behavior
    }

    on(event: string, handler: Handler) {
      this.handlers.set(event, handler); // register event handler
    }
  }

  // FakeImage is a stub; OrderScreen only needs constructor compatibility.
  class FakeImage extends FakeNode {}

  // FakeText captures text content so we can verify labels like "DAY 2" or totals.
  class FakeText extends FakeNode {
    constructor(config?: Record<string, unknown>) {
      super(config);
      konvaState.texts.push({ config: this.config }); // track text nodes for assertions
    }

    text(value: string) {
      this.config.text = value; // allow updates to text content
    }
  }

  // Export the mocked constructors under the same default shape Konva provides.
  return {
    default: {
      Group: FakeGroup,
      Rect: FakeRect,
      Image: FakeImage,
      Text: FakeText,
    },
  };
});

// Main test suite name matches the class under test for clarity in Vitest output.
describe("OrderScreen", () => {
  let mathRandomSpy: ReturnType<typeof vi.spyOn>; // holds the spy so we can restore it in afterEach

  // Establish deterministic randomness and reset shared state before each test.
  beforeEach(() => {
    randomValues.length = 0; // clear queued random values between tests
    mathRandomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      if (randomValues.length === 0) return 0; // default fallback if queue is empty
      return randomValues.shift()!; // pop the next queued value for predictable outputs
    });
    konvaState.groups.length = 0; // clear tracked groups
    konvaState.texts.length = 0; // clear tracked texts
    konvaState.rects.length = 0; // clear tracked rects
  });

  // Clean up spies after each test to avoid leakage.
  afterEach(() => {
    mathRandomSpy.mockRestore(); // restore Math.random to its real implementation
    vi.clearAllMocks(); // reset any spies created by vi.fn()/vi.spyOn
  });

  // Single comprehensive test that walks through customer generation, UI wiring, and hover/click behavior.
  it("creates customers and continues with total demand", () => {
    randomValues.push(0.5, 0.1, 0.2, 0.3); // preload deterministic RNG values to control customer counts
    const stage = new FakeStage(1200, 800); // use a large stage size to mimic full-screen layout
    const layer = new FakeLayer(); // capture nodes added by OrderScreen
    const onContinue = vi.fn(); // spy to ensure callback is invoked with demand and orders

    // Instantiate the screen; constructor performs rendering and sets up handlers.
    new OrderScreen(stage as never, layer as never, 2, 1.2, onContinue);

    // Extract all text values to validate that day labels and totals are present.
    const texts = konvaState.texts.map((entry) => entry.config.text);
    expect(texts).toContain("DAY 2"); // verify the day header renders correctly
    const totalLine = texts.find((text) => typeof text === "string" && text.startsWith("TOTAL:"));
    expect(totalLine).toBeDefined(); // total demand line should be present

    // Find the button group (identified by having a click handler) and trigger it to simulate proceeding.
    const buttonGroup = konvaState.groups.find((group) => group.handlers.has("click"));
    expect(buttonGroup).toBeTruthy(); // ensure the continue button exists
    buttonGroup!.handlers.get("click")!(); // simulate click/tap
    expect(onContinue).toHaveBeenCalledWith(expect.any(Number), expect.any(Array)); // callback should receive total demand and orders array

    // Grab the primary button rectangle to simulate hover styling and cursor changes.
    const hoverRect = konvaState.rects[0];
    hoverRect.handlers.get("mouseenter")?.call(null); // simulate hover-in
    expect(stage.container().style.cursor).toBe("pointer"); // cursor should change to pointer
    hoverRect.handlers.get("mouseleave")?.call(null); // simulate hover-out
    expect(stage.container().style.cursor).toBe("default"); // cursor should reset

    // Hover effects should have pushed both hover and base colors into the fill history.
    expect(hoverRect.fillHistory).toContain("#45a049"); // hover color
    expect(hoverRect.fillHistory).toContain("#4CAF50"); // base color
  });
});
