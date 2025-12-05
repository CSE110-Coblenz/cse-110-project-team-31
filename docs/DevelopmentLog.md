# Development Log

## Progress Timeline

**Oct 26, 2025**  
- Initial design and planning of game loop and architecture.

**Oct 28, 2025**  
- Implemented TypeScript files with complete game flow and responsive UI system.  
- Integrated game phases successfully.

**Oct 29, 2025**  
- Successfully added baking process animation.
- Added view recipe button and screen

**Oct 29, 2025**
- Succesfully added UI for landing page

**Nov 1, 2025**
- Succesfully added Losing and Victory Screens

**Nov 5, 2025**
- Succesfully added Exit button in UI so that player can exit game anytime.
- Completed UI for demand and end of day summary pages
- Added a new day animation

**Nov 6, 2025**
- Added storyline of the game

**Nov 10, 2025**
- Added Info button to access instuctions throughout the game

**Nov 11, 2025**
- Updated ShoppingScreen UI and logic.

**Nov 14, 2025**
- Fixed minigame logic, increased timer for minigames to reduce difficulty.
- Added to HowToPlay instructions for clarity, improved UI.

**Nov 16, 2025**
- Added test files, improving coverage to 81% line coverage and 62% branch coverage.

**Nov 19, 2025**
- Added fixes to ShoppingScreen UI, new functionality to UI.
- Added background music.
- Modified UI for VictoryScreen (background image, confetti), and LoseScreen

**Nov 21, 2025**
- Added functionality to save user inputs on ShoppingScreen to prevent reset.
- Added winning goal to Storyline for clarity.
- Added progress bar to DaySummary.

**Nov 23, 2025**
- Fixed test files to reach 

**Nov 25, 2025**
- Added pop ups post-minigame to give users feedback on incorrect answers.
- Fixes to UI to maintain uniformity (Login, HowToPlay, Storyline, Shopping, DaySummary).
- Modified cookie demand to be able to purchase all ingredients using starting balance.

**Nov 29, 2025**
- Fixed bugs in sequencing after OrderScreen.
- Modifications to UI, added animations to Storyline.
- Fixes to broken tests (73% branch coverage, 87% line coverage).

**Dec 1, 2025**
- Added volume slider and adjusted UI.
- Added volumne button to house volume slider on pages without a help button.
- Fixed broken tests (75.7% branch coverage 89.4% line coverage).
- Added .md files explaining code base & test files.
- Added favicon

**Dec 3, 2025**
- Deployed to GitHub Pages.

---

## Bugs Fixed
- Background images not displaying on minigame screens.  
- Purchase button malfunction during shopping phase.  
- Cursor cleanup memory leaks.  
- Ingredient checking logic corrected.
- Implement proper Lose Screen trigger conditions.
- Reduce size of hitbox for “View Recipe” button.  
- Display resizing during baking phase causes game reset.  
- Expand on How to Play instructions .
- Image sizing and placement issues on Order Screen.  
- Screen does not resize in Cleaning minigame screen.
- Exit button doesn't appear in cleaning minigame before starting game screen.
- Baking animation not working.
- Minigame 2 number of problems to solve seems to depend on something, this varies.
- Fix alignment on minigame.
- Fix timer on minigame.
- Make animations slower.
- Make tips more visible (how much they have earned) in minigame.
- Fix timer position in minigame.
- When buying ingredients store what player have inout so far so it doesn't disappear when they view recipe.

---

## Features Implemented
- Fully responsive UI scaling with window size.  
- Background image system with transparency.  
- Keyboard input handling with visual cursor feedback.  
- Asynchronous configuration loading from text files.  
- Real-time ingredient tracking and consumption.  
- Financial tracking: sales, expenses, profit.
- Login page implementation.
- Cookie recipe dedicated screen.
- Win/Lose screen system.
- Help/Info button system.   
- Exit button system  
- Audio system and background music.    
- Adjustable volume.
- Owl speech bubble on Order Screen.  
- Add another animation before cleaning minigame
