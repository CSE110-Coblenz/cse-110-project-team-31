/**
 * @vitest-environment jsdom
 * This comment configures Vitest to use the jsdom environment.
 * JSDOM is a web browser simulation that allows us to test code that relies on a browser-like environment,
 * such as creating and manipulating DOM elements, without needing an actual browser.
 * This is crucial for testing UI components and libraries like Konva.js, which interact with the DOM.
 */

// Import necessary testing utilities from 'vitest'.
// describe: a function to group related tests into a "suite".
// it: a function to define an individual test case.
// expect: a function to create an "assertion", which checks if a value meets certain conditions.
// beforeEach: a hook that runs before each test in a describe block.
// afterEach: a hook that runs after each test in a describe block.
// vi: Vitest's utility object for mocking, spying, and other test-related operations.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import the Konva library. Konva is a 2D HTML5 Canvas library for desktop and mobile applications.
import Konva from 'konva';

// Import the class we want to test.
import { AnimationPlayer } from './AnimationPlayer';

// Mock the Konva library.
// vi.mock('konva') replaces the actual Konva library with a mock version.
// This is essential for unit testing because it isolates our component from its dependencies.
// We can control the behavior of Konva objects and methods, making our tests predictable and focused on our code's logic.
vi.mock('konva');

// 'describe' creates a test suite for the AnimationPlayer class.
// All tests related to the AnimationPlayer will be grouped under this block.
describe('AnimationPlayer', () => {
    // Declare variables that will hold our mock objects.
    // These are declared here so they are accessible in all tests within this suite.
    let layer: Konva.Layer; // This will hold a mock Konva.Layer.
    let mockImage: any; // This will hold a mock Konva.Image.
    
    // 'beforeEach' is a setup hook that runs before every single test ('it' block) in this suite.
    // This is useful for creating a clean state for each test, ensuring that tests don't interfere with each other.
    beforeEach(() => {
        // Create a mock object for a Konva Image.
        // We use vi.fn() to create mock functions for its methods.
        // This allows us to track if these methods are called, what they are called with, etc.
        mockImage = {
            image: vi.fn(), // Mocks the 'image' method of a Konva.Image.
            visible: vi.fn(), // Mocks the 'visible' method.
            destroy: vi.fn(), // Mocks the 'destroy' method.
        };
        
        // Create a mock object for a Konva Layer.
        // We only need to mock the methods our AnimationPlayer class uses.
        // The 'as any' cast is used here to tell TypeScript to ignore type mismatches,
        // as our mock object doesn't fully implement the Konva.Layer interface.
        layer = {
            add: vi.fn(), // Mocks the 'add' method.
            batchDraw: vi.fn(), // Mocks the 'batchDraw' method.
        } as any;

        // Mock the Konva.Image constructor.
        // When our code tries to create a `new Konva.Image()`, this mock will be called instead.
        // The mock implementation returns our pre-defined 'mockImage' object.
        // This gives us full control over the Konva.Image instance created by our code.
        Konva.Image = vi.fn().mockImplementation(function(this: any) {
            // 'this' would be the new object being constructed.
            // We simply return our mockImage object instead of a real Konva.Image.
            return mockImage;
        }) as any;

        // Use fake timers.
        // This command tells Vitest to replace global timer functions like `setInterval`, `clearInterval`, `setTimeout`, etc.
        // with mock versions that we can control manually. This is crucial for testing time-based logic without waiting for real time to pass.
        vi.useFakeTimers();
        
        // Spy on the global timer functions.
        // A spy is a special type of mock that "watches" a function. It doesn't replace the function's implementation (though it can),
        // but it records calls to it. Here, we are spying on the real (but faked) timer functions.
        vi.spyOn(global, 'setInterval'); // Watch calls to setInterval.
        vi.spyOn(global, 'clearInterval'); // Watch calls to clearInterval.
    });

    // 'afterEach' is a cleanup hook that runs after every single test in this suite.
    // This is crucial for resetting mocks and other shared state to prevent tests from affecting each other.
    afterEach(() => {
        // Clear all timers that were created with fake timers.
        vi.clearAllTimers();
        // Restore the real timers. This is good practice to avoid side effects in other test suites.
        vi.useRealTimers();
        // Clear all mocks. This resets call counts and mock implementations.
        vi.clearAllMocks();
        // Restore any spied-on methods to their original implementations.
        vi.restoreAllMocks();
    });

    // This is a helper function to mock the browser's `Image` class.
    // The AnimationPlayer uses `new Image()` to load image files. To test this without actual network requests,
    // we replace the global `Image` class with our own mock version.
    const mockImageLoader = () => {
        // Store the original, real `Image` class so we can restore it later.
        const originalImage = global.Image;
        // Create an array to keep track of all mock image instances created during a test.
        const mockImages: any[] = [];
        // Replace the global `Image` class with our mock implementation.
        (global.Image as any) = class MockImage {
            // These are properties that the real Image class has. Our code will set them.
            onload: (() => void) | null = null; // A callback function that should be called when the image "loads".
            onerror: ((err: any) => void) | null = null; // A callback for when loading fails.
            src: string = ''; // The URL of the image to load.
            
            // The constructor of our mock Image.
            constructor() {
                // Add the newly created instance to our tracking array.
                mockImages.push(this);
                // We simulate the asynchronous nature of image loading.
                // Using Promise.resolve().then() schedules the onload callback to be run
                // in the next microtask, which mimics how real image loading works.
                Promise.resolve().then(() => {
                    // If the code has set an onload handler, we call it to simulate a successful load.
                    if (this.onload) this.onload();
                });
            }
        };
        // The helper function returns an object with two things:
        return {
            // A function to restore the original `Image` class. This is called in `afterEach`.
            restore: () => { global.Image = originalImage; },
            // The array of all mock image instances that were created. This lets our tests inspect them.
            loadedImages: mockImages
        };
    };

    // A test suite for the constructor of the AnimationPlayer.
    describe('constructor', () => {
        // A test case to check if the constructor initializes properties correctly.
        it('should initialize with correct properties', () => {
            // Define the input parameters for the constructor.
            const imagePaths = ['image1.png', 'image2.png']; // An array of image paths.
            const onComplete = vi.fn(); // A mock function for the onComplete callback.
            
            // Create a new instance of the AnimationPlayer.
            const player = new AnimationPlayer(
                layer, // The mock Konva.Layer.
                imagePaths, // The image paths.
                30, // frameRate.
                100, 200, // x and y coordinates.
                50, 75, // width and height.
                true, // loop.
                onComplete // The onComplete callback.
            );

            // Assertions to check if the object was created correctly.
            // `expect(player).toBeDefined()` checks that the constructor returned an object (and didn't crash).
            expect(player).toBeDefined();
            // `expect(player.getIsPlaying()).toBe(false)` checks that the animation is not playing initially.
            expect(player.getIsPlaying()).toBe(false);
        });

        // Test case to ensure the constructor handles a frameRate of 0 gracefully.
        it('should handle frameRate of 0 by setting it to 1', () => {
            // Create a player with a frameRate of 0.
            const player = new AnimationPlayer(
                layer, // Mock layer.
                ['image.png'], // Image paths.
                0, // frameRate of 0.
                0, 0, // x, y.
                50, 50, // width, height.
                false, // loop.
                null // onComplete.
            );

            // Check that the player was created successfully. The constructor should not throw an error.
            // The implementation should internally handle this to prevent division by zero errors.
            expect(player).toBeDefined();
        });

        // Test case to ensure the constructor handles a negative frameRate.
        it('should handle negative frameRate by setting it to 1', () => {
            // Create a player with a negative frameRate.
            const player = new AnimationPlayer(
                layer, // Mock layer.
                ['image.png'], // Image paths.
                -10, // A negative frameRate.
                0, 0, // x, y.
                50, 50, // width, height.
                false, // loop.
                null // onComplete.
            );

            // Check that the player was created. The constructor should handle this invalid input.
            expect(player).toBeDefined();
        });
    });

    // A test suite for the `load` method.
    describe('load', () => {
        // Test case for when the `load` method is called with no image paths.
        it('should throw error when no frames are loaded', async () => {
            // Create an empty array for image paths.
            const imagePaths: string[] = [];
            // Create a player instance with the empty array.
            const player = new AnimationPlayer(layer, imagePaths, 30, 0, 0, 50, 50);

            // Assert that calling `player.load()` will result in a rejected Promise.
            // `expect(...).rejects` is used for testing asynchronous functions that should fail.
            // `.toThrow(...)` checks that the rejection reason (the error) matches the given string or regex.
            await expect(player.load()).rejects.toThrow('No animation frames loaded.');
        });

        // Test case to verify successful image loading.
        it('should load images successfully and not reload if already loaded', async () => {
            // Define image paths.
            const imagePaths = ['image1.png', 'image2.png'];
            // Create the player instance.
            const player = new AnimationPlayer(layer, imagePaths, 30, 0, 0, 50, 50);

            // Spy on `console.log` to check what messages are logged.
            // We provide a mock implementation `() => {}` to prevent logs from appearing in the test output.
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            // Use our mock image loader.
            const loader = mockImageLoader();
            // Call the `load` method, which is `async`. We must `await` it.
            await player.load();
            // Check that the success message was logged to the console.
            expect(consoleLogSpy).toHaveBeenCalledWith('Animation loaded 2 frames.');
            
            // Clear the spy's call history to prepare for the next assertion.
            consoleLogSpy.mockClear();
            // Call `load` again.
            await player.load();
            // Assert that `console.log` was NOT called this time, because the images should already be loaded.
            expect(consoleLogSpy).not.toHaveBeenCalled();
            
            // Clean up by restoring the original `Image` class and console.log.
            loader.restore();
            consoleLogSpy.mockRestore();
        });

        // Test case for when an image fails to load.
        it('should handle image load failure', async () => {
            // An array with a path to a "broken" image.
            const imagePaths = ['broken.png'];
            // Create the player instance.
            const player = new AnimationPlayer(layer, imagePaths, 30, 0, 0, 50, 50);

            // Spy on `console.error` to check for error messages.
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            // Store the original Image class.
            const originalImage = global.Image;
            // Temporarily replace the global Image class with a version that *always* fails.
            (global.Image as any) = class MockImage {
                onload: (() => void) | null = null;
                onerror: ((err: any) => void) | null = null;
                src: string = '';
                
                constructor() {
                    // Instead of calling onload, we simulate an error by calling the onerror callback.
                    Promise.resolve().then(() => {
                        if (this.onerror) this.onerror('Network error');
                    });
                }
            };

            // Expect the `load` method to reject the promise with an error message.
            await expect(player.load()).rejects.toMatch(/Failed to load image/);
            // Check that `console.error` was called.
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            // Restore the original Image class and console.error.
            global.Image = originalImage;
            consoleErrorSpy.mockRestore();
        });
    });

    // A test suite for the `start` method.
    describe('start', () => {
        // Test case: `start` should not do anything if the animation hasn't been loaded.
        it('should not start if not loaded', () => {
            // Create a player instance.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);
            // Spy on `console.warn` to check for warning messages.
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Call `start` without calling `load` first.
            player.start();

            // Check that the appropriate warning message was logged.
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Animation not loaded, has no frames, or is already playing.'
            );
            // Check that the animation's state is still "not playing".
            expect(player.getIsPlaying()).toBe(false);
            
            // Restore the console.
            consoleWarnSpy.mockRestore();
        });

        // Test case: a successful call to `start` after loading.
        it('should start animation and create Konva.Image', async () => {
            // Create the player.
            const player = new AnimationPlayer(layer, ['img1.png', 'img2.png'], 30, 10, 20, 100, 150);

            // Set up the mock image loader.
            const loader = mockImageLoader();
            // Load the images.
            await player.load();

            // Start the animation.
            player.start();

            // Assert that a new Konva.Image was created with the correct properties.
            expect(Konva.Image).toHaveBeenCalledWith({
                x: 10,
                y: 20,
                image: loader.loadedImages[0], // The first loaded mock image.
                width: 100,
                height: 150,
            });
            // Assert that the new image was added to the layer.
            expect(layer.add).toHaveBeenCalledWith(mockImage);
            // Assert that the layer was redrawn.
            expect(layer.batchDraw).toHaveBeenCalled();
            // Assert that the player's state is now "playing".
            expect(player.getIsPlaying()).toBe(true);
            // Assert that `setInterval` was called to start the animation loop.
            expect(global.setInterval).toHaveBeenCalled();

            // Clean up the image loader mock.
            loader.restore();
        });

        // Test case: `start` should reuse the existing Konva image if the animation is restarted.
        it('should reuse existing Konva.Image on restart', async () => {
            // Create the player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);

            // Set up the mock image loader.
            const loader = mockImageLoader();
            // Load the images.
            await player.load();

            // Start the animation.
            player.start();
            // Stop the animation.
            player.stop();
            
            // Clear all mock call history.
            vi.clearAllMocks();
            
            // We need to re-mock Konva.Image because vi.clearAllMocks() clears its mock implementation.
            Konva.Image = vi.fn().mockImplementation(function(this: any) {
                return mockImage;
            }) as any;

            // Start the animation again.
            player.start();

            // Assert that the `image` method of the *existing* mock Konva.Image was called to set the first frame.
            expect(mockImage.image).toHaveBeenCalledWith(loader.loadedImages[0]);
            // Assert that the existing image was made visible again.
            expect(mockImage.visible).toHaveBeenCalledWith(true);
            // CRITICAL: Assert that the Konva.Image *constructor* was NOT called again.
            expect(Konva.Image).not.toHaveBeenCalled();

            // Clean up.
            loader.restore();
        });

        // Test case: `start` should do nothing if the animation is already playing.
        it('should not start if already playing', async () => {
            // Create the player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);

            // Set up loader and load images.
            const loader = mockImageLoader();
            await player.load();

            // Spy on console.warn.
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            // Start the animation.
            player.start();
            // Get the number of times setInterval has been called so far.
            const callCount = (global.setInterval as any).mock.calls.length;
            
            // Try to start the animation again.
            player.start();

            // Assert that the warning message was logged.
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Animation not loaded, has no frames, or is already playing.'
            );
            // Assert that setInterval was not called a second time.
            expect((global.setInterval as any).mock.calls.length).toBe(callCount);
            
            // Clean up.
            consoleWarnSpy.mockRestore();
            loader.restore();
        });

        // A test for an edge case where the frames array is empty when `start` is called.
        it('should handle frames with no images', async () => {
            // Create the player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);

            // Load images.
            const loader = mockImageLoader();
            await player.load();
            
            // Manually modify the internal state of the player for this test.
            // This is sometimes necessary for testing edge cases that are hard to trigger externally.
            // We cast `player` to `any` to bypass TypeScript's private property protection.
            (player as any).frames = [];
            
            // Spy on console.warn.
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            // Call `start`.
            player.start();
            
            // Assert that a warning was logged because the frames array is empty.
            expect(consoleWarnSpy).toHaveBeenCalled();
            // Clean up.
            consoleWarnSpy.mockRestore();
            loader.restore();
        });
    });

    // A test suite for the `stop` method.
    describe('stop', () => {
        // Test case: `stop` should not crash or do anything weird if called when not playing.
        it('should handle stop when not playing', () => {
            // Create the player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);
            
            // Call `stop` without ever calling `start`.
            player.stop();
            // Assert that the player is still in the "not playing" state.
            expect(player.getIsPlaying()).toBe(false);
        });

        // Test case: `stop` should correctly stop a playing animation.
        it('should stop a playing animation', async () => {
            // Create the player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);

            // Load images.
            const loader = mockImageLoader();
            await player.load();

            // Start the animation.
            player.start();
            // Assert that it is now playing.
            expect(player.getIsPlaying()).toBe(true);

            // Stop the animation.
            player.stop();
            // Assert that it is now stopped.
            expect(player.getIsPlaying()).toBe(false);
            // Assert that `clearInterval` was called to stop the animation loop.
            expect(global.clearInterval).toHaveBeenCalled();

            // Clean up.
            loader.restore();
        });
    });

    // A test suite for the `destroy` method.
    describe('destroy', () => {
        // Test case: `destroy` should not crash if there's no Konva image to destroy.
        it('should handle destroy when konvaImage is null', () => {
            // Create a player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);
            
            // Call destroy without starting it (so no Konva image was created).
            player.destroy();
            // Assert it's not playing.
            expect(player.getIsPlaying()).toBe(false);
        });

        // Test case: `destroy` should clean up all resources.
        it('should destroy animation and cleanup resources', async () => {
            // Create a player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);

            // Load and start the animation.
            const loader = mockImageLoader();
            await player.load();
            player.start();

            // Check that it's playing.
            expect(player.getIsPlaying()).toBe(true);

            // Destroy the player.
            player.destroy();

            // Assert that the `destroy` method of the mock Konva image was called.
            expect(mockImage.destroy).toHaveBeenCalled();
            // Assert the player is no longer in a "playing" state.
            expect(player.getIsPlaying()).toBe(false);
            // Assert that the timer was cleared.
            expect(global.clearInterval).toHaveBeenCalled();

            // Clean up.
            loader.restore();
        });
    });

    // A test suite for the `getIsPlaying` method.
    describe('getIsPlaying', () => {
        // Test case: should return false before the animation starts.
        it('should return false initially', () => {
            // Create a player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);
            // Assert that it returns false.
            expect(player.getIsPlaying()).toBe(false);
        });

        // Test case: should return true while playing and false after stopping.
        it('should return true when playing', async () => {
            // Create a player.
            const player = new AnimationPlayer(layer, ['img.png'], 30, 0, 0, 50, 50);

            // Load images.
            const loader = mockImageLoader();
            await player.load();

            // Assert it's false before starting.
            expect(player.getIsPlaying()).toBe(false);
            
            // Start the animation.
            player.start();
            // Assert it's true now.
            expect(player.getIsPlaying()).toBe(true);
            
            // Stop the animation.
            player.stop();
            // Assert it's false again.
            expect(player.getIsPlaying()).toBe(false);

            // Clean up.
            loader.restore();
        });
    });

    //
    // --- NEW TESTS TO COVER advanceFrame ---
    // This test suite focuses on the time-based logic inside the `setInterval` callback,
    // which we've named `advanceFrame` in our thoughts. We use `vi.advanceTimersByTime` to test it.
    //
    describe('advanceFrame (timer)', () => {
        // Define constants for the tests in this suite to make them readable.
        const frameRate = 1; // 1 frame per second.
        const frameTime = 1000; // The duration of one frame in milliseconds (1000ms / 1fps).

        // Test case: verify that the animation loops correctly.
        it('should loop animation', async () => {
            // Create a player with two frames and `loop` set to true.
            const player = new AnimationPlayer(
                layer, 
                ['img1.png', 'img2.png'], 
                frameRate, 
                0, 0, 50, 50, 
                true // loop = true
            );
            
            // Load and start.
            const loader = mockImageLoader();
            await player.load();
            player.start();

            // Check initial state: should be at frame index 0.
            // We cast to `any` to access the private `currentFrameIndex` property for testing.
            expect((player as any).currentFrameIndex).toBe(0);
            
            // Advance the fake timer by the duration of one frame.
            vi.advanceTimersByTime(frameTime);
            // Assert that the frame index is now 1.
            expect((player as any).currentFrameIndex).toBe(1);
            // Assert that the Konva image was updated with the second image.
            expect(mockImage.image).toHaveBeenCalledWith(loader.loadedImages[1]);
            
            // Advance the timer again.
            vi.advanceTimersByTime(frameTime);
            // Assert that the frame index has looped back to 0.
            expect((player as any).currentFrameIndex).toBe(0);
            // Assert that the Konva image was updated with the first image again.
            expect(mockImage.image).toHaveBeenCalledWith(loader.loadedImages[0]);
            
            // The animation should still be playing.
            expect(player.getIsPlaying()).toBe(true);
            // Clean up.
            loader.restore();
        });

        // Test case: verify that the animation stops at the end if not looping.
        it('should stop animation when not looping and call onComplete', async () => {
            // Create a mock function for the onComplete callback.
            const onComplete = vi.fn();
            // Create a player with `loop` set to false.
            const player = new AnimationPlayer(
                layer, 
                ['img1.png', 'img2.png'], 
                frameRate, 
                0, 0, 50, 50, 
                false, // loop = false
                onComplete
            );
            
            // Load and start.
            const loader = mockImageLoader();
            await player.load();
            player.start();

            // Check initial state.
            expect((player as any).currentFrameIndex).toBe(0);
            
            // Advance to the second frame.
            vi.advanceTimersByTime(frameTime);
            // Check that we are on frame index 1.
            expect((player as any).currentFrameIndex).toBe(1);
            // Check that the image was updated.
            expect(mockImage.image).toHaveBeenCalledWith(loader.loadedImages[1]);
            
            // Advance the timer past the end of the animation.
            vi.advanceTimersByTime(frameTime);
            
            // Assert that the animation is now stopped.
            expect(player.getIsPlaying()).toBe(false);
            // Assert that the onComplete callback was called.
            expect(onComplete).toHaveBeenCalled();
            // Assert that the interval was cleared.
            expect(global.clearInterval).toHaveBeenCalled();
            
            // Clean up.
            loader.restore();
        });

        // Test case: verify that the frame doesn't advance if the animation is stopped.
        it('should not advance frame if stopped', async () => {
             // Create a player.
             const player = new AnimationPlayer(
                layer, 
                ['img1.png', 'img2.png'], 
                frameRate, 
                0, 0, 50, 50, 
                true
            );
            
            // Load and start.
            const loader = mockImageLoader();
            await player.load();
            player.start();
            
            // Check initial frame index.
            expect((player as any).currentFrameIndex).toBe(0);

            // Stop the animation.
            player.stop();
            // Verify it's stopped.
            expect(player.getIsPlaying()).toBe(false);

            // Try to advance the timer.
            vi.advanceTimersByTime(frameTime);
            
            // The frame index should NOT have changed.
            expect((player as any).currentFrameIndex).toBe(0);
            // Clean up.
            loader.restore();
        });

        // Test case: ensures the animation doesn't crash if a frame is missing.
        it('should handle empty/null frames gracefully', async () => {
            // Create player.
            const player = new AnimationPlayer(
                layer, 
                ['img1.png', 'img2.png'], 
                frameRate, 
                0, 0, 50, 50, 
                true
            );
            
            // Load images.
            const loader = mockImageLoader();
            await player.load();

            // Manually insert a `null` value into the frames array to simulate a missing image.
            (player as any).frames[1] = null;

            // Start the animation. This shows frame 0 and calls batchDraw once.
            player.start();

            // Advance to the bad frame (index 1).
            vi.advanceTimersByTime(frameTime);
            // Check that the index is now 1.
            expect((player as any).currentFrameIndex).toBe(1);
            
            // The fix in the source code ensures batchDraw is still called to maintain timing.
            // It was called once on start, and once here for the null frame.
            expect(layer.batchDraw).toHaveBeenCalledTimes(2);
            
            // Advance again, it should loop back to the valid frame 0.
            vi.advanceTimersByTime(frameTime);
            // Check the index is now 0.
            expect((player as any).currentFrameIndex).toBe(0);
            // batchDraw should have been called a third time.
            expect(layer.batchDraw).toHaveBeenCalledTimes(3);

            // Clean up.
            loader.restore();
        });
    });
});