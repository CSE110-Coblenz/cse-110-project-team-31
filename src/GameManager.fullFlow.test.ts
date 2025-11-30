// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GamePhase } from "./types";

type MaybeFn = ((...args: any[]) => void) | undefined;

const captures: Record<string, MaybeFn> & {
  shopping?: { onPurchaseComplete?: MaybeFn; onViewRecipe?: MaybeFn; saved?: Map<string, string> };
} = {};

let imageMode: "success" | "fail" = "success";
let animationReject = false;

function setupMocks() {
  // Audio stub
  class FakeAudio {
    loop = false;
    volume = 0;
    currentTime = 0;
    play = vi.fn(() => Promise.resolve());
    pause = vi.fn();
  }
  vi.stubGlobal("Audio", FakeAudio as any);

  // Image stub
  vi.stubGlobal(
    "Image",
    class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        if (imageMode === "fail") this.onerror?.();
        else this.onload?.();
      }
    }
  );

  // Konva stub
  class Base {
    config: any;
    children: any[] = [];
    parent: any = null;
    constructor(cfg: any = {}) {
      this.config = { ...cfg };
    }
    add(node: any) {
      node.parent = this;
      this.children.push(node);
      return this;
    }
    getChildren() {
      return this.children;
    }
    getParent() {
      return this.parent;
    }
    remove() {
      if (this.parent) {
        this.parent.children = this.parent.children.filter((c: any) => c !== this);
      }
    }
  }
  class Stage extends Base {
    containerEl: any;
    constructor(cfg: any) {
      super(cfg);
      this.containerEl = cfg.container || { style: { cursor: "default" } };
    }
    width(val?: number) {
      if (val !== undefined) this.config.width = val;
      return this.config.width ?? 800;
    }
    height(val?: number) {
      if (val !== undefined) this.config.height = val;
      return this.config.height ?? 600;
    }
    container() {
      return this.containerEl;
    }
  }
  class Layer extends Base {
    draw = vi.fn();
    batchDraw = vi.fn();
    destroyChildren = vi.fn(() => {
      this.children = [];
    });
  }
  class Group extends Base {}
  class Rect extends Base {
    width(val?: number) {
      if (val !== undefined) this.config.width = val;
      return this.config.width ?? 0;
    }
    height(val?: number) {
      if (val !== undefined) this.config.height = val;
      return this.config.height ?? 0;
    }
    x(val?: number) {
      if (val !== undefined) this.config.x = val;
      return this.config.x ?? 0;
    }
    y(val?: number) {
      if (val !== undefined) this.config.y = val;
      return this.config.y ?? 0;
    }
    fill(val?: string) {
      if (val !== undefined) this.config.fill = val;
      return this.config.fill ?? "";
    }
    moveToBottom() {}
  }
  class Text extends Rect {
    text(val?: string) {
      if (val !== undefined) this.config.text = val;
      return this.config.text ?? "";
    }
    fontSize(val?: number) {
      if (val !== undefined) this.config.fontSize = val;
      return this.config.fontSize ?? 0;
    }
    getTextWidth() {
      return (this.config.text?.length ?? 0) * 8;
    }
  }
  class Image extends Rect {}

  vi.doMock("konva", () => ({ default: { Stage, Layer, Group, Rect, Text, Image } }));

  vi.doMock("./config", () => ({
    ConfigManager: {
      getInstance: () => ({
        getConfig: () => ({
          startingFunds: 100,
          winThreshold: 50,
          bankruptcyThreshold: -25,
          flourPriceMin: 0,
          flourPriceMax: 0,
          bakingTime: 0,
          cleaningTime: 0,
          maxBreadCapacity: 10,
          divisionProblems: 0,
          multiplicationProblems: 0,
          cookiePrice: 10,
        }),
      }),
    },
  }));

  vi.doMock("./AnimationPlayer", () => ({
    AnimationPlayer: class {
      start = vi.fn();
      destroy = vi.fn();
      load() {
        return animationReject ? Promise.reject("anim-fail") : Promise.resolve();
      }
    },
  }));

  vi.doMock("./BakingMinigame", () => ({
    BakingMinigame: class {
      cb: MaybeFn;
      cleanup = vi.fn();
      constructor(_s: any, _l: any, _c: number, cb: MaybeFn) {
        this.cb = cb;
      }
    },
  }));

  vi.doMock("./CleaningMinigame", () => ({
    CleaningMinigame: class {
      cb: MaybeFn;
      cleanup = vi.fn();
      constructor(_s: any, _l: any, _d: number, cb: MaybeFn) {
        this.cb = cb;
      }
    },
  }));

  const simpleMock = (key: string) => {
    return class {
      constructor(...args: any[]) {
        const last = args[args.length - 1];
        if (typeof last === "function") {
          (captures as any)[key] = last;
        }
      }
    };
  };

  vi.doMock("./LoginScreen", () => ({ LoginScreen: simpleMock("loginCb") }));
  vi.doMock("./StoryScreen", () => ({ StoryScreen: simpleMock("storyCb") }));
  vi.doMock("./HowToPlayScreen", () => ({ HowToPlayScreen: simpleMock("howToCb") }));
  vi.doMock("./RecipeBookScreen", () => ({ RecipeBookScreen: simpleMock("recipeCb") }));
  vi.doMock("./DaySummaryScreen", () => ({ DaySummaryScreen: simpleMock("daySummaryCb") }));
  vi.doMock("./VictoryScreen", () => ({
    VictoryScreen: class {
      constructor(_s: any, _l: any, opts: { onReturnHome: MaybeFn }) {
        captures.victoryReturn = opts.onReturnHome;
      }
    },
  }));
  vi.doMock("./LoseScreen", () => ({
    LoseScreen: class {
      constructor(_s: any, _l: any, opts: { onReturnHome: MaybeFn }) {
        captures.loseReturn = opts.onReturnHome;
      }
    },
  }));
  vi.doMock("./OrderScreen", () => ({
    OrderScreen: class {
      constructor(_s: any, _l: any, _d: number, _r: number, cb: MaybeFn) {
        captures.orderCb = cb;
      }
    },
  }));
  vi.doMock("./ShoppingScreen", () => ({
    ShoppingScreen: class {
      constructor(_s: any, _l: any, _f: number, _day: number, _demand: number, _orders: any, onPurchaseComplete: MaybeFn, onViewRecipe: MaybeFn, saved?: Map<string, string>) {
        captures.shopping = { onPurchaseComplete, onViewRecipe, saved };
      }
      getIngredientValues() {
        return new Map([["Flour", "1"]]);
      }
    },
  }));
}

describe("GameManager full flow coverage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    Object.keys(captures).forEach((k) => delete (captures as any)[k]);
    imageMode = "success";
    animationReject = false;
    setupMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("alert", vi.fn());
  });

  const makeContainer = () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { value: 800 });
    Object.defineProperty(el, "offsetHeight", { value: 600 });
    return el as HTMLDivElement;
  };

  it("walks through all phases and branches", async () => {
    const { GameManager } = await import("./GameManager");
    const gm: any = new GameManager(makeContainer());
    gm.audioUnlocked = true;

    // Music branches
    (gm as any).playBGM?.("intro");
    gm.audioUnlocked = false;
    (gm as any).playBGM?.("main");
    gm.audioUnlocked = true;
    (gm as any).playBGM?.(null);
    gm.currentPhase = GamePhase.STORYLINE;
    (gm as any).updateBackgroundMusic();

    // Resize with background
    const KonvaMod = (await import("konva")).default;
    gm.backgroundImage = new KonvaMod.Image();
    gm.layer.add(gm.backgroundImage);
    (gm as any).handleResize(makeContainer());

    // Background load failure branch
    imageMode = "fail";
    (gm as any).loadBackground();

    // Cleanup with active objects
    gm.currentBakingMinigameInstance = { cleanup: vi.fn() };
    gm.currentCleaningMinigame = { cleanup: vi.fn() };
    gm.postBakingAnimation = { destroy: vi.fn() };
    gm.newDayAnimation = { destroy: vi.fn() };
    gm.layer.add(new KonvaMod.Rect());
    (gm as any).cleanupCurrentPhase();

    // Phase progression
    gm.currentPhase = GamePhase.LOGIN;
    (gm as any).renderCurrentPhase();
    captures.loginCb?.("Tester");
    captures.storyCb?.();
    captures.howToCb?.();
    captures.orderCb?.(2, [{ customerNum: 1, cookieCount: 2 }]);
    captures.recipeCb?.();

    // Shopping view recipe path then purchase path
    captures.shopping?.onViewRecipe?.();
    gm.currentPhase = GamePhase.SHOPPING;
    (gm as any).renderCurrentPhase();
    const purchase = new Map([
      ["Flour", 3],
      ["Sugar", 1],
      ["Butter", 8],
      ["Chocolate", 1],
      ["Baking Soda", 2],
    ]);
    captures.shopping?.onPurchaseComplete?.(purchase, 5);
    gm.currentBakingMinigameInstance?.cb?.({ correctAnswers: 1 }, false);
    gm.currentCleaningMinigame?.cb?.({ correctAnswers: 0 }, true);
    gm.currentCleaningMinigame?.cb?.({ correctAnswers: 2 }, false);

    // Day summary branches: win, new day, defeat
    gm.player.funds = 100;
    captures.daySummaryCb?.();
    gm.player.funds = 20;
    gm.currentPhase = GamePhase.DAY_SUMMARY;
    (gm as any).renderCurrentPhase();
    captures.daySummaryCb?.();
    gm.player.funds = -20;
    gm.player.ingredients.clear();
    gm.currentPhase = GamePhase.DAY_SUMMARY;
    (gm as any).renderCurrentPhase();
    captures.daySummaryCb?.();

    gm.currentPhase = GamePhase.VICTORY;
    (gm as any).renderCurrentPhase();
    captures.victoryReturn?.();
    gm.currentPhase = GamePhase.DEFEAT;
    (gm as any).renderCurrentPhase();
    captures.loseReturn?.();

    // Baking no cookies path
    gm.player.ingredients = new Map();
    gm.player.currentDayDemand = 5;
    (gm as any).renderBakingPhase();

    // Shopping path where cookies cannot be made
    gm.player.ingredients = new Map();
    gm.currentPhase = GamePhase.SHOPPING;
    (gm as any).renderShoppingPhase();
    captures.shopping?.onPurchaseComplete?.(new Map(), 0);

    // Animation rejection branches
    animationReject = true;
    await (gm as any).renderPostBakingAnimation();
    await (gm as any).renderNewDayAnimation();

    (gm as any).calculateMaxCookies();
    (gm as any).canMakeCookies();
    (gm as any).checkBankruptcy();
    (gm as any).renderGameOverPhase();

    expect(global.alert).toHaveBeenCalled();
  });
});
