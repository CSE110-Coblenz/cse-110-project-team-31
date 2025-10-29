import Konva from 'konva';
import { MinigameResult } from './types';
import { ConfigManager } from './config';

export class CleaningMinigame {
    private layer: Konva.Layer;
    private stage: Konva.Stage;
    private config = ConfigManager.getInstance().getConfig();
    
    private timeRemaining: number;
    private currentProblem: { question: string; answer: number };
    private correctAnswers: number = 0;
    private totalProblems: number = 0;
    
    private timerText: Konva.Text;
    private problemText: Konva.Text;
    private scoreText: Konva.Text;
    private feedbackText: Konva.Text;
    private inputText: Konva.Text;
    private userInput: string = '';
    
    private timerInterval: number | null = null;
    private onComplete: (result: MinigameResult) => void;
    private keyboardHandler: (e: KeyboardEvent) => void;

    private totalDishesToClean: number;
    private dishesCleaned: number = 0;

    constructor(
        stage: Konva.Stage, 
        layer: Konva.Layer,
        totalDishesToClean: number,  // Add this parameter
        onComplete: (result: MinigameResult) => void
    ) {
        this.stage = stage;
        this.layer = layer;
        this.totalDishesToClean = totalDishesToClean;
        this.onComplete = onComplete;
        this.timeRemaining = this.config.cleaningTime;
        
        this.keyboardHandler = this.handleKeyPress.bind(this);
        
        this.setupUI();
        this.generateNewProblem();
        this.startTimer();
        this.setupKeyboardInput();
    }

    private setupUI(): void {
        // Background for cleaning theme
        /*
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: this.stage.width(),
            height: this.stage.height(),
            fill: '#e8f4f8'
        });
        this.layer.add(background);
        */
        // Title
        const title = new Konva.Text({
            x: 50,
            y: 30,
            text: 'Cleaning Dishes - Solve Multiplication Problems!',
            fontSize: 28,
            fill: '#16a085',
            fontStyle: 'bold'
        });
        this.layer.add(title);

        // Timer
        this.timerText = new Konva.Text({
            x: 1400,
            y: 30,
            text: `Time: ${this.timeRemaining}s`,
            fontSize: 24,
            fill: '#27ae60',
            fontStyle: 'bold'
        });
        this.layer.add(this.timerText);

        // Score (dishes cleaned)
        this.scoreText = new Konva.Text({
            x: 50,
            y: 80,
            text: `Dishes Cleaned: ${this.dishesCleaned} / ${this.totalDishesToClean}`,
            fontSize: 20,
            fill: '#16a085'
        });
        this.layer.add(this.scoreText);

        // Dish visual indicator
        const dishText = new Konva.Text({
            x: 700,
            y: 150,
            text: '🍽️',
            fontSize: 80
        });
        this.layer.add(dishText);

        // Problem display
        this.problemText = new Konva.Text({
            x: 650,
            y: 300,
            text: '',
            fontSize: 48,
            fill: '#2c3e50',
            fontStyle: 'bold',
            align: 'center',
            width: 300
        });
        this.layer.add(this.problemText);

        // Input box background
        const inputBox = new Konva.Rect({
            x: 600,
            y: 400,
            width: 400,
            height: 70,
            fill: '#ffffff',
            stroke: '#16a085',
            strokeWidth: 4,
            cornerRadius: 8,
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOpacity: 0.2
        });
        this.layer.add(inputBox);

        // Input text
        this.inputText = new Konva.Text({
            x: 610,
            y: 418,
            text: '',
            fontSize: 36,
            fill: '#2c3e50',
            width: 380,
            align: 'center'
        });
        this.layer.add(this.inputText);

        // Feedback text (shows "Correct!" or "Wrong!")
        this.feedbackText = new Konva.Text({
            x: 650,
            y: 520,
            text: '',
            fontSize: 32,
            fill: '#27ae60',
            align: 'center',
            width: 300,
            fontStyle: 'bold'
        });
        this.layer.add(this.feedbackText);

        // Instructions
        const instructions = new Konva.Text({
            x: 550,
            y: 650,
            text: 'Type your answer and press ENTER to clean a dish!',
            fontSize: 20,
            fill: '#7f8c8d',
            align: 'center',
            width: 500
        });
        this.layer.add(instructions);

        // Dirty dishes visual
        const dirtyDishesText = new Konva.Text({
            x: 50,
            y: 850,
            text: 'Dirty dishes remaining will limit tomorrow\'s capacity!',
            fontSize: 18,
            fill: '#e74c3c',
            fontStyle: 'italic'
        });
        this.layer.add(dirtyDishesText);

        this.layer.draw();
    }

    private generateNewProblem(): void {
        // Generate multiplication problems
        const num1 = Math.floor(Math.random() * 12) + 1; // 1-12
        const num2 = Math.floor(Math.random() * 12) + 1; // 1-12
        
        this.currentProblem = {
            question: `${num1} × ${num2}`,
            answer: num1 * num2
        };
        
        this.problemText.text(this.currentProblem.question);
        this.layer.draw();
    }

    private setupKeyboardInput(): void {
        window.addEventListener('keydown', this.keyboardHandler);
    }

    private handleKeyPress(e: KeyboardEvent): void {
        if (this.timerInterval === null) return; // Game ended

        if (e.key === 'Enter') {
            this.checkAnswer();
        } else if (e.key === 'Backspace') {
            this.userInput = this.userInput.slice(0, -1);
            this.updateInputDisplay();
        } else if (e.key >= '0' && e.key <= '9') {
            this.userInput += e.key;
            this.updateInputDisplay();
        }
    }

    private updateInputDisplay(): void {
        this.inputText.text(this.userInput);
        this.layer.draw();
    }

    private checkAnswer(): void {
        if (this.userInput === '') return;

        const userAnswer = parseInt(this.userInput);
        this.totalProblems++;

        if (userAnswer === this.currentProblem.answer) {
            this.correctAnswers++;
            this.dishesCleaned++;
            this.showFeedback('Clean! ✓', '#27ae60');
            
            // Check if all dishes are cleaned
            if (this.dishesCleaned >= this.totalDishesToClean) {
                setTimeout(() => {
                    this.endMinigame();
                }, 500);
                return;
            }
        } else {
            this.showFeedback('Still Dirty! ✗', '#e74c3c');
        }

        this.updateScore();
        this.userInput = '';
        this.updateInputDisplay();
        
        setTimeout(() => {
            this.feedbackText.text('');
            this.generateNewProblem();
            this.layer.draw();
        }, 500);
    }

    private showFeedback(message: string, color: string): void {
        this.feedbackText.text(message);
        this.feedbackText.fill(color);
        this.layer.draw();
    }

    private updateScore(): void {
        this.scoreText.text(`Dishes Cleaned: ${this.dishesCleaned} / ${this.totalDishesToClean}`);
        this.layer.draw();
    }

    private startTimer(): void {
        this.timerInterval = window.setInterval(() => {
            this.timeRemaining--;
            this.timerText.text(`Time: ${this.timeRemaining}s`);
            
            // Change color as time runs low
            if (this.timeRemaining <= 10) {
                this.timerText.fill('#e74c3c');
            } else if (this.timeRemaining <= 20) {
                this.timerText.fill('#f39c12');
            }
            
            this.layer.draw();

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

        // Remove keyboard listener
        window.removeEventListener('keydown', this.keyboardHandler);

        const result: MinigameResult = {
            correctAnswers: this.correctAnswers,
            totalProblems: this.totalProblems,
            timeRemaining: 0
        };

        this.onComplete(result);
    }

    public cleanup(): void {
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
        }
        window.removeEventListener('keydown', this.keyboardHandler);
    }
}