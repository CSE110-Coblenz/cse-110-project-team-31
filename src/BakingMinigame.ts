import Konva from 'konva';
import { MinigameResult } from './types';
import { ConfigManager } from './config';

// --- HELPER FUNCTION FOR LOADING MULTIPLE IMAGES ---
function loadImages(urls: string[]): Promise<HTMLImageElement[]> {
    const promises = urls.map(url => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    });
    return Promise.all(promises);
}
// --- END HELPER FUNCTION ---


export class BakingMinigame {
    private layer: Konva.Layer;
    private stage: Konva.Stage;
    private config = ConfigManager.getInstance().getConfig();

    private timeRemaining: number;
    private currentProblem: { question: string; answer: number };
    private correctAnswers: number = 0; // Tracks successful cookies
    private totalProblems: number = 0; // Tracks total attempts

    // --- UI Elements Grouped ---
    private minigameUIGroup: Konva.Group; // Group for math problem elements
    private timerText: Konva.Text;
    private problemText: Konva.Text;
    private scoreText: Konva.Text; // "Cookies Made" text
    private feedbackText: Konva.Text;
    private inputText: Konva.Text;
    private userInput: string = '';

    private timerInterval: number | null = null;
    private onComplete: (result: MinigameResult) => void;
    private canMakeMoreCookies: () => boolean;
    private keyboardHandler: (e: KeyboardEvent) => void; // Store handler for removal

    // --- Animation Properties ---
    private animationImage: Konva.Image | null = null; // The Konva Image object
    private animationFrames: HTMLImageElement[] = []; // Array to hold loaded images
    private currentFrameIndex: number = 0;
    private animationInterval: number | null = null; // Interval timer for frame changes
    private animationFrameRate: number = 2; // Frames per second (adjust as needed)
    private animationHasPlayed: boolean = false; // Flag to track if animation finished

    constructor(
        stage: Konva.Stage,
        layer: Konva.Layer,
        onComplete: (result: MinigameResult) => void,
        canMakeMoreCookies: () => boolean
    ) {
        this.stage = stage;
        this.layer = layer;
        this.onComplete = onComplete;
        this.canMakeMoreCookies = canMakeMoreCookies;
        this.timeRemaining = this.config.bakingTime;
        this.keyboardHandler = this.handleKeyPress.bind(this);

        // --- Initialize UI elements but don't start game logic yet ---
        this.minigameUIGroup = new Konva.Group({ visible: false }); // Start hidden
        this.layer.add(this.minigameUIGroup);
        this.setupUI(); // Creates UI elements and adds them to the hidden group

        this.runBakingAnimation(); // <-- Start the animation immediately
    }

    private setupUI(): void {
        // --- This function now just CREATES the UI elements ---
        // --- They are added to minigameUIGroup which starts hidden ---
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();

        // Title
        const title = new Konva.Text({
            x: stageWidth * 0.05,
            y: stageHeight * 0.05,
            text: 'Baking Minigame - Solve Division Problems!',
            fontSize: Math.min(stageWidth * 0.028, 34),
            fill: '#2c3e50',
            fontStyle: 'bold'
        });
        this.minigameUIGroup.add(title); // Add to group

        // Timer (right side)
        this.timerText = new Konva.Text({
            x: stageWidth * 0.75,
            y: stageHeight * 0.05,
            text: `Time: ${this.timeRemaining}s`,
            fontSize: Math.min(stageWidth * 0.024, 28),
            fill: '#27ae60',
            fontStyle: 'bold'
        });
        this.minigameUIGroup.add(this.timerText); // Add to group

        // Score
        this.scoreText = new Konva.Text({
            x: stageWidth * 0.05,
            y: stageHeight * 0.12,
            text: `Cookies Made: ${this.correctAnswers}`,
            fontSize: Math.min(stageWidth * 0.02, 24),
            fill: '#34495e'
        });
        this.minigameUIGroup.add(this.scoreText); // Add to group

        // Problem display
        this.problemText = new Konva.Text({
            x: stageWidth * 0.4,
            y: stageHeight * 0.3, // Adjusted position for layout without animation
            text: '',
            fontSize: Math.min(stageWidth * 0.048, 58),
            fill: '#2c3e50',
            fontStyle: 'bold',
            align: 'center',
            width: stageWidth * 0.2
        });
        this.minigameUIGroup.add(this.problemText); // Add to group

        // Input box
        const inputBox = new Konva.Rect({
            x: stageWidth * 0.35,
            y: stageHeight * 0.45, // Adjusted position
            width: stageWidth * 0.3,
            height: stageHeight * 0.08,
            fill: '#ecf0f1',
            stroke: '#3498db',
            strokeWidth: 3,
            cornerRadius: 5
        });
        this.minigameUIGroup.add(inputBox); // Add to group

        // Input text
        this.inputText = new Konva.Text({
            x: stageWidth * 0.36,
            y: stageHeight * 0.45 + (stageHeight * 0.08 * 0.2), // Adjusted position
            text: '',
            fontSize: Math.min(stageWidth * 0.036, 44),
            fill: '#2c3e50',
            width: stageWidth * 0.28,
            align: 'center'
        });
        this.minigameUIGroup.add(this.inputText); // Add to group

        // Feedback
        this.feedbackText = new Konva.Text({
            x: stageWidth * 0.4,
            y: stageHeight * 0.58, // Adjusted position
            text: '',
            fontSize: Math.min(stageWidth * 0.028, 34),
            fill: '#27ae60',
            align: 'center',
            width: stageWidth * 0.2
        });
        this.minigameUIGroup.add(this.feedbackText); // Add to group

        // Instructions
        const instructions = new Konva.Text({
            x: stageWidth * 0.3,
            y: stageHeight * 0.7, // Adjusted position
            text: 'Type your answer and press ENTER',
            fontSize: Math.min(stageWidth * 0.018, 22),
            fill: '#7f8c8d',
            align: 'center',
            width: stageWidth * 0.4
        });
        this.minigameUIGroup.add(instructions); // Add to group

        // DO NOT DRAW layer here initially
    }

    private async runBakingAnimation(): Promise<void> {
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();

        const IMAGE_PATHS = [
            '/9.png', '/10.png', '/11.png', '/12.png', '/13.png', '/14.png'
        ];
        // --- Frame dimensions set to fill stage ---
        const FRAME_WIDTH = stageWidth;
        const FRAME_HEIGHT = stageHeight;

        try {
            this.animationFrames = await loadImages(IMAGE_PATHS);
            if (this.animationFrames.length === 0) throw new Error("No animation frames loaded.");

            this.animationImage = new Konva.Image({
                x: 0, // Position at top-left
                y: 0,
                image: this.animationFrames[0],
                width: FRAME_WIDTH,  // Fill screen width
                height: FRAME_HEIGHT, // Fill screen height
            });
            this.layer.add(this.animationImage);
            this.layer.draw(); // Show the first frame

            this.currentFrameIndex = 0;
            this.animationHasPlayed = false; // Reset flag

            this.animationInterval = window.setInterval(() => {
                // If animation already finished one loop, stop interval
                if (this.animationHasPlayed || !this.animationImage) {
                   if (this.animationInterval) clearInterval(this.animationInterval);
                   return;
                }

                this.currentFrameIndex++;

                // Check if we just showed the LAST frame
                if (this.currentFrameIndex >= this.animationFrames.length) {
                    this.animationHasPlayed = true; // Mark as finished
                    if (this.animationInterval) clearInterval(this.animationInterval);
                    this.animationInterval = null;
                    
                    // --- Transition to Minigame ---
                    this.showMinigameUI(); 
                    return; // Stop the interval function
                }

                // Update the image source and redraw
                this.animationImage.image(this.animationFrames[this.currentFrameIndex]);
                this.layer.batchDraw();

            }, 1000 / this.animationFrameRate);

        } catch (error) {
            console.error("Failed to load animation images:", error);
            // If animation fails, immediately show the minigame UI as fallback
            this.showMinigameUI();
        }
    }

    // --- NEW METHOD: To show the actual game UI after animation ---
    private showMinigameUI(): void {
        // Remove animation image
        if (this.animationImage) {
            this.animationImage.destroy();
            this.animationImage = null;
        }

        // Make the minigame group visible
        this.minigameUIGroup.visible(true);

        // --- Start the game logic NOW ---
        this.generateNewProblem(); // Show the first problem
        this.startTimer();         // Start the countdown
        this.setupKeyboardInput(); // Enable keyboard input

        this.layer.batchDraw(); // Redraw layer to show the UI
    }


    private generateNewProblem(): void {
        // Check if problemText exists before using it
        if (!this.problemText) return; 

        const divisor = Math.floor(Math.random() * 9) + 2;
        const quotient = Math.floor(Math.random() * 12) + 1;
        const dividend = divisor * quotient;

        this.currentProblem = {
            question: `${dividend} ÷ ${divisor}`,
            answer: quotient
        };

        this.problemText.text(this.currentProblem.question);
        this.layer.draw();
    }

    private setupKeyboardInput(): void {
        window.addEventListener('keydown', this.keyboardHandler);
    }

    private handleKeyPress(e: KeyboardEvent): void {
        // Don't process keys if the minigame UI isn't visible yet
        if (!this.minigameUIGroup.visible() || this.timerInterval === null) return; 

        if (e.key === 'Enter') {
            this.checkAnswer();
        } else if (e.key === 'Backspace') {
            this.userInput = this.userInput.slice(0, -1);
            this.updateInputDisplay();
        } else if (e.key >= '0' && e.key <= '9') {
            if (this.userInput.length < 5) {
                this.userInput += e.key;
                this.updateInputDisplay();
            }
        }
    }

    private updateInputDisplay(): void {
        if (!this.inputText) return;
        this.inputText.text(this.userInput);
        this.layer.draw();
    }

    private checkAnswer(): void {
        if (this.userInput === '' || !this.feedbackText) return;

        const userAnswer = parseInt(this.userInput);
        this.totalProblems++;

        if (userAnswer === this.currentProblem.answer) {
            if (this.canMakeMoreCookies()) {
                this.correctAnswers++;
                this.showFeedback('Cookie Made! ✓', '#27ae60');
            } else {
                this.showFeedback('Out of Ingredients!', '#e74c3c');
                setTimeout(() => {
                    this.endMinigame(); // End early if no ingredients
                }, 1000);
                return;
            }
        } else {
            this.showFeedback('Wrong! ✗', '#e74c3c');
        }

        this.updateScore();
        this.userInput = '';
        this.updateInputDisplay();

        setTimeout(() => {
            this.showFeedback('', 'transparent'); // Clear feedback
            this.generateNewProblem();
        }, 800);
    }

    private showFeedback(message: string, color: string): void {
        if (!this.feedbackText) return;
        this.feedbackText.text(message);
        this.feedbackText.fill(color);
        this.layer.draw();
    }

    private updateScore(): void {
        if (!this.scoreText) return;
        this.scoreText.text(`Cookies Made: ${this.correctAnswers}`);
        this.layer.draw();
    }

    private startTimer(): void {
        // Ensure timer starts only once
        if (this.timerInterval !== null) return; 

        this.timerInterval = window.setInterval(() => {
            this.timeRemaining--;
            
            // Check if timerText exists
            if (this.timerText) { 
                this.timerText.text(`Time: ${this.timeRemaining}s`);
                if (this.timeRemaining <= 10) {
                    this.timerText.fill('#e74c3c');
                } else if (this.timeRemaining <= 30) {
                    this.timerText.fill('#f39c12');
                }
                this.layer.draw(); // Draw only if text exists
            }

            if (this.timeRemaining <= 0) {
                this.endMinigame();
            }
        }, 1000);
    }

    private endMinigame(): void {
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.animationInterval !== null) {
           clearInterval(this.animationInterval);
           this.animationInterval = null;
        }

        window.removeEventListener('keydown', this.keyboardHandler);

        const result: MinigameResult = {
            correctAnswers: this.correctAnswers,
            totalProblems: this.totalProblems,
            timeRemaining: 0
        };

        setTimeout(() => {
            // Check if onComplete exists before calling
            if (this.onComplete) { 
               this.onComplete(result);
            }
        }, 500);
    }

    public cleanup(): void {
        // Clear both intervals
        if (this.animationInterval !== null) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        // Destroy the animation image if it exists
        if (this.animationImage) {
            this.animationImage.destroy();
            this.animationImage = null;
        }
        // Remove listener
        window.removeEventListener('keydown', this.keyboardHandler);
        // Optional: Destroy the minigame UI group if needed, but usually layer handles this
        // this.minigameUIGroup.destroy();
    }
}
