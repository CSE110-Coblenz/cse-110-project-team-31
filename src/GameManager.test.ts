/**
 * @vitest-environment jsdom
 * A jsdom environment is required because GameManager constructs a Konva.Stage with a real DOM element.
 * Without this directive, document.createElement would be undefined inside the test runner.
 */

// Import Vitest helpers (describe/it/expect) and the mocking utility (vi).
import { describe, it, expect, vi } from 'vitest';
// Import the subject under test after mocks are registered.
import { GameManager } from './GameManager';

// --- Mocks ---
// We isolate GameManager by mocking its heavy dependencies: Konva and ConfigManager.

// Mock the 'konva' library.
vi.mock('konva', () => ({
  default: {
    // Stage mock: must be a real function (not arrow) so it can be `new`-ed.
    Stage: vi.fn(function() { 
      return {
        add: vi.fn(),                 // method stubbed because GameManager adds a Layer to the stage
        width: vi.fn(() => 1920),     // return fixed width so code that reads dimensions is deterministic
        height: vi.fn(() => 1080),    // return fixed height for the same reason
      };
    }),
    // Layer mock mirrors the subset of API used in GameManager constructor/cleanup.
    Layer: vi.fn(function() { 
      return {
        add: vi.fn(),                 // allows stage.add(layer) to proceed
        destroyChildren: vi.fn(),     // used during cleanup to clear existing nodes
      };
    }),
    // Image mock exists so new Konva.Image() calls inside GameManager don't explode.
    Image: vi.fn(),
  }
}));

// Mock the './config' module to keep configuration deterministic.
vi.mock('./config', () => ({
  ConfigManager: {
    // getInstance returns an object that looks like the real ConfigManager singleton.
    getInstance: vi.fn(() => ({
      // getConfig provides hard-coded values so economic calculations are predictable.
      getConfig: vi.fn(() => ({
        startingFunds: 250,
        maxBreadCapacity: 20,
        winThreshold: 2000,
      })),
      // loadConfig resolves immediately; GameManager awaits it in the constructor in production.
      loadConfig: vi.fn(() => Promise.resolve()),
    })),
  },
}));
// --- End Mocks ---

// Group the single spec under a descriptive suite name.
describe('GameManager Test', () => {

  // Verify the private cookie cost helper remains correct (critical for bankruptcy/win logic).
  it('should correctly calculate the cost of one cookie', () => {
    // --- Arrange ---
    // Build a DOM container to satisfy Konva.Stage's requirement.
    const container = document.createElement('div');
    // Instantiate GameManager with mocked dependencies.
    const gameManager = new GameManager(container);
    
    // --- Act ---
    // Access the private helper via type cast; we intentionally pierce encapsulation to validate math constants.
    const cost = (gameManager as any).getCostOfOneCookie();

    // --- Assert ---
    // Cost should equal $8.25 based on the recipe/prices documented in GameManager.ts.
    expect(cost).toBe(8.25);
  });

});
