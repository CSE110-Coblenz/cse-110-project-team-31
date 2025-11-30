// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

let KonvaModule: any;
let LoginScreen: any;

function createKonvaMock() {
  type Handler = (evt?: any) => void;
  class FakeNode {
    config: Record<string, any>;
    children: any[] = [];
    handlers = new Map<string, Handler>();
    constructor(config: Record<string, any> = {}) {
      this.config = { ...config };
    }
    add(...nodes: any[]) {
      this.children.push(...nodes);
      return this;
    }
    destroy() {}
    getChildren() {
      return this.children;
    }
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }
    fire(event: string, payload?: any) {
      this.handlers.get(event)?.(payload);
    }
    findOne() {
      return this.children[0] ?? new FakeNode();
    }
    find() {
      return this.children;
    }
    listening(_: boolean) {
      return _;
    }
    moveToTop() {}
    moveToBottom() {}
    moveToFront() {}
    accessor(key: string, fallback: any = 0) {
      return (value?: any) => {
        if (value !== undefined) this.config[key] = value;
        return this.config[key] ?? fallback;
      };
    }
    width = this.accessor("width", 100);
    height = this.accessor("height", 50);
    x = this.accessor("x", 0);
    y = this.accessor("y", 0);
    fill = this.accessor("fill", "");
    stroke = this.accessor("stroke", "");
    shadowBlur = this.accessor("shadowBlur", 0);
    shadowOffset = this.accessor("shadowOffset", { x: 0, y: 0 });
    opacity = this.accessor("opacity", 1);
    cornerRadius = this.accessor("cornerRadius", 0);
    shadowOpacity = this.accessor("shadowOpacity", 0);
    shadowColor = this.accessor("shadowColor", "");
    fontFamily = this.accessor("fontFamily", "");
    fontSize = this.accessor("fontSize", 16);
    fontStyle = this.accessor("fontStyle", "");
    align = this.accessor("align", "left");
    verticalAlign = this.accessor("verticalAlign", "top");
    lineHeight = this.accessor("lineHeight", 1);
    wrap = this.accessor("wrap", "word");
    offsetY = this.accessor("offsetY", 0);
    offsetX = this.accessor("offsetX", 0);
    padding = this.accessor("padding", 0);
    text = this.accessor("text", "");
    // Explicit method for frameworks that expect a function property
    visible(value?: any) {
      if (value !== undefined) this.config.visible = value;
      return this.config.visible ?? true;
    }
    getTextWidth() {
      return (this.config.text?.length ?? 0) * 10;
    }
  }

  class FakeStage extends FakeNode {
    containerElement = { style: { cursor: "default" } };
    constructor(config: { width: number; height: number }) {
      super(config);
    }
    container() {
      return this.containerElement;
    }
    add(node: any) {
      this.children.push(node);
      return this;
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

describe("LoginScreen basic flow", () => {
  let stage: FakeStage;
  let layer: FakeLayer;
  let onLogin: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const konvaMock = createKonvaMock();
    vi.doMock("konva", () => konvaMock);
    // mock image to auto-load
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        width = 200;
        height = 100;
        set src(_: string) {
          this.onload?.();
        }
      }
    );
    // fonts API
    (document as any).fonts = { load: vi.fn().mockResolvedValue([]) };
    // storage
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
    onLogin = vi.fn();
    KonvaModule = (await import("konva")).default;
    LoginScreen = (await import("./LoginScreen")).LoginScreen;
    stage = new KonvaModule.Stage({
      width: 1000,
      height: 800,
      container: { appendChild() {} },
    });
    layer = new KonvaModule.Layer({} as any);
  });

  it("creates UI, handles typing and cleanup", () => {
    const screen = new LoginScreen(stage as any, layer as any, onLogin);

    // focus input and type
    (screen as any).inputBox.fire("click");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));

    // trigger login via enter and button click
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    (screen as any).cursor?.fire?.("click");

    screen.cleanup();
    expect(layer.draw).toHaveBeenCalled();
  });

  it("blocks input when not focused and shows alert on empty enter/start", () => {
    const screen: any = new LoginScreen(stage as any, layer as any, onLogin);
    const alertSpy = vi.spyOn(global, "alert" as any).mockImplementation(() => {});

    // no focus -> handleKeyPress should bail
    screen.handleKeyPress?.({ key: "A" } as KeyboardEvent);
    expect(screen.username || "").toBe("");

    // focus then pressing enter with empty username triggers alert
    screen.focusInput();
    screen.username = "";
    screen.handleKeyPress?.({ key: "Enter" } as KeyboardEvent);
    expect(alertSpy).toHaveBeenCalled();

    // start button click with empty username also alerts
    const signGroup = layer.find()[layer.find().length - 1];
    signGroup.fire("click");
    expect(alertSpy).toHaveBeenCalledTimes(2);
  });

  it("toggles hover styles on start button and handles resize cleanup", () => {
    const screen: any = new LoginScreen(stage as any, layer as any, onLogin);
    const signGroup = layer.find()[layer.find().length - 1];
    const board = signGroup.find()[1];

    signGroup.fire("mouseenter");
    expect(stage.container().style.cursor).toBe("pointer");
    expect(board.shadowBlur()).toBe(20);

    signGroup.fire("mouseleave");
    expect(stage.container().style.cursor).toBe("default");
    expect(board.shadowBlur()).toBe(8);

    // simulate an existing animation frame and cursor interval for handleResize
    (global as any).cancelAnimationFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 101;
    });
    screen.animationFrameId = 55;
    screen.cursorInterval = 44;
    screen.handleResize();
    expect((global as any).cancelAnimationFrame).toHaveBeenCalledWith(55);
    expect(layer.destroyChildren).toHaveBeenCalled();
  });

  it("skips background draw when layer cleared before load", () => {
    // custom Image to keep instance and trigger onload manually
    const created: any[] = [];
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        width = 200;
        height = 100;
        constructor() {
          created.push(this);
        }
        set src(_: string) {
          this.onload?.();
        }
      }
    );

    const screen: any = new LoginScreen(stage as any, layer as any, onLogin);
    // first load already ran, clear children and keep loginBackground
    layer.children = [];
    const bgInstance = created[created.length - 1];
    bgInstance?.onload?.();
    expect(layer.children.length).toBe(0);
  });

  it("restores focus on resize and runs blinking interval plus successful start click", () => {
    vi.useFakeTimers();
    const screen: any = new LoginScreen(stage as any, layer as any, onLogin);

    // focus input, then trigger resize rebuild with rAF
    screen.focusInput();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 22;
    });
    screen.handleResize();
    vi.runOnlyPendingTimers(); // run blinking interval

    // start button click with username set should call onLogin
    screen.username = "Player1";
    const signGroup = layer.find()[layer.find().length - 1];
    signGroup.fire("click");
    expect(onLogin).toHaveBeenCalledWith("Player1");
    vi.useRealTimers();
  });
});
