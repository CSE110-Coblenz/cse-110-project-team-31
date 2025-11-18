import Konva from 'konva';
import { ExitButton } from './ui/ExitButton';
import { InfoButton } from './ui/InfoButton';

export class OrderScreen {
    private layer: Konva.Layer;
    private stage: Konva.Stage;
    private onContinue: (totalDemand: number, customerOrders: Array<{customerNum: number, cookieCount: number}>) => void;
    private currentDay: number;
    private reputation: number; 
    private totalDemand: number = 0;
    private customerOrders: Array<{customerNum: number, cookieCount: number}> = [];
    private rootGroup: Konva.Group | null = null;

    constructor(
        stage: Konva.Stage, 
        layer: Konva.Layer, 
        currentDay: number, 
        reputation: number, 
        onContinue: (totalDemand: number, customerOrders: Array<{customerNum: number, cookieCount: number}>) => void
    ) {
        this.stage = stage;
        this.layer = layer; // <-- FIX: store the layer reference
        this.currentDay = currentDay;
        this.reputation = reputation; 
        this.onContinue = onContinue;

        this.setupUI();
    }

    private setupUI(): void {
        const stageWidth = this.stage.width();
        const stageHeight = this.stage.height();

        // Root group to contain everything this screen creates so cleanup is easy
        this.rootGroup = new Konva.Group({ x: 0, y: 0 });
        this.layer.add(this.rootGroup);

        // Load owl image then build receipt + button
        this.loadOwlImage(stageWidth, stageHeight, () => {
            this.createReceiptGroup(stageWidth, stageHeight);
            this.createContinueButton(stageWidth, stageHeight);
            this.layer.batchDraw();
        });

        // Exit & Info buttons (these create their own nodes on the provided layer)
        new ExitButton(this.stage, this.layer, () => {
            this.cleanup();
            window.location.href = '/login.html';
        });
        new InfoButton(this.stage, this.layer);

        // Ensure we draw initial state
        this.layer.batchDraw(); 
    }

    private loadOwlImage(stageWidth: number, stageHeight: number, onLoad: () => void): void {
        const imageObj = new Image();
        imageObj.onload = () => {
            const aspectRatio = imageObj.width / imageObj.height || 1;
            const owlWidth = stageWidth * 0.35;
            const owlHeight = owlWidth / aspectRatio;

            const owl = new Konva.Image({
                x: stageWidth * 0.1,
                y: stageHeight * 0.6 - (stageWidth * 0.25 / 2), 
                image: imageObj,
                width: owlWidth,
                height: owlHeight
            });

            if (this.rootGroup) this.rootGroup.add(owl);
            else this.layer.add(owl);

            this.layer.batchDraw();
            onLoad();
        };
        imageObj.onerror = () => {
            console.warn('Failed to load /order-owl.png — using placeholder.');
            // placeholder rectangle so layout still works
            const placeholder = new Konva.Rect({
                x: stageWidth * 0.1,
                y: stageHeight * 0.6 - (stageWidth * 0.25 / 2),
                width: stageWidth * 0.35,
                height: stageWidth * 0.35 * 0.8,
                fill: '#eee',
                stroke: '#ccc',
                cornerRadius: 8
            });
            if (this.rootGroup) this.rootGroup.add(placeholder);
            else this.layer.add(placeholder);
            this.layer.batchDraw();
            onLoad();
        };
        imageObj.src = '/order-owl.png';
    }

    private createReceiptGroup(stageWidth: number, stageHeight: number): void {
        const imageObj = new Image();
        imageObj.onload = () => {
            const aspectRatio = (imageObj.width / imageObj.height) || 1;
            const receiptWidth = stageWidth * 0.3;
            const receiptHeight = receiptWidth / aspectRatio;
            const MAX_CUSTOMER_LINES = 7;

            const V_PAD_HEADER = receiptHeight * 0.05;
            const V_STEP_ORDER = receiptHeight * 0.035;

            const X_PAD_LEFT = receiptWidth * 0.1;
            const X_PAD_RIGHT = receiptWidth * 0.7;

            const receiptGroup = new Konva.Group({
                x: stageWidth * 0.6,
                y: stageHeight * 0.15,
            });
            
            const receipt = new Konva.Image({
                image: imageObj,
                width: receiptWidth,
                height: receiptHeight
            });
            receiptGroup.add(receipt);

            let currentY = receiptHeight * 0.14; 

            const dayText = new Konva.Text({
                x: receiptWidth * 0.1,
                y: currentY,
                width: receiptWidth * 0.8,
                text: `DAY ${this.currentDay}`,
                fontSize: Math.min(stageWidth * 0.015, 18),
                fill: 'black',
                align: 'center',
                fontFamily: 'Doto',
                fontStyle: 'bold'
            });
            receiptGroup.add(dayText);
            
            currentY += stageHeight * 0.04;

            // --- Generate and Store Customer Orders ---
            this.totalDemand = 0;
            this.customerOrders = [];

            const rawNumCustomers = Math.floor((Math.random() * 6 + 5) * this.reputation);
            const numCustomers = Math.min(MAX_CUSTOMER_LINES, Math.max(1, rawNumCustomers)); 
            
            const fontSize = Math.min(stageWidth * 0.013, 15);

            for (let i = 1; i <= numCustomers; i++) {
                const cookieCount = Math.max(1, Math.floor((Math.random() * 31 + 6) * this.reputation));
                this.totalDemand += cookieCount;
                
                this.customerOrders.push({
                    customerNum: i,
                    cookieCount: cookieCount
                });

                const customerName = new Konva.Text({
                    x: X_PAD_LEFT,
                    y: currentY,
                    text: `${i}. CUSTOMER ${i}`,
                    fontSize: fontSize,
                    fontFamily: 'Doto',
                    fill: 'black'
                });
                receiptGroup.add(customerName);
                
                const cookieCountText = new Konva.Text({
                    x: X_PAD_RIGHT, 
                    y: currentY,
                    width: receiptWidth * 0.2, 
                    text: `${cookieCount} COOKIES`,
                    fontSize: fontSize, 
                    fill: 'black',
                    fontFamily: 'Doto',
                    align: 'right'
                });
                receiptGroup.add(cookieCountText);
                currentY += V_STEP_ORDER;
            }
            
            const totalY = currentY + V_PAD_HEADER * 0.5; 

            const totalText = new Konva.Text({
                x: receiptWidth * 0.1,
                y: totalY,
                width: receiptWidth * 0.8,
                text: `TOTAL: ${this.totalDemand} COOKIES`,
                fontSize: Math.min(stageWidth * 0.016, 18),
                fontStyle: 'bold',
                fontFamily: 'Doto',
                fill: 'black',
                align: 'center'
            });
            receiptGroup.add(totalText);

            // Add to rootGroup so cleanup can remove everything at once
            if (this.rootGroup) this.rootGroup.add(receiptGroup);
            else this.layer.add(receiptGroup);

            this.layer.batchDraw();
        };

        imageObj.onerror = () => {
            console.warn('Failed to load start-receipt.png — rendering textual receipt fallback.');

            // fallback: draw a simple receipt rectangle and textual content even without an image
            const receiptWidth = stageWidth * 0.3;
            const receiptHeight = stageHeight * 0.5;
            const receiptGroup = new Konva.Group({
                x: stageWidth * 0.6,
                y: stageHeight * 0.15,
            });

            const fallbackRect = new Konva.Rect({
                width: receiptWidth,
                height: receiptHeight,
                fill: '#fff',
                stroke: '#ddd',
                cornerRadius: 8
            });
            receiptGroup.add(fallbackRect);

            let currentY = 20;
            const dayText = new Konva.Text({
                x: 0,
                y: currentY,
                width: receiptWidth,
                text: `DAY ${this.currentDay}`,
                fontSize: Math.min(stageWidth * 0.015, 18),
                fill: 'black',
                align: 'center',
                fontStyle: 'bold'
            });
            receiptGroup.add(dayText);
            currentY += 40;

            // regenerate orders here to match onload branch
            this.totalDemand = 0;
            this.customerOrders = [];
            const MAX_CUSTOMER_LINES = 7;
            const rawNumCustomers = Math.floor((Math.random() * 6 + 5) * this.reputation);
            const numCustomers = Math.min(MAX_CUSTOMER_LINES, Math.max(1, rawNumCustomers)); 

            for (let i = 1; i <= numCustomers; i++) {
                const cookieCount = Math.max(1, Math.floor((Math.random() * 31 + 6) * this.reputation));
                this.totalDemand += cookieCount;
                this.customerOrders.push({ customerNum: i, cookieCount });

                const line = new Konva.Text({
                    x: 8,
                    y: currentY,
                    width: receiptWidth - 16,
                    text: `${i}. CUSTOMER ${i} — ${cookieCount} COOKIES`,
                    fontSize: Math.min(stageWidth * 0.012, 14),
                    fill: 'black'
                });
                receiptGroup.add(line);
                currentY += 22;
            }

            const totalText = new Konva.Text({
                x: 0,
                y: currentY + 10,
                width: receiptWidth,
                text: `TOTAL: ${this.totalDemand} COOKIES`,
                fontSize: Math.min(stageWidth * 0.016, 16),
                fontStyle: 'bold',
                align: 'center',
                fill: 'black'
            });
            receiptGroup.add(totalText);

            if (this.rootGroup) this.rootGroup.add(receiptGroup);
            else this.layer.add(receiptGroup);

            this.layer.batchDraw();
        };

        imageObj.src = '/start-receipt.png';
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
            hitFunc: (context, shape) => {
                context.beginPath();
                context.rect(0, 0, shape.width(), shape.height());
                context.closePath();
                context.fillStrokeShape(shape); 
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
            listening: false 
        });

        buttonGroup.add(rect);
        buttonGroup.add(text);
        
        // Prevent double-click / double-submit
        let clicked = false;
        buttonGroup.on('click', () => {
            if (clicked) return;
            clicked = true;
            rect.fill('#2e7d32');
            this.layer.batchDraw();

            // send a shallow copy to be safe
            const ordersCopy = this.customerOrders.map(o => ({ ...o }));
            try {
                this.onContinue(this.totalDemand, ordersCopy);
            } catch (err) {
                console.error('Error in onContinue callback:', err);
                clicked = false; // allow retry if callback fails
            }
        }); 

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

        if (this.rootGroup) this.rootGroup.add(buttonGroup);
        else this.layer.add(buttonGroup);
    }
    
    public cleanup(): void {
        // Remove everything created by this screen
        if (this.rootGroup) {
            try {
                this.rootGroup.remove();
            } catch (e) {
                console.warn('Error removing rootGroup during cleanup:', e);
            }
            this.rootGroup = null;
        }
        // Ensure a redraw so the layer shows the current state after cleanup
        try {
            this.layer.batchDraw();
        } catch (e) {
            // ignore if layer already destroyed
        }
    }
}