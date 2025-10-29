import Konva from 'konva';

export class OrderScreen {
    private layer: Konva.Layer;
    private stage: Konva.Stage;
    private onContinue: () => void;
    // Removed onViewRecipe callback
    private currentDay: number;

    constructor(
        stage: Konva.Stage, 
        layer: Konva.Layer, 
        currentDay: number, 
        onContinue: () => void
        // Removed onViewRecipe callback
    ) {
        this.stage = stage;
        this.layer = layer;
        this.currentDay = currentDay;
        this.onContinue = onContinue;
        this.setupUI();
    }

    private setupUI(): void {
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();

        // Title (Leave as is)
        const title = new Konva.Text({
            x: stageWidth * 0.1,
            y: stageHeight * 0.1,
            width: stageWidth * 0.8,
            fontSize: Math.min(stageWidth * 0.045, 54),
            fontStyle: 'bold',
            fill: 'black',
            align: 'center'
        });
        this.layer.add(title);

        // Load images - Buttons will be created inside these load functions now
        this.loadOwlImage(stageWidth, stageHeight);
        this.loadOrderPlaceholder(stageWidth, stageHeight); 

        // --- REMOVED Button creation calls from here ---

        this.layer.draw(); // Initial draw without buttons
    }

    private loadOwlImage(stageWidth: number, stageHeight: number): void {
        const imageObj = new Image();
        imageObj.onload = () => {
            const owl = new Konva.Image({
                x: stageWidth * 0.05,
                y: stageHeight * 0.4 - (stageWidth * 0.25 / 2), // Center vertically a bit more
                image: imageObj,
                width: stageWidth * 0.25,
                height: stageWidth * 0.25
            });
            this.layer.add(owl);
            this.layer.draw();
        };
        imageObj.src = '/owl.png';
    }

    private loadOrderPlaceholder(stageWidth: number, stageHeight: number): void {
        const imageObj = new Image();
        
        const createContentAndButtons = () => {
            // Create text content first
            this.createOrderText(stageWidth, stageHeight);
            
            // --- MOVED Button creation HERE ---
            // Create buttons AFTER the placeholder image/rect is added
            this.createContinueButton(stageWidth, stageHeight); 
            // We removed the recipe button from this screen
            
            this.layer.batchDraw(); // Use batchDraw for efficiency
        };

        imageObj.onload = () => {
            const placeholder = new Konva.Image({
                x: stageWidth * 0.45,
                y: stageHeight * 0.15,
                image: imageObj,
                width: stageWidth * 0.45,
                height: stageHeight * 0.7
            });
            this.layer.add(placeholder);
            createContentAndButtons(); // Create text and buttons on top
        };
        imageObj.onerror = () => {
            // Fallback rectangle if image fails
            const fallbackRect = new Konva.Rect({
                x: stageWidth * 0.45,
                y: stageHeight * 0.15,
                width: stageWidth * 0.45,
                height: stageHeight * 0.7,
                fill: '#FFF8DC', // Use a slightly parchment-like color
                stroke: '#ccc',
                strokeWidth: 2,
                cornerRadius: 10 // Add slight rounding
            });
            this.layer.add(fallbackRect);
            createContentAndButtons(); // Create text and buttons on top
        };
        imageObj.src = '/order.png';
    }


    private createOrderText(stageWidth: number, stageHeight: number): void {
        // Position relative to the order paper (assuming it starts at x=0.45, y=0.15)
        const paperX = stageWidth * 0.45;
        const paperY = stageHeight * 0.15;
        const paperWidth = stageWidth * 0.45;
        //const paperHeight = stageHeight * 0.7; // Not needed directly

        const textPadding = paperWidth * 0.05; // Padding inside the paper
        const textWidth = paperWidth - (textPadding * 2);
        
        let currentY = paperY + stageHeight * 0.03; // Start text lower

        // Title: COOKIE TRAILER TYCOON
        const gameTitle = new Konva.Text({
            x: paperX + textPadding,
            y: currentY,
            width: textWidth,
            text: 'COOKIE TRAILER TYCOON',
            fontSize: Math.min(stageWidth * 0.025, 30),
            fontStyle: 'bold',
            fill: '#FF6B35',
            align: 'center'
        });
        this.layer.add(gameTitle);
        currentY += stageHeight * 0.06;

        // TODAY'S ORDERS
        const ordersTitle = new Konva.Text({
            x: paperX + textPadding,
            y: currentY,
            width: textWidth,
            text: "TODAY'S ORDERS",
            fontSize: Math.min(stageWidth * 0.018, 22),
            fill: 'black',
            align: 'center'
        });
        this.layer.add(ordersTitle);
        currentY += stageHeight * 0.04;

        // DAY X
        const dayText = new Konva.Text({
            x: paperX + textPadding,
            y: currentY,
            width: textWidth,
            text: `DAY ${this.currentDay}`,
            fontSize: Math.min(stageWidth * 0.015, 18),
            fill: 'black',
            align: 'center'
        });
        this.layer.add(dayText);
        currentY += stageHeight * 0.04;

        // Separator line
        const separator = new Konva.Text({
            x: paperX + textPadding,
            y: currentY,
            width: textWidth,
            text: '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
            fontSize: Math.min(stageWidth * 0.012, 14),
            fill: 'black',
            align: 'center'
        });
        this.layer.add(separator);
        currentY += stageHeight * 0.05;

        // Generate 3 random customer orders
        let totalCookies = 0;
        for (let i = 1; i <= 3; i++) {
            const cookieCount = Math.floor(Math.random() * 50) + 50; // 50-99
            totalCookies += cookieCount;

            const customerOrder = new Konva.Text({
                x: paperX + textPadding + (textWidth * 0.05), // Indent slightly
                y: currentY,
                width: textWidth * 0.9, // Adjust width for indentation
                text: `${i}. CUSTOMER ${i}                    ${cookieCount} COOKIES`,
                fontSize: Math.min(stageWidth * 0.014, 16),
                fill: 'black',
                fontFamily: 'monospace' // Use monospace for better alignment
            });
            this.layer.add(customerOrder);
            currentY += stageHeight * 0.06;
        }

        currentY += stageHeight * 0.02;

        // Total
        const total = new Konva.Text({
            x: paperX + textPadding,
            y: currentY,
            width: textWidth,
            text: `TOTAL ........................ ${totalCookies} COOKIES`,
            fontSize: Math.min(stageWidth * 0.016, 18),
            fontStyle: 'bold',
            fill: 'black',
            align: 'center'
        });
        this.layer.add(total);
    }

    private createContinueButton(stageWidth: number, stageHeight: number): void {
        const buttonWidth = Math.min(stageWidth * 0.25, 300);
        const buttonHeight = Math.min(stageHeight * 0.08, 60);
        
        const buttonGroup = new Konva.Group({
            x: (stageWidth - buttonWidth) / 2, 
            y: (stageHeight * 0.15) + (stageHeight * 0.7) + (stageHeight * 0.02)
        });

        const rect = new Konva.Rect({
            width: buttonWidth,
            height: buttonHeight,
            fill: '#4CAF50',
            cornerRadius: 10,
            shadowColor: 'black',
            shadowBlur: 5,
            shadowOpacity: 0.4,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            // --- ADDED HIT FUNCTION ---
            hitFunc: (context, shape) => {
                // This draws the exact rectangle shape for hit detection
                context.beginPath();
                context.rect(0, 0, shape.width(), shape.height());
                context.closePath();
                context.fillStrokeShape(shape); // Use the shape's fill/stroke for hit
            }
        });

        const text = new Konva.Text({
            width: buttonWidth,
            height: buttonHeight,
            text: 'CONTINUE',
            fontSize: Math.min(stageWidth * 0.022, 28),
            fill: 'white',
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: 'bold',
            listening: false // Keep this false
        });

        buttonGroup.add(rect);
        buttonGroup.add(text);

        // Click event can stay on the group
        buttonGroup.on('click', this.onContinue); 

        // Keep hover effects attached to the visible rect
        rect.on('mouseenter', () => {
            this.stage.container().style.cursor = 'pointer';
            rect.fill('#45a049');
            this.layer.batchDraw();
        });
        rect.on('mouseleave', () => {
            this.stage.container().style.cursor = 'default';
            rect.fill('#4CAF50');
            this.layer.batchDraw();
        });

        this.layer.add(buttonGroup);
    }
    
    // --- REMOVED: createViewRecipeButton() function ---

    public cleanup(): void {
        // No listeners to remove in this version
    }
}
