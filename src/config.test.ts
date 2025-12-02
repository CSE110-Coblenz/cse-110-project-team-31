/**
 * This file contains unit tests for the ConfigManager class.
 * The tests verify several key aspects of the ConfigManager's functionality:
 * 1.  **Singleton Pattern**: Ensures that only one instance of the ConfigManager is ever created.
 * 2.  **Default Values**: Confirms that the manager initializes with the correct default game settings.
 * 3.  **Config Loading**: Tests the ability to load and parse a configuration file (`debug_mode.txt`).
 * 4.  **Parsing Logic**: Verifies that the parser correctly handles comments, whitespace, and various data formats.
 * 5.  **Error Handling**: Checks that the system gracefully handles failures, such as a missing config file,
 *     by falling back to default values.
 * 6.  **Immutability**: Ensures that the `getConfig` method returns a copy of the configuration, not a direct
 *     reference, to prevent unintended modifications to the central config state.
 *
 * MOCKING STRATEGY:
 * - `fetch`: The global `fetch` function is mocked using `vi.fn()` to simulate network requests for the
 *   `debug_mode.txt` file. This allows tests to provide custom file content or simulate network errors
 *   without any actual file I/O.
 * - `console.warn` and `console.log`: These are spied on to verify that the ConfigManager logs appropriate
 *   messages during loading or error states.
 * - Singleton Instance Reset: A private static property `instance` on `ConfigManager` is reset before each
 *   test. This is a common practice in testing singletons to ensure each test starts with a fresh instance,
 *   preventing state from leaking between tests.
 */


// Import testing utilities from Vitest and the class to be tested.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigManager } from './config';

// A test suite for the ConfigManager class.
describe('ConfigManager', () => {
  
  // A `beforeEach` hook that runs before every test in this suite.
  beforeEach(() => {
    // Reset the singleton instance before each test.
    // The Singleton pattern normally prevents creating more than one instance. For testing,
    // we need to ensure each test gets a fresh, clean instance.
    // This is a common "hack" in testing singletons, where we reach into the class's
    // private static properties and reset the instance to `undefined`.
    // Casting to `any` bypasses TypeScript's type-checking for private properties.
    (ConfigManager as any).instance = undefined;
    
    // Clear all mock function call histories and implementations after each test.
    // This is important to prevent a mock's behavior in one test from affecting another.
    vi.clearAllMocks();
  });

  // A nested test suite for verifying the Singleton pattern implementation.
  describe('Singleton Pattern', () => {
    // Test case to ensure only one instance is ever returned.
    it('should return the same instance on multiple calls', () => {
      // Act: Get the instance twice.
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      
      // Assert: Check that both variables point to the exact same object in memory.
      // `toBe` checks for referential identity.
      expect(instance1).toBe(instance2);
    });
  });

  // A test suite for the default configuration values.
  describe('Default Configuration', () => {
    // A simple test to check one specific default value.
    it('should have correct default startingFunds', () => {
      // Arrange: Get a fresh instance of the manager.
      const configManager = ConfigManager.getInstance();
      
      // Act: Get the configuration object.
      const config = configManager.getConfig();
      
      // Assert: Verify that startingFunds has its expected default value.
      expect(config.startingFunds).toBe(500);
    });

    // A comprehensive test to verify all default values are set correctly.
    it('should have all default values set correctly', () => {
      // Arrange
      const configManager = ConfigManager.getInstance();
      // Act
      const config = configManager.getConfig();
      
      // Assert: Check every single default value to ensure the initial state is correct.
      expect(config.startingFunds).toBe(500);
      expect(config.winThreshold).toBe(1000);
      expect(config.bankruptcyThreshold).toBe(0);
      expect(config.flourPriceMin).toBe(5);
      expect(config.flourPriceMax).toBe(15);
      expect(config.bakingTime).toBe(60);
      expect(config.cleaningTime).toBe(45);
      expect(config.maxBreadCapacity).toBe(20);
      expect(config.divisionProblems).toBe(10);
      expect(config.multiplicationProblems).toBe(8);
      expect(config.cookiePrice).toBe(15);
    });

    // An important test to ensure the configuration is immutable from the outside.
    it('should return a copy of config, not the original', () => {
      // Arrange
      const configManager = ConfigManager.getInstance();
      
      // Act: Get the config object twice.
      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();
      
      // Assert: The objects should be deeply equal in value.
      // `toEqual` performs a deep comparison of object properties.
      expect(config1).toEqual(config2);
      
      // Assert: But they should NOT be the same object instance.
      // This proves that `getConfig()` returns a copy (e.g., using the spread operator `{...}`).
      expect(config1).not.toBe(config2);
      
      // Act: Modify the copy.
      config1.startingFunds = 999;
      
      // Assert: The original configuration (retrieved again via config2) should remain unchanged.
      // This prevents different parts of the application from accidentally modifying the shared config.
      expect(config2.startingFunds).toBe(500);
    });
  });

  // A test suite for verifying the successful loading and parsing of a config file.
  describe('loadConfig - Successful Loading', () => {
    // Test case for a full, realistic configuration file.
    it('should load and parse config from file successfully', async () => {
      // Arrange: Define the mock content of the `debug_mode.txt` file.
      const mockConfigText = `
# This is a comment
STARTING_FUNDS=500
WIN_THRESHOLD=3000
BANKRUPTCY_THRESHOLD=-100
FLOUR_PRICE_MIN=8
FLOUR_PRICE_MAX=20
BAKING_TIME=90
CLEANING_TIME=60
MAX_BREAD_CAPACITY=30
DIVISION_PROBLEMS=15
MULTIPLICATION_PROBLEMS=12
COOKIE_PRICE=25
`;

      // Arrange: Mock the global `fetch` function.
      // When `fetch` is called, it should return a resolved Promise.
      // The resolved value should be an object that simulates the Response,
      // which has a `text()` method that in turn returns our mock config content.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Get the manager instance and call `loadConfig`.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig(); // `await` is necessary because `loadConfig` is async.
      
      // Act: Get the newly loaded config.
      const config = configManager.getConfig();
      
      // Assert: Check that all values were updated from the mock file content.
      expect(config.startingFunds).toBe(500);
      expect(config.winThreshold).toBe(3000);
      expect(config.bankruptcyThreshold).toBe(-100);
      expect(config.flourPriceMin).toBe(8);
      expect(config.flourPriceMax).toBe(20);
      expect(config.bakingTime).toBe(90);
      expect(config.cleaningTime).toBe(60);
      expect(config.maxBreadCapacity).toBe(30);
      expect(config.divisionProblems).toBe(15);
      expect(config.multiplicationProblems).toBe(12);
      expect(config.cookiePrice).toBe(25);
    });

    // Test case for a partially defined config file.
    it('should handle config with only some values', async () => {
      // Arrange: Create a mock config with only two values defined.
      const mockConfigText = `
STARTING_FUNDS=1000
BAKING_TIME=120
`;

      // Arrange: Mock the fetch call.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load the partial config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      
      // Act: Get the resulting config.
      const config = configManager.getConfig();
      
      // Assert: Check that the specified values were updated.
      expect(config.startingFunds).toBe(1000);
      expect(config.bakingTime).toBe(120);
      // Assert: Check that other values remain at their default settings.
      expect(config.winThreshold).toBe(1000);
      expect(config.cleaningTime).toBe(45);
    });

    // Test case to ensure the parser correctly ignores empty lines and comments.
    it('should handle empty lines and comments', async () => {
      // Arrange: Create a config file with various comments and empty lines.
      const mockConfigText = `
# Comment line
STARTING_FUNDS=300

# Another comment
   
BAKING_TIME=75
  # Indented comment
`;
      // Arrange: Mock fetch.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load the config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      
      // Act: Get the config.
      const config = configManager.getConfig();
      
      // Assert: Check that the values were parsed correctly, ignoring other lines.
      expect(config.startingFunds).toBe(300);
      expect(config.bakingTime).toBe(75);
    });

    // Test case to ensure the parser handles extra whitespace around keys and values.
    it('should handle whitespace around keys and values', async () => {
      // Arrange: Config content with inconsistent spacing.
      const mockConfigText = `
  STARTING_FUNDS  =  400  
BAKING_TIME=   80   
`;
      // Arrange: Mock fetch.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load and get the config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      const config = configManager.getConfig();
      
      // Assert: The parser should have trimmed the whitespace, resulting in correct values.
      expect(config.startingFunds).toBe(400);
      expect(config.bakingTime).toBe(80);
    });

    // Test case to ensure the parser handles floating-point numbers.
    it('should handle decimal values', async () => {
      // Arrange: Config content with decimal values.
      const mockConfigText = `
FLOUR_PRICE_MIN=7.5
FLOUR_PRICE_MAX=18.75
`;
      // Arrange: Mock fetch.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load and get the config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      const config = configManager.getConfig();
      
      // Assert: The values should be parsed as floating-point numbers.
      expect(config.flourPriceMin).toBe(7.5);
      expect(config.flourPriceMax).toBe(18.75);
    });
  });

  // A test suite for handling errors during the config loading process.
  describe('loadConfig - Error Handling', () => {
    // Test case for when the `fetch` call fails (e.g., file not found).
    it('should use default values if fetch fails', async () => {
      // Arrange: Spy on `console.warn` to check if a warning is logged.
      // We provide an empty function to suppress the actual log output in the test runner.
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Arrange: Mock `fetch` to reject the promise, simulating a network error.
      global.fetch = vi.fn().mockRejectedValue(new Error('File not found'));

      // Act: Attempt to load the config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      
      // Act: Get the config.
      const config = configManager.getConfig();
      
      // Assert: The config should still contain the default values.
      expect(config.startingFunds).toBe(500);
      expect(config.winThreshold).toBe(1000);
      
      // Assert: A warning message should have been logged to the console.
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Could not load config file, using defaults:',
        expect.any(Error) // We expect the second argument to be any Error object.
      );
      
      // Clean up the spy.
      consoleWarnSpy.mockRestore();
    });

    // Test case to ensure a success message is logged when loading works.
    it('should log config when successfully loaded', async () => {
      // Arrange: Spy on `console.log`.
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Arrange: Provide a minimal valid config.
      const mockConfigText = 'STARTING_FUNDS=500';
      
      // Arrange: Mock a successful fetch.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load the config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      
      // Assert: Check that the success message was logged with the loaded config object.
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Config loaded:',
        expect.objectContaining({ startingFunds: 500 }) // The second argument should be an object containing this key-value pair.
      );
      
      // Clean up the spy.
      consoleLogSpy.mockRestore();
    });
  });

  // A test suite for edge cases in the parsing logic.
  describe('parseConfig Edge Cases', () => {
    // Test case to ensure lines without an '=' are ignored.
    it('should ignore lines without equals sign', async () => {
      // Arrange: Config with a malformed line.
      const mockConfigText = `
STARTING_FUNDS=500
INVALID_LINE_NO_EQUALS
BAKING_TIME=90
`;
      // Arrange: Mock fetch.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load and get config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      const config = configManager.getConfig();
      
      // Assert: The valid lines should be parsed, and the invalid one should be ignored.
      expect(config.startingFunds).toBe(500);
      expect(config.bakingTime).toBe(90);
    });

    // Test case to ensure lines with an empty key or value are ignored.
    it('should ignore lines with empty key or value', async () => {
      // Arrange: Config with more malformed lines.
      const mockConfigText = `
STARTING_FUNDS=500
=300
EMPTY_VALUE=
BAKING_TIME=90
`;
      // Arrange: Mock fetch.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load and get config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      const config = configManager.getConfig();
      
      // Assert: Only valid lines should affect the config.
      expect(config.startingFunds).toBe(500);
      expect(config.bakingTime).toBe(90);
    });

    // Test case to ensure that unknown keys in the config file do not cause errors and are not added to the config object.
    it('should handle unknown config keys gracefully', async () => {
      // Arrange: Config with keys that are not part of the `GameConfig` type.
      const mockConfigText = `
STARTING_FUNDS=500
UNKNOWN_KEY=999
INVALID_CONFIG=abc
BAKING_TIME=90
`;
      // Arrange: Mock fetch.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load and get config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      const config = configManager.getConfig();
      
      // Assert: Known keys should be set correctly.
      expect(config.startingFunds).toBe(500);
      expect(config.bakingTime).toBe(90);
      
      // Assert: The unknown properties should not have been added to the config object.
      expect((config as any).UNKNOWN_KEY).toBeUndefined();
    });
  });

  // A test suite dedicated to verifying that each individual configuration key can be set correctly.
  // This is a bit repetitive but ensures that the `setConfigValue` switch statement is fully covered.
  describe('setConfigValue - All Config Keys', () => {
    // A test for each key in the GameConfig.
    it('should set STARTING_FUNDS', async () => {
      const mockConfigText = 'STARTING_FUNDS=777';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().startingFunds).toBe(777);
    });

    it('should set WIN_THRESHOLD', async () => {
      const mockConfigText = 'WIN_THRESHOLD=5000';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().winThreshold).toBe(5000);
    });

    it('should set BANKRUPTCY_THRESHOLD', async () => {
      const mockConfigText = 'BANKRUPTCY_THRESHOLD=-50';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().bankruptcyThreshold).toBe(-50);
    });

    it('should set FLOUR_PRICE_MIN', async () => {
      const mockConfigText = 'FLOUR_PRICE_MIN=10';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().flourPriceMin).toBe(10);
    });

    it('should set FLOUR_PRICE_MAX', async () => {
      const mockConfigText = 'FLOUR_PRICE_MAX=25';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().flourPriceMax).toBe(25);
    });

    it('should set BAKING_TIME', async () => {
      const mockConfigText = 'BAKING_TIME=100';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().bakingTime).toBe(100);
    });

    it('should set CLEANING_TIME', async () => {
      const mockConfigText = 'CLEANING_TIME=70';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().cleaningTime).toBe(70);
    });

    it('should set MAX_BREAD_CAPACITY', async () => {
      const mockConfigText = 'MAX_BREAD_CAPACITY=50';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().maxBreadCapacity).toBe(50);
    });

    it('should set DIVISION_PROBLEMS', async () => {
      const mockConfigText = 'DIVISION_PROBLEMS=20';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().divisionProblems).toBe(20);
    });

    it('should set MULTIPLICATION_PROBLEMS', async () => {
      const mockConfigText = 'MULTIPLICATION_PROBLEMS=15';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().multiplicationProblems).toBe(15);
    });

    it('should set COOKIE_PRICE', async () => {
      const mockConfigText = 'COOKIE_PRICE=30';
      global.fetch = vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue(mockConfigText) });
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      expect(configManager.getConfig().cookiePrice).toBe(30);
    });
  });

  // A final suite to do a brief integration-style test with a realistic file.
  describe('Integration Tests', () => {
    it('should handle a realistic config file', async () => {
      // Arrange: A realistic config file with comments and various values.
      const mockConfigText = `
# Game Configuration File
# Adjust these values to modify game behavior

# Starting conditions
STARTING_FUNDS=350
WIN_THRESHOLD=2500
BANKRUPTCY_THRESHOLD=-50

# Market prices
FLOUR_PRICE_MIN=6
FLOUR_PRICE_MAX=18

# Time settings (in seconds)
BAKING_TIME=75
CLEANING_TIME=50

# Capacity limits
MAX_BREAD_CAPACITY=25

# Minigame difficulty
DIVISION_PROBLEMS=12
MULTIPLICATION_PROBLEMS=10

# Special items
COOKIE_PRICE=22
`;
      // Arrange: Mock fetch.
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockConfigText)
      });

      // Act: Load and get config.
      const configManager = ConfigManager.getInstance();
      await configManager.loadConfig();
      const config = configManager.getConfig();
      
      // Assert: Verify all values match the file.
      expect(config.startingFunds).toBe(350);
      expect(config.winThreshold).toBe(2500);
      expect(config.bankruptcyThreshold).toBe(-50);
      expect(config.flourPriceMin).toBe(6);
      expect(config.flourPriceMax).toBe(18);
      expect(config.bakingTime).toBe(75);
      expect(config.cleaningTime).toBe(50);
      expect(config.maxBreadCapacity).toBe(25);
      expect(config.divisionProblems).toBe(12);
      expect(config.multiplicationProblems).toBe(10);
      expect(config.cookiePrice).toBe(22);
    });
  });
});
