import Konva from 'konva';

export class LoginScreen {
    private layer: Konva.Layer;
    private stage: Konva.Stage;
    private onLogin: (username: string) => void;
    private username: string = '';
    
    private inputText: Konva.Text;
    private cursor: Konva.Rect;
    private cursorInterval: number | null = null;
    private keyboardHandler: (e: KeyboardEvent) => void;

    constructor(stage: Konva.Stage, layer: Konva.Layer, onLogin: (username: string) => void) {
        this.stage = stage;
        this.layer = layer;
        this.onLogin = onLogin;
        this.keyboardHandler = this.handleKeyPress.bind(this);
        this.setupUI();
        this.setupKeyboardInput();
    }

    private setupUI(): void {
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();

        // Title
        const titleImageObj = new Image();
        titleImageObj.onload = () => {
            const ascpectRatio = titleImageObj.width / titleImageObj.height;
            const fixedWidth = 400;
            const fixedHeight = fixedWidth / ascpectRatio;

            const titleImage = new Konva.Image({
                x: (stageWidth - stageWidth * 0.5) / 2,
                y: stageHeight * 0.15,
                image: titleImageObj,
                width: fixedWidth,
                height: fixedHeight
            });
            this.layer.add(titleImage);
            this.layer.draw();
        };
        titleImageObj.src = '/title-logo.png'

        // Subtitle
        const subtitle = new Konva.Text({
            x: 0,
            y: stageHeight * 0.3,
            width: stageWidth,
            text: 'Enter your name to begin!',
            fontSize: Math.min(stageWidth * 0.02, 24),
            fill: '#d62828', // Color from your palette
            align: 'center'
        });
        this.layer.add(subtitle);

        // Input box background
        const inputBox = new Konva.Rect({
            x: (stageWidth - (stageWidth * 0.4)) / 2,
            y: stageHeight * 0.45,
            width: stageWidth * 0.4,
            height: 60,
            fill: 'white',
            stroke: '#003049',
            strokeWidth: 4,
            cornerRadius: 10
        });
        this.layer.add(inputBox);

        // Input text
        this.inputText = new Konva.Text({
            x: (stageWidth - (stageWidth * 0.4)) / 2 + 15,
            y: stageHeight * 0.45 + 18,
            text: '',
            fontSize: 24,
            fill: 'black',
            width: stageWidth * 0.4 - 30
        });
        this.layer.add(this.inputText);

        // Create blinking cursor
        this.cursor = new Konva.Rect({
            x: this.inputText.x() + 2,
            y: this.inputText.y(),
            width: 2,
            height: this.inputText.fontSize(),
            fill: 'black',
            visible: false
        });
        this.layer.add(this.cursor);

        // Start cursor blinking
        this.cursorInterval = window.setInterval(() => {
            if (this.cursor) {
                this.cursor.visible(!this.cursor.visible());
                this.layer.draw();
            }
        }, 500);

        // Start Game button
        this.createStartButton(stageWidth, stageHeight);

        this.layer.draw();
    }

    private createStartButton(stageWidth: number, stageHeight: number): void {
        const buttonWidth = Math.min(stageWidth * 0.25, 300);
        const buttonHeight = Math.min(stageHeight * 0.08, 60);
        
        const buttonGroup = new Konva.Group({
            x: (stageWidth - buttonWidth) / 2,
            y: stageHeight * 0.6
        });

        const rect = new Konva.Rect({
            width: buttonWidth,
            height: buttonHeight,
            fill: '#4CAF50',
            cornerRadius: 10
        });

        const text = new Konva.Text({
            width: buttonWidth,
            height: buttonHeight,
            text: 'START GAME',
            fontSize: Math.min(stageWidth * 0.022, 28),
            fill: 'white',
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: 'bold'
        });

        buttonGroup.add(rect);
        buttonGroup.add(text);

        buttonGroup.on('click', () => {
            if (this.username.trim() === '') {
                alert('Please enter a name!');
                return;
            }
            this.cleanup();
            this.onLogin(this.username.trim());
        });

        buttonGroup.on('mouseenter', () => {
            this.stage.container().style.cursor = 'pointer';
            rect.fill('#45a049');
            this.layer.draw();
        });

        buttonGroup.on('mouseleave', () => {
            this.stage.container().style.cursor = 'default';
            rect.fill('#4CAF50');
            this.layer.draw();
        });

        this.layer.add(buttonGroup);
    }

    private setupKeyboardInput(): void {
        window.addEventListener('keydown', this.keyboardHandler);
    }

    private handleKeyPress(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            if (this.username.trim() === '') {
                alert('Please enter a name!');
                return;
            }
            this.cleanup();
            this.onLogin(this.username.trim());
            return;
        }
        
        if (e.key === 'Backspace') {
            this.username = this.username.slice(0, -1);
        } else if (e.key.length === 1 && this.username.length < 20) {
            // Allow letters, numbers, and spaces
            if (/[a-zA-Z0-9 ]/.test(e.key)) {
                this.username += e.key;
            }
        }
        
        this.updateInputDisplay();
    }

    private updateInputDisplay(): void {
        this.inputText.text(this.username);
        
        // Update cursor position
        const textWidth = this.inputText.getTextWidth();
        this.cursor.x(this.inputText.x() + textWidth + 2);
        
        this.layer.draw();
    }

    public cleanup(): void {
        window.removeEventListener('keydown', this.keyboardHandler);
        if (this.cursorInterval) {
            clearInterval(this.cursorInterval);
        }
    }
}