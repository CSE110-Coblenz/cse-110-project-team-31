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
        this.setupUI(); // This will call the new async function
        this.setupKeyboardInput();
    }

    // --- TAKEN FROM HERS: Async setup, title image, fonts, and colors ---
    private async setupUI(): Promise<void> {
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();

        // Load the special font
        await document.fonts.load('24px "Press Start 2P"');

        // Title
        const titleImageObj = new Image();
        titleImageObj.onload = () => {
            const ascpectRatio = titleImageObj.width / titleImageObj.height;
            const fixedWidth = 600;
            const fixedHeight = fixedWidth / ascpectRatio;

            const titleImage = new Konva.Image({
                x: (stageWidth - fixedWidth) / 2,
                y: stageHeight * 0.15,
                image: titleImageObj,
                width: fixedWidth,
                height: fixedHeight
            });
            this.layer.add(titleImage);
            this.layer.draw();
        };
        titleImageObj.src = '/title-logo.png' // Make sure this image is in your /public folder

        // Subtitle
        const subtitle = new Konva.Text({
            x: 0,
            y: stageHeight * 0.4,
            width: stageWidth,
            text: 'Enter your name to begin!',
            fontSize: Math.min(stageWidth * 0.025, 24),
            fontFamily: '"Press Start 2P"', // Her font
            fill: '#ffffff', // Her color
            shadowColor: 'd3d3d3', // Her shadow
            shadowBlur: 5,
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
            stroke: '#fcbf49', // Her stroke color
            strokeWidth: 4,
            // We keep your cornerRadius
            cornerRadius: 10 
        });
        this.layer.add(inputBox);

        // Input text
        this.inputText = new Konva.Text({
            x: (stageWidth - (stageWidth * 0.4)) / 2 + 15,
            y: stageHeight * 0.45 + 18,
            text: '',
            fontFamily: '"Press Start 2P"', // Her font
            fontSize: 24,
            fill: 'black',
            width: stageWidth * 0.4 - 30
        });
        this.layer.add(this.inputText);

        // Create blinking cursor (Same as your logic)
        this.cursor = new Konva.Rect({
            x: this.inputText.x() + 2,
            y: this.inputText.y(),
            width: 2,
            height: this.inputText.fontSize(),
            fill: 'black',
            visible: false
        });
        this.layer.add(this.cursor);

        // Start cursor blinking (Same as your logic)
        this.cursorInterval = window.setInterval(() => {
            if (this.cursor) {
                this.cursor.visible(!this.cursor.visible());
                this.layer.draw();
            }
        }, 500);

        // Start Game button (Using her function)
        this.createStartButton(stageWidth, stageHeight);

        this.layer.draw();
    }

    // --- TAKEN FROM HERS: The fancy wooden sign button ---
    private createStartButton(stageWidth: number, stageHeight: number): void {
        const buttonWidth = Math.min(stageWidth * 0.25, 300);
        const buttonHeight = Math.min(stageHeight * 0.08, 60);
        
        const buttonGroup = new Konva.Group({
            x: (stageWidth - buttonWidth) / 2,
            y: stageHeight * 0.6
        });

        // Sign board
        const board = new Konva.Rect({
            width: buttonWidth,
            height: buttonHeight,
            fill: '#a67c52',
            shadowColor: '#654321',
            shadowBlur: 8,
            shadowOffsetY: 3,
            shadowOpacity: 0.6
        });

        // Sign "arrow"
        const arrow = new Konva.Line({
            points: [
                buttonWidth, 0, // top right corner
                buttonWidth + buttonHeight / 2, buttonHeight / 2, // arrow tip
                buttonWidth, buttonHeight // bottom right corner
            ],
            fill: '#a67c52',
            closed: true,
            shadowOpacity: 0.5
        });

        // Sign post
        const post = new Konva.Rect({
            x: buttonWidth / 2 - 10, // center under the button
            y: buttonHeight,         // directly below the button
            width: 20,
            height: 150,
            fill: '#b5895a',
            shadowColor: '#654321',
            shadowBlur: 5,
            shadowOffsetY: 2,
            shadowOpacity: 0.5
        });

        const text = new Konva.Text({
            width: buttonWidth,
            height: buttonHeight,
            text: 'START GAME',
            fontSize: Math.min(stageWidth * 0.022, 28),
            fill: 'white',
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: 'bold',
            fontFamily: 'Press Start 2P' // Her font
        });

        buttonGroup.add(board);
        buttonGroup.add(arrow);
        buttonGroup.add(text);
        buttonGroup.add(post);

        // This click logic is identical to yours
        buttonGroup.on('click', () => {
            if (this.username.trim() === '') {
                alert('Please enter a name!');
                return;
            }
            this.cleanup();
            this.onLogin(this.username.trim());
        });

        // Her hover effects
        buttonGroup.on('mouseenter', () => {
            this.stage.container().style.cursor = 'pointer';
            board.shadowBlur(20);
            board.shadowOpacity(0.9);
            board.shadowColor('#ffdd77');
            this.layer.draw();
        });

        buttonGroup.on('mouseleave', () => {
            this.stage.container().style.cursor = 'default';
            board.shadowBlur(8);
            board.shadowOpacity(0.6);
            board.shadowColor('#654321');
            this.layer.draw();
        });

        this.layer.add(buttonGroup);
        // this.stage.add(this.layer); // This line from her code is redundant, layer is already on stage
    }

    // --- TAKEN FROM YOURS: All your logic functions remain identical ---
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