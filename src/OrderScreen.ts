import Konva from 'konva';

export class OrderScreen {
    private layer: Konva.Layer;
    private stage: Konva.Stage;
    private onContinue: () => void;
    private currentDay: number;

    constructor(stage: Konva.Stage, layer: Konva.Layer, currentDay: number, onContinue: () => void) {
        this.stage = stage;
        this.layer = layer;
        this.currentDay = currentDay;
        this.onContinue = onContinue;
        this.setupUI();
    }

    private setupUI(): void {
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();

        // Title
        const title = new Konva.Text({
            x: stageWidth * 0.1,
            y: stageHeight * 0.1,
            width: stageWidth * 0.8,
            // text: `Day ${this.currentDay} - Today's Orders`,
            fontSize: Math.min(stageWidth * 0.045, 54),
            fontStyle: 'bold',
            fill: 'black',
            align: 'center'
        });
        this.layer.add(title);

        // Load owl image (left side)
        this.loadOwlImage(stageWidth, stageHeight);

        // Load order placeholder image (right side)
        this.loadOrderPlaceholder(stageWidth, stageHeight);



        // Add continue button HERE at the end
        // this.createContinueButton(stageWidth, stageHeight);

        this.layer.draw();
    }

    private loadOwlImage(stageWidth: number, stageHeight: number): void {
    const imageObj = new Image();
    imageObj.onload = () => {
        const owl = new Konva.Image({
            x: stageWidth * 0.05,
            y: stageHeight * 0.4,
            image: imageObj,
            width: stageWidth * 0.25,
            height: stageWidth * 0.25  // Keep aspect ratio square
        });
        this.layer.add(owl);
        this.layer.draw();
    };
    imageObj.src = '/owl.png';  // Put owl.png in /public folder
    }

    private loadOrderPlaceholder(stageWidth: number, stageHeight: number): void {
    const imageObj = new Image();
    imageObj.onload = () => {
        const placeholder = new Konva.Image({
            x: stageWidth * 0.45,
            y: stageHeight * 0.15,
            image: imageObj,
            width: stageWidth * 0.45,
            height: stageHeight * 0.7
        });
        this.layer.add(placeholder);
        
        // Add text AFTER image is added (so text is on top)
        this.createOrderText(stageWidth, stageHeight);
        this.createContinueButton(stageWidth, stageHeight);
        
        this.layer.draw();
    };
    imageObj.onerror = () => {
        // Fallback rectangle
        const fallbackRect = new Konva.Rect({
            x: stageWidth * 0.45,
            y: stageHeight * 0.15,
            width: stageWidth * 0.45,
            height: stageHeight * 0.7,
            fill: 'white',
            stroke: '#ccc',
            strokeWidth: 2
        });
        this.layer.add(fallbackRect);
        this.createOrderText(stageWidth, stageHeight);
        this.layer.draw();
    };
    imageObj.src = '/order.png';
}


    private createOrderText(stageWidth: number, stageHeight: number): void {
        const baseX = stageWidth * 0.48;
        let currentY = stageHeight * 0.18;

        // Title: COOKIE TRAILER TYCOON
        const gameTitle = new Konva.Text({
            x: baseX,
            y: currentY,
            width: stageWidth * 0.4,
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
            x: baseX,
            y: currentY,
            width: stageWidth * 0.4,
            text: "TODAY'S ORDERS",
            fontSize: Math.min(stageWidth * 0.018, 22),
            fill: 'black',
            align: 'center'
        });
        this.layer.add(ordersTitle);
        currentY += stageHeight * 0.04;

        // DAY X
        const dayText = new Konva.Text({
            x: baseX,
            y: currentY,
            width: stageWidth * 0.4,
            text: `DAY ${this.currentDay}`,
            fontSize: Math.min(stageWidth * 0.015, 18),
            fill: 'black',
            align: 'center'
        });
        this.layer.add(dayText);
        currentY += stageHeight * 0.04;

        // Separator line
        const separator = new Konva.Text({
            x: baseX,
            y: currentY,
            width: stageWidth * 0.4,
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
                x: baseX + stageWidth * 0.02,
                y: currentY,
                width: stageWidth * 0.36,
                text: `${i}. CUSTOMER ${i}                    ${cookieCount} COOKIES`,
                fontSize: Math.min(stageWidth * 0.014, 16),
                fill: 'black'
            });
            this.layer.add(customerOrder);
            currentY += stageHeight * 0.06;
        }

        currentY += stageHeight * 0.02;

        // Total
        const total = new Konva.Text({
            x: baseX,
            y: currentY,
            width: stageWidth * 0.4,
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
            y: stageHeight * 0.75
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
            text: 'CONTINUE',
            fontSize: Math.min(stageWidth * 0.022, 28),
            fill: 'white',
            align: 'center',
            verticalAlign: 'middle',
            fontStyle: 'bold'
        });

        buttonGroup.add(rect);
        buttonGroup.add(text);

        buttonGroup.on('click', this.onContinue);
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

    public cleanup(): void {
        // Cleanup if needed
    }
}