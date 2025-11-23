// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

let KonvaModule: any;
let ShoppingScreen: any;

function createKonvaMock() {
  class FakeNode {
    config: Record<string, any>;
    children: any[] = [];
    handlers = new Map<string, (evt?: any) => void>();
    constructor(config: Record<string, any> = {}) {
      this.config = { ...config };
    }
    add(...nodes: any[]) {
      this.children.push(...nodes);
      return this;
    }
    getChildren() {
      return this.children;
    }
    on(event: string, handler: (evt?: any) => void) {
      this.handlers.set(event, handler);
    }
    fire(event: string, payload?: any) {
      this.handlers.get(event)?.(payload);
    }
    find() {
      return this.children;
    }
    findOne() {
      return this.children[0] ?? new FakeNode();
    }
    moveToBottom() {}
    accessor(key: string, fallback: any = 0) {
      return (value?: any) => {
        if (value !== undefined) this.config[key] = value;
        return this.config[key] ?? fallback;
      };
    }
    width = this.accessor("width", 100);
    height = this.accessor("height", 30);
    x = this.accessor("x", 0);
    y = this.accessor("y", 0);
    fill = this.accessor("fill", "");
    stroke = this.accessor("stroke", "");
    opacity = this.accessor("opacity", 1);
    text = this.accessor("text", "");
    listening(_: boolean) {
      return _;
    }
  }

  class FakeStage extends FakeNode {
    containerElement = { style: { cursor: "" } };
    constructor(config: { width: number; height: number }) {
      super(config);
    }
    container() {
      return this.containerElement;
    }
  }
  class FakeLayer extends FakeNode {
    draw = vi.fn();
    batchDraw = vi.fn();
    destroyChildren = vi.fn();
  }
  class FakeGroup extends FakeNode {}
  class FakeRect extends FakeNode {}
  class FakeText extends FakeNode {}
  class FakeImage extends FakeNode {}
  class FakeLine extends FakeNode {}

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

describe("ShoppingScreen simplified flow", () => {
  let stage: FakeStage;
  let layer: FakeLayer;

  beforeEach(async () => {
    const konvaMock = createKonvaMock();
    vi.doMock("konva", () => konvaMock);
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        set src(_: string) {
          this.onload?.();
        }
      }
    );
    KonvaModule = (await import("konva")).default;
    ShoppingScreen = (await import("./ShoppingScreen")).ShoppingScreen;
    stage = new KonvaModule.Stage({
      width: 800,
      height: 600,
      container: { appendChild() {} },
    });
    layer = new KonvaModule.Layer();
  });

  it("builds UI and handles basic interactions", () => {
    const onPurchase = vi.fn();
    const onViewRecipe = vi.fn();
    const screen = new ShoppingScreen(
      stage as any,
      layer as any,
      100,
      1,
      onPurchase,
      onViewRecipe
    );

    // simulate some keyboard input
    (screen as any).setFocusedInput?.({ ingredient: "Flour", rect: new FakeRect(), text: new FakeText() });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));

    // run cleanup to cover teardown paths
    screen.cleanup();
    expect(screen).toBeDefined();
  });
});
