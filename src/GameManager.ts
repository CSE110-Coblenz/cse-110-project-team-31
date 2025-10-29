import Konva from 'konva';
import { GamePhase, PlayerState, MinigameResult } from './types';
import { ConfigManager } from './config';
import { BakingMinigame } from './BakingMinigame';
import { CleaningMinigame } from './CleaningMinigame';
import { HowToPlayScreen } from './HowToPlayScreen';
import { OrderScreen } from './OrderScreen';
import { ShoppingScreen } from './ShoppingScreen';
import { DaySummaryScreen } from './DaySummaryScreen';
import { LoginScreen } from './LoginScreen'; 
import { RecipeBookScreen } from './RecipeBookScreen';

export class GameManager {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private currentPhase: GamePhase;
    private previousPhase: GamePhase; // <-- We use this to go "back"
    private player: PlayerState;
    private config = ConfigManager.getInstance().getConfig();
    private currentMinigame: BakingMinigame | null = null;
    private currentCleaningMinigame: CleaningMinigame | null = null; 
    private backgroundImage: Konva.Image | null = null;
    private daySales: number = 0;
    private dayExpenses: number = 0;

    // This is your recipe for 1 cookie
    private cookieRecipe: Map<string, number> = new Map([
        ['Flour', 3],
        ['Sugar', 1],
        ['Butter', 1],
        ['Chocolate', 1],
        ['Baking Soda', 1]
    ]);

    constructor(container: HTMLDivElement) {
        this.stage = new Konva.Stage({
            container: container,
            width: container.offsetWidth,
            height: container.offsetHeight
        });

        this.layer = new Konva.Layer();
        this.stage.add(this.layer);

        this.currentPhase = GamePhase.LOGIN;
        this.previousPhase = GamePhase.LOGIN;
        this.player = {
            username: '',
            funds: this.config.startingFunds,
            ingredients: new Map<string, number>(),
            breadInventory: [],
            maxBreadCapacity: this.config.maxBreadCapacity,
            currentDay: 1,
            dishesToClean: 0
        };
            
        window.addEventListener('resize', () => {
            this.handleResize(container);
        });

        this.loadBackground();
    }

    private handleResize(container: HTMLDivElement): void {
        this.stage.width(container.offsetWidth);
        this.stage.height(container.offsetHeight);
        if (this.backgroundImage) {
            this.backgroundImage.width(this.stage.width());
            this.backgroundImage.height(this.stage.height());
        }
        this.renderCurrentPhase();
    }

    private loadBackground(): void { 
        const imageObj = new Image();
        imageObj.onload = () => {
            this.backgroundImage = new Konva.Image({
                x: 0,
                y: 0,
                image: imageObj,
                width: this.stage.width(),
                height: this.stage.height(),
                opacity: 0.3
            });
            this.renderCurrentPhase();
        };
        imageObj.onerror = () => {
            console.error('Failed to load background image');
            this.renderCurrentPhase();
        };
        imageObj.src = '/background1.jpg';
    }

    private renderCurrentPhase(): void {
        this.layer.destroyChildren();

        if (this.backgroundImage) {
            this.layer.add(this.backgroundImage);
        }

        switch (this.currentPhase) {
            case GamePhase.LOGIN:
                new LoginScreen(this.stage, this.layer, (username) => {
                    this.player.username = username;
                    this.previousPhase = GamePhase.LOGIN;
                    this.currentPhase = GamePhase.HOW_TO_PLAY;
                    this.renderCurrentPhase();
                });
                break;
            case GamePhase.HOW_TO_PLAY:  
                new HowToPlayScreen(this.stage, this.layer, () => {
                    this.previousPhase = GamePhase.HOW_TO_PLAY;
                    this.currentPhase = GamePhase.ORDER;
                    this.renderCurrentPhase();
                });
                break;
            case GamePhase.ORDER:
                new OrderScreen(
                    this.stage, 
                    this.layer, 
                    this.player.currentDay, 
                    () => { // onContinue
                        this.previousPhase = GamePhase.ORDER;
                        // --- THIS IS THE FIX ---
                        // Go directly to Shopping
                        this.currentPhase = GamePhase.SHOPPING; 
                        this.renderCurrentPhase();
                    }
                );
                break;
            case GamePhase.SHOPPING:
                this.renderShoppingPhase();
                break;
            
            case GamePhase.RECIPE_BOOK:
                new RecipeBookScreen(
                    this.stage,
                    this.layer,
                    this.player.ingredients,
                    () => { // onClose
                        // --- THIS IS THE FIX ---
                        // Go back to whatever screen you were on (Shopping)
                        this.currentPhase = this.previousPhase;
                        this.renderCurrentPhase();
                    }
                );
                break;
            
            case GamePhase.BAKING:
                this.renderBakingPhase();
                break;
            case GamePhase.CLEANING:
                this.renderCleaningPhase();
                break;
            case GamePhase.DAY_SUMMARY:
                this.renderDaySummaryPhase();
                break;
            case GamePhase.GAME_OVER:
                this.renderGameOverPhase();
                break;
        }

        this.layer.draw();
    }

    private renderShoppingPhase(): void {
        this.daySales = 0;
        this.dayExpenses = 0;
        
        new ShoppingScreen(
            this.stage,
            this.layer,
            this.player.funds,
            this.player.currentDay,
            (purchases, totalCost) => {
                // onPurchaseComplete callback
                this.player.funds -= totalCost;
                this.dayExpenses += totalCost;
                
                purchases.forEach((qty, name) => {
                    const current = this.player.ingredients.get(name) || 0;
                    this.player.ingredients.set(name, current + qty);
                });
                
                this.previousPhase = GamePhase.SHOPPING;
                if (this.canMakeCookies()) {
                    this.currentPhase = GamePhase.BAKING;
                } else {
                    alert('You don\'t have enough ingredients to make even one cookie! Go wash dishes.');
                    this.currentPhase = GamePhase.CLEANING;
                }
                this.renderCurrentPhase();
            },
            // --- THIS IS THE FIX ---
            // Add the onViewRecipe callback
            () => { // onViewRecipe
                this.previousPhase = GamePhase.SHOPPING;
                this.currentPhase = GamePhase.RECIPE_BOOK;
                this.renderCurrentPhase();
            }
        );
    }

    private onBakingComplete(result: MinigameResult): void {
        if (this.currentMinigame) {
            this.currentMinigame.cleanup();
            this.currentMinigame = null;
        }

        const cookiesMade = result.correctAnswers; 
        const revenue = cookiesMade * this.config.cookiePrice;
        
        this.player.funds += revenue;
        this.daySales += revenue;
        this.player.dishesToClean = cookiesMade;
        
        this.previousPhase = GamePhase.BAKING;
        this.currentPhase = GamePhase.CLEANING;
        this.renderCurrentPhase();
    }

    private canMakeCookies(): boolean {
        let canMake = true;
        this.cookieRecipe.forEach((needed, ingredient) => {
            if ((this.player.ingredients.get(ingredient) || 0) < needed) {
                canMake = false;
            }
        });
        return canMake;
    }

    private canMakeOneCookie(): boolean {
        const hasIngredients = this.canMakeCookies();
        
        if (hasIngredients) {
            this.cookieRecipe.forEach((needed, ingredient) => {
                const current = this.player.ingredients.get(ingredient) || 0;
                this.player.ingredients.set(ingredient, current - needed);
            });
            return true;
        }
        
        return false;
    }

    private renderBakingPhase(): void {
        this.layer.destroyChildren();
        
        if (this.backgroundImage) {
            this.layer.add(this.backgroundImage);
        }

        this.currentMinigame = new BakingMinigame(
            this.stage,
            this.layer,
            (result) => this.onBakingComplete(result),
            () => this.canMakeOneCookie()
        );
    }

    private onCleaningComplete(result: MinigameResult): void {
        if (this.currentCleaningMinigame) {
            this.currentCleaningMinigame.cleanup();
            this.currentCleaningMinigame = null;
        }

        const dishesNotCleaned = this.player.dishesToClean - result.correctAnswers;
        
        if (dishesNotCleaned > 0) {
            const penalty = dishesNotCleaned * 10;
            this.player.funds -= penalty;
            this.dayExpenses += penalty;
        }

        this.player.currentDay++;
        
        this.previousPhase = GamePhase.CLEANING;
        this.currentPhase = GamePhase.DAY_SUMMARY;
        this.renderCurrentPhase();
    }

    private renderDaySummaryPhase(): void {
        new DaySummaryScreen(
            this.stage,
            this.layer,
            this.player.currentDay - 1,
            this.daySales,
            this.dayExpenses,
            this.player.funds,
            () => {
                this.previousPhase = GamePhase.DAY_SUMMARY;
                if (this.player.funds >= this.config.winThreshold) {
                    this.currentPhase = GamePhase.GAME_OVER;
                } else if (this.player.funds <= this.config.bankruptcyThreshold) {
                    this.currentPhase = GamePhase.GAME_OVER;
                } else {
                    this.currentPhase = GamePhase.ORDER;
                }
                this.renderCurrentPhase();
            }
        );
    }

    private renderCleaningPhase(): void {
        this.layer.destroyChildren();
        
        if (this.backgroundImage) {
            this.layer.add(this.backgroundImage);
        }

        this.currentCleaningMinigame = new CleaningMinigame(
            this.stage,
            this.layer,
            this.player.dishesToClean,
            (result) => this.onCleaningComplete(result)
        );
    }

    private renderGameOverPhase(): void {
        const won = this.player.funds >= this.config.winThreshold;
        
        const title = new Konva.Text({
            x: 200,
            y: 200,
            text: won ? 'YOU WIN!' : 'BANKRUPT!',
            fontSize: 50,
            fill: won ? 'green' : 'red'
        });
        this.layer.add(title);

        const info = new Konva.Text({
            x: 200,
            y: 280,
            text: `Final Funds: $${this.player.funds.toFixed(2)}\nDays Survived: ${this.player.currentDay}`,
            fontSize: 24,
            fill: 'black'
        });
        this.layer.add(info);
    }

    private createButton(x: number, y: number, text: string, onClick: () => void) {
        const group = new Konva.Group({ x, y });
        const rect = new Konva.Rect({
            width: 200,
            height: 50,
            fill: '#4CAF50',
            cornerRadius: 5
        });
        const label = new Konva.Text({
            width: 200,
            height: 50,
            text: text,
            fontSize: 20,
            fill: 'white',
            align: 'center',
            verticalAlign: 'middle'
        });
        group.add(rect);
        group.add(label);
        group.on('mouseenter', () => {
            this.stage.container().style.cursor = 'pointer';
            rect.fill('#45a049');
            this.layer.draw();
        });
        group.on('mouseleave', () => {
            this.stage.container().style.cursor = 'default';
            rect.fill('#4CAF50');
            this.layer.draw();
        });
        group.on('click', onClick);
        return { group, rect, label };
    }
}