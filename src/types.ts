export enum GamePhase {
    LOGIN,
    HOW_TO_PLAY,
    ORDER, 
    SHOPPING,
    RECIPE_BOOK, // <-- Add this new phase
    BAKING,
    // SELLING,
    CLEANING,
    DAY_SUMMARY,
    GAME_OVER
}

export interface Ingredient {
    name: string;
    price: number;
    quantity: number;
}

// This is the single, corrected PlayerState interface
export interface PlayerState {
    username: string;
    funds: number;
    ingredients: Map<string, number>;
    breadInventory: Bread[]; // This is fine, even if you make cookies.
    maxBreadCapacity: number;
    currentDay: number;
    dishesToClean: number;
}

export interface Bread {
    quality: number; // 0-100
    quantity: number;
}

export interface GameConfig {
    startingFunds: number;
    winThreshold: number;
    bankruptcyThreshold: number;
    flourPriceMin: number;
    flourPriceMax: number;
    bakingTime: number;
    cleaningTime: number;
    maxBreadCapacity: number;
    divisionProblems: number;
    multiplicationProblems: number;
    cookiePrice: number;
}

export interface MinigameResult {
    correctAnswers: number;
    totalProblems: number;
    timeRemaining: number;
}
