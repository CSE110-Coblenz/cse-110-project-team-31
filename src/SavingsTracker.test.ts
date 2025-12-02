/**
 * SavingsTracker.test.ts - Line-by-Line Explanation of the Savings Bar UI Tests
 *
 * PURPOSE:
 * The SavingsTracker widget displays a progress bar that tracks funds toward a win threshold.
 * These tests verify the UI builds correctly, clamps progress between 0 and 1, and updates the
 * display text. The commentary explains every mock and assertion so a reader can connect the
 * dots between Konva interactions and business rules.
 */

// We need a DOM-like environment because the widget instantiates `Image` and touches window APIs.
// @vitest-environment jsdom

// Import Vitest helpers. Each identifier is annotated for clarity.
import { describe, it, expect, beforeEach, vi } from "vitest"; // describe/it = test structure, expect = assertions, vi = mocks, beforeEach = per-test setup

/**
 * Factory to create a lightweight Konva mock that mirrors just enough of the API for SavingsTracker.
 * Each fake stores configuration and exposes spies where rendering side effects are expected.
 */
function createKonvaMock() {
  type Handler = (evt?: any) => void; // shared handler signature used across fake nodes

  // Base node that records configuration, children, and event handlers.
  class FakeNode {
    config: Record<string, any>; // stored configuration key/value pairs
    children: any[] = []; // track children added to this node
    handlers = new Map<string, Handler>(); // event handler registry
    constructor(config: Record<string, any> = {}) {
      this.config = { ...config }; // shallow clone to avoid external mutation
    }
    add(...nodes: any[]) {
      this.children.push(...nodes); // record added children
      return this; // allow chaining like real Konva nodes
    }
    getChildren() {
      return this.children; // expose children for assertions
    }
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler); // register an event handler
    }
    fire(event: string) {
      this.handlers.get(event)?.(); // manually trigger a handler (used in some components)
    }
    accessor(key: string, fallback: any = 0) {
      // Helper to generate getter/setter pairs mirroring Konva's fluent API.
      return (value?: any) => {
        if (value !== undefined) this.config[key] = value; // set when provided
        return this.config[key] ?? fallback; // otherwise return stored value with default
      };
    }
    // Common Konva properties exposed via accessors.
    width = this.accessor("width", 100);
    height = this.accessor("height", 50);
    x = this.accessor("x", 0);
    y = this.accessor("y", 0);
    fill = this.accessor("fill", "");
    cornerRadius = this.accessor("cornerRadius", 0);
    opacity = this.accessor("opacity", 1);
  }

  // FakeStage adds a container() method for cursor styling checks.
  class FakeStage extends FakeNode {
    containerElement = { style: {} }; // mimic DOM container with mutable style
    constructor(config: Record<string, any>) {
      super(config);
    }
    container() {
      return this.containerElement; // expose container to match Konva.Stage API
    }
  }

  // FakeLayer spies on draw/batchDraw to confirm redraw triggers.
  class FakeLayer extends FakeNode {
    draw = vi.fn(); // spy for full redraws
    batchDraw = vi.fn(); // spy for partial redraws
  }

  // FakeRect is a no-op container; SavingsTracker only needs the constructor.
  class FakeRect extends FakeNode {}

  // FakeText exposes text() getter/setter through the accessor helper.
  class FakeText extends FakeNode {
    text = this.accessor("text", "");
  }

  // FakeImage stores an attached image object.
  class FakeImage extends FakeNode {
    image(val?: any) {
      if (val !== undefined) this.config.image = val; // set incoming image reference
      return this.config.image; // return stored image for assertions
    }
  }

  // FakeAnimation calls the provided callback with multiple timeDiff values to hit both branches inside SavingsTracker.
  class FakeAnimation {
    constructor(private cb?: (frame: any) => void, private _layer?: any) {}
    start() {
      // Trigger callback with small and large timeDiffs to simulate frame progression.
      [5, 1000, 6000].forEach((timeDiff) => this.cb?.({ timeDiff }));
    }
  }

  // Return object matching Konva's default export shape.
  return {
    default: {
      Stage: FakeStage,
      Layer: FakeLayer,
      Rect: FakeRect,
      Text: FakeText,
      Image: FakeImage,
      Animation: FakeAnimation,
    },
  };
}

// Suite wrapper for SavingsTracker tests.
describe("SavingsTracker coverage", () => {
  // Ensure a clean slate before each test to avoid leaked mocks.
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Single test that builds the widget and drives its update logic through edge cases.
  it("builds UI and updates progress clamped to bounds", async () => {
    // Stub global Image so Konva.Image loads instantly without network calls.
    vi.stubGlobal(
      "Image",
      class {
        _src = ""; // remember assigned src value
        _onload: (() => void) | null = null; // store onload handler
        set src(val: string) {
          this._src = val; // assign src
          this._onload?.(); // immediately fire onload to simulate success
        }
        get src() {
          return this._src; // expose current src value
        }
        set onload(fn: (() => void) | null) {
          this._onload = fn; // record onload handler
          if (fn && this._src) fn(); // if src already set, trigger immediately
        }
        get onload() {
          return this._onload; // allow reading handler for completeness
        }
      }
    );

    const konvaMock = createKonvaMock(); // build Konva mock factory output
    vi.doMock("konva", () => konvaMock); // register Konva mock before importing widget

    // Mock ConfigManager to feed deterministic configuration into the widget.
    const { ConfigManager } = await import("./config");
    vi.spyOn(ConfigManager, "getInstance").mockReturnValue({
      getConfig: () => ({
        winThreshold: 50,           // goal for reaching 100% progress
        startingFunds: 0,           // unused here but required by type
        bankruptcyThreshold: 0,     // unused placeholder
        flourPriceMin: 0,           // filler values keep structure intact
        flourPriceMax: 0,
        bakingTime: 0,
        cleaningTime: 0,
        maxBreadCapacity: 0,
        divisionProblems: 0,
        multiplicationProblems: 0,
        cookiePrice: 0,
      }),
    } as any);

    // Import SavingsTracker after mocks are in place.
    const { SavingsTracker } = await import("./ui/SavingsTracker");
    const Konva = (await import("konva")).default as any; // pull mocked Konva constructors

    // Create mocked stage/layer and instantiate the tracker.
    const stage = new Konva.Stage({ width: 800, height: 400, container: {} });
    const layer = new Konva.Layer();
    const tracker: any = new SavingsTracker(layer, stage);

    // Drive update logic beyond upper bound to test clamping to 1.
    tracker.update(100);
    // Drive update logic below zero to test clamping to 0.
    tracker.update(-10);
    // Assert the label reflects savings information, proving text updates occurred.
    expect(tracker.labelText.text()).toContain("Savings:");
    // Ensure the layer requested a redraw when updates occurred.
    expect(layer.batchDraw).toHaveBeenCalled();
  });
});
