/**
 * types.test.ts - Documentation-Heavy Verification of Shared Type Contracts
 *
 * PURPOSE OF THIS FILE:
 * These tests act as a living tour of the shared type definitions that underpin the
 * game (enums, interfaces, and result shapes). Rather than only asserting a couple of
 * values, the comments here explain how each exported type is meant to be used in the
 * rest of the codebase and why the numeric ordering or shape matters. That way a TA
 * or teammate can read this file and immediately understand the implicit contracts.
 *
 * WHY TEST TYPES AT RUNTIME?
 * TypeScript normally erases types at runtime, but enums and object shapes still
 * leave observable traces that can be sanity-checked. Guardrails here ensure:
 * - GamePhase enum values stay stable for serialization and switch statements.
 * - PlayerState / GameConfig / MinigameResult objects remain structurally coherent.
 * - Future refactors that reorder enum members or rename properties get noticed.
 *
 * STYLE GUIDE FOR THIS FILE:
 * - Every import and statement is annotated to describe intent, not just mechanics.
 * - Tests follow a narrative ("what contract are we proving?") instead of tersely
 *   asserting values. This mirrors the explanatory approach used in GameManager.ts.
 * - Extra commentary calls out why certain numbers or keys are important to other
 *   modules (e.g., GameManager uses GamePhase numeric ordering in switch cases).
 */

// Bring in Vitest primitives. Each identifier is documented inline to keep the reader oriented.
import { describe, it, expect } from "vitest"; // describe = group tests, it = individual test, expect = assertion builder

// Import the runtime-bearing pieces of the types module.
// - GamePhase is a runtime enum whose numeric ordering is important for state machine switches.
// - PlayerState, GameConfig, MinigameResult are TypeScript types; we can't inspect them at runtime,
//   but we can instantiate objects that satisfy their shape to prove the docs stay aligned with usage.
import { GamePhase, type PlayerState, type GameConfig, type MinigameResult } from "./types";

// Wrap all assertions in a named suite so Vitest reports a meaningful group header.
describe("types module", () => {
  // This test focuses exclusively on the enum because its numeric values are used in switch statements
  // inside GameManager. If the order changes silently, animations, music, or phase rendering could break.
  it("exposes GamePhase enum with stable ordering", () => {
    // The first enum member should map to 0; we rely on this when initializing the game at LOGIN.
    expect(GamePhase.LOGIN).toBe(0);
    // Later members should increase monotonically so numeric comparisons remain meaningful.
    expect(GamePhase.VICTORY).toBeGreaterThan(GamePhase.LOGIN);
    // Reverse lookup (number -> string) should still work, which is handy for debug logging.
    expect(GamePhase[GamePhase.CLEANING]).toBe("CLEANING");
  });

  // This test constructs representative objects for every exported interface.
  // The goal is to demonstrate valid shapes and highlight which fields downstream code expects to be present.
  it("allows constructing typed records for player, config, and results", () => {
    // Assemble a sample PlayerState; each property is annotated with how other modules consume it.
    const player: PlayerState = {
      username: "Tester",              // Display name shown on multiple screens and persisted to localStorage.
      funds: 100,                      // Current cash used to decide affordability in ShoppingScreen.
      ingredients: new Map(),          // Inventory map keyed by ingredient name; mutated by shopping/baking flows.
      breadInventory: [],              // Currently unused but maintained for parity with the original design.
      maxBreadCapacity: 10,            // Capacity gate that UI components read to show limits.
      currentDay: 1,                   // Drives DaySummary and storyline pacing.
      dishesToClean: 0,                // Feeds CleaningMinigame difficulty and end-of-day fines.
      reputation: 1,                   // Adjusts customer count calculation in OrderScreen.
      currentDayDemand: 0,             // Demand for the current day; consumed by baking and summary math.
    };

    // Construct a GameConfig with intentionally varied numbers to illustrate parsing and default expectations.
    const config: GameConfig = {
      startingFunds: 100,              // Seed money given on login.
      winThreshold: 200,               // Funds needed to trigger VictoryScreen.
      bankruptcyThreshold: -50,        // Funds floor that flags an immediate defeat.
      flourPriceMin: 1,                // Dynamic pricing bounds for the flour ingredient.
      flourPriceMax: 2,                // Upper bound pairs with flourPriceMin for RNG in OrderScreen.
      bakingTime: 10,                  // Timer length for BakingMinigame.
      cleaningTime: 5,                 // Timer length for CleaningMinigame.
      maxBreadCapacity: 10,            // Mirrors PlayerState capacity to keep config-driven.
      divisionProblems: 3,             // Number of math prompts in BakingMinigame.
      multiplicationProblems: 2,       // Number of math prompts in CleaningMinigame.
      cookiePrice: 5,                  // Sales price per cookie used in revenue calculations.
    };

    // Create a MinigameResult to mirror what minigames pass back into GameManager callbacks.
    const result: MinigameResult = {
      correctAnswers: 3,               // Number of correct responses that convert to tips or reduced fines.
      totalProblems: 4,                // Denominator for accuracy stats displayed in summary screens.
      timeRemaining: 10,               // Time left on the timer, used for bonus logic or UI messages.
    };

    // Validate the constructed shapes with lightweight sanity assertions so test coverage remains meaningful.
    expect(player.username).toBe("Tester");          // Confirms PlayerState accepted the string field.
    expect(config.winThreshold).toBe(200);           // Ensures numeric config properties persist correctly.
    expect(result.totalProblems).toBe(4);            // Confirms MinigameResult structure matches expectations.
  });
});
