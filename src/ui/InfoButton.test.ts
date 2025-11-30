import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InfoButton } from "./InfoButton";

class FakeStage {
  private readonly widthValue: number;
  private readonly heightValue: number;
  private readonly containerElement = { style: { cursor: "default" } };
  private readonly children: unknown[] = [];

  constructor(widthValue: number, heightValue: number) {
    this.widthValue = widthValue;
    this.heightValue = heightValue;
  }

  width() {
    return this.widthValue;
  }

  height() {
    return this.heightValue;
  }

  container() {
    return this.containerElement;
  }

  add(node: unknown) {
    this.children.push(node);
  }
}

class FakeLayer {
  readonly addedNodes: unknown[] = [];
  readonly draw = vi.fn();

  add(node: unknown) {
    this.addedNodes.push(node);
  }
}

const konvaState = vi.hoisted(() => ({
  groups: [] as Array<{
    node: unknown;
    handlers: Map<string, () => void>;
    children: unknown[];
  }>,
  circles: [] as Array<{ fillHistory: string[] }>,
  texts: [] as Array<{ config: Record<string, unknown>; handlers: Map<string, () => void> }>,
}));

vi.mock("konva", () => {
  type Handler = () => void;

  class FakeNode {
    config: Record<string, unknown>;
    constructor(config?: Record<string, unknown>) {
      this.config = { ...(config ?? {}) };
    }
  }

  class FakeGroup extends FakeNode {
    readonly children: unknown[] = [];
    readonly handlers = new Map<string, Handler>();

    add(...children: unknown[]) {
      this.children.push(...children);
      konvaState.groups.push({ node: this, handlers: this.handlers, children: this.children });
      return this;
    }

    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    destroy() {}
  }

  class FakeLayer extends FakeNode {
    readonly children: unknown[] = [];
    readonly draw = vi.fn();

    add(...nodes: unknown[]) {
      this.children.push(...nodes);
      return this;
    }

    destroy() {}
  }

  class FakeCircle extends FakeNode {
    readonly fillHistory: string[] = [];

    fill(color: string) {
      this.fillHistory.push(color);
      this.config.fill = color;
    }
  }

  class FakeText extends FakeNode {
    readonly handlers = new Map<string, Handler>();

    constructor(config?: Record<string, unknown>) {
      super(config);
      konvaState.texts.push({ config: this.config, handlers: this.handlers });
    }

    text(value: string) {
      this.config.text = value;
    }

    fill(value: string) {
      this.config.fill = value;
    }

    width() {
      return (this.config.width as number) ?? 20;
    }

    height() {
      return (this.config.height as number) ?? 20;
    }

    offsetX(_value: number) {}

    offsetY(_value: number) {}

    x(value?: number) {
      if (typeof value === "number") this.config.x = value;
      return (this.config.x as number) ?? 0;
    }

    y(value?: number) {
      if (typeof value === "number") this.config.y = value;
      return (this.config.y as number) ?? 0;
    }

    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }

    destroy() {}
  }

  class FakeRect extends FakeNode {
    readonly handlers = new Map<string, Handler>();
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }
    trigger(event: string) {
      this.handlers.get(event)?.();
    }
  }

  class FakeLine extends FakeNode {}

  return {
    default: {
      Layer: FakeLayer,
      Group: FakeGroup,
      Circle: FakeCircle,
      Text: FakeText,
      Rect: FakeRect,
      Line: FakeLine,
    },
  };
});

describe("InfoButton", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { href: "about:blank" } });
    konvaState.groups.length = 0;
    konvaState.circles.length = 0;
    konvaState.texts.length = 0;
    (globalThis.fetch as any) = vi.fn(() =>
      Promise.resolve({ text: () => Promise.resolve("loaded text") })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    konvaState.groups.length = 0;
    konvaState.texts.length = 0;
  });

  it("opens popup with custom text and closes it", async () => {
    const stage = new FakeStage(1000, 800);
    const layer = new FakeLayer();

    new InfoButton(stage as never, layer as never, "Custom info here");
    const buttonGroup = konvaState.groups.find((entry) => entry.handlers.has("click"));
    expect(buttonGroup).toBeTruthy();
    buttonGroup.handlers.get("mouseenter")?.();
    expect(stage.container().style.cursor).toBe("pointer");
    buttonGroup.handlers.get("mouseleave")?.();
    expect(stage.container().style.cursor).toBe("default");

    buttonGroup?.handlers.get("click")?.();
    await Promise.resolve();
    await Promise.resolve();

    const texts = konvaState.texts.map((entry) => entry.config.text);
    expect(texts).toContain("Custom info here");
    const closeGroup = konvaState.groups.find((entry) =>
      entry.handlers.has("click")
    );
    expect(closeGroup).toBeTruthy();

    closeGroup?.handlers.get("mouseenter")?.();
    expect(stage.container().style.cursor).toBe("pointer");
    closeGroup?.handlers.get("mouseleave")?.();
    expect(stage.container().style.cursor).toBe("default");

    closeGroup?.handlers.get("click")?.();
    expect(stage.container().style.cursor).toBe("default");
  });

  it("falls back to fetched instructions when custom text absent", async () => {
    const stage = new FakeStage(900, 600);
    const layer = new FakeLayer();

    new InfoButton(stage as never, layer as never);
    const buttonGroup = konvaState.groups.find((entry) => entry.handlers.has("click"));
    expect(buttonGroup).toBeTruthy();

    buttonGroup?.handlers.get("click")?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(fetch).toHaveBeenCalledWith("/howtoplaypopup.txt");
    const texts = konvaState.texts.map((entry) => entry.config.text);
    expect(texts).toContain("loaded text");
  });
});

