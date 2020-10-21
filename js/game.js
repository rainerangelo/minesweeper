/**
 * This file acts as a bridge between the web page (index.html) and the Minesweeper game engine
 * (msgame.js). Not only does it create the game, but it also communicates the user's actions with
 * the game engine to make the game functional.
 *
 * Author: Rainer Lim
 */
"use strict";

// Once the whole page loads, enter the main function of this file
window.addEventListener('load', main);

// These are the available difficulty levels for this game
const DIFFICULTY_EASY   = [  'Easy',  8, 10, 10];
const DIFFICULTY_MEDIUM = ['Medium', 14, 18, 40];
const DIFFICULTY_HARD   = [  'Hard', 20, 24, 99];

const DIFFICULTY_LIST = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD];

// These are to indicate whether or not a move was safe
const SAFE_MOVE = 0;
const UNSAFE_MOVE = 1;

// Set a max number of columns for mobile devices to prevent grid from being too small
const MAX_NUMBER_OF_COLUMNS_FOR_MOBILE = 8;

/**
 * This helper function is to determine if a mobile device is being used. If so, use
 * MAX_NUMBER_OF_COLUMNS_FOR_MOBILE to restrict grid size. Otherwise, use regular sizes from
 * available difficulty levels.
 * @param {MSGame} game The game object with which this file communicates
 * @param {Number} number_of_rows Number of rows for the grid
 * @param {Number} number_of_cols Number of columns for the grid
 * @param {Number} number_of_mines Number of mines for the grid
 */
function helper_init(game, number_of_rows, number_of_cols, number_of_mines) {

    // Media query for extra small devices (phones, 600px and down)
    let media_query = window.matchMedia('(max-width: 600px)');

    if (media_query.matches) {
        let total = number_of_rows * number_of_cols;

        // This is to ensure total squares can be divided exactly (without remainder) by
        // MAX_NUMBER_OF_COLUMNS_FOR_MOBILE
        total += total % MAX_NUMBER_OF_COLUMNS_FOR_MOBILE;

        game.init(total / MAX_NUMBER_OF_COLUMNS_FOR_MOBILE, MAX_NUMBER_OF_COLUMNS_FOR_MOBILE, number_of_mines);
    }
    else {

        // Initialize game normally if not using an extra small device
        game.init(number_of_rows, number_of_cols, number_of_mines);
    }
}

/**
 * This function grabs rendering data from the game object and uses it to display the grid on the
 * web page.
 *
 * Button creation was inspired by code provided by Emmanuel Onu (TA).
 * @param {MSGame} game The game object with which this file communicates
 */
function render_grid(game) {

    // Grab rendering data from the game object
    let rendering = game.getRendering().join('');

    let number_of_rows = game.nrows;
    let number_of_cols = game.ncols;

    let grid = document.getElementById('grid');
    let button_size = grid.clientWidth / number_of_cols;

    grid.innerHTML = '';

    grid.style.gridTemplateRows = `repeat(${number_of_rows}, ${button_size}px)`;
    grid.style.gridTemplateColumns = `repeat(${number_of_cols}, ${button_size}px)`;

    // Loop for creating all buttons (or squares) of the grid
    for (let i = 0; i < rendering.length; i++) {
        let button = document.createElement('button');

        switch (rendering[i]) {
            case 'H':
                break;
            case 'F':
                button.classList.add('btn-grid-flag');
                break;
            case 'M':
                button.classList.add('btn-grid-mine');
                break;
            case '0':
                button.classList.add('btn-grid-zero');
                break;
            default:
                button.classList.add('btn-grid-number');
                button.innerHTML = rendering[i];
                break;
        }

        button.classList.add('btn');
        button.classList.add('btn-grid');

        // Assign each button with their corresponding row and column
        button.dataset.row = Math.floor(i / number_of_cols);
        button.dataset.col = i % number_of_cols;

        grid.append(button);
    }
}

// Variables to be used for 'elapsed time' timer
let timer = null;
let second = 0;

/**
 * This function grabs status data from the game object and uses it to determine whether or not a
 * a game is done, and whether or not the user won. It also displays the number of flags currently
 * placed in the game and the elapsed time.
 *
 * Timer was inspired by code provided by Emmanuel Onu (TA).
 * @param {MSGame} game The game object with which this file communicates
 */
function check_game_status(game) {
    let game_status = game.getStatus();

    // Check whether or not the user pressed on a mine (exploded)
    if (game_status.exploded) {
        window.clearInterval(timer);

        // Display losing message with elapsed time
        $("#modal .modal-message").html(`<h1 id='losing-message'>You lose!</h1><p>Your time was ${second} seconds</p>`);
        $("#modal").modal('show');

        return UNSAFE_MOVE;
    }
    else {
        // Check whether or not the game is done
        if (game_status.done) {
            window.clearInterval(timer);

            // Display winning message with elapsed time
            $("#modal .modal-message").html(`<h1>You win!</h1><p>Your time was ${second} seconds</p>`);
            $("#modal").modal('show');
        }
    }

    // Display number of flags
    document.getElementById('number-of-flags').innerHTML = String(game.nmines - game_status.nmarked);

    // Display elapsed time
    if (game_status.nuncovered === 0) {
        window.clearInterval(timer);
        timer = null;
        second = 0;
        document.getElementById('elapsed-time').innerHTML = second;
    }
    else if (timer === null) {
        timer = setInterval(function() {
            second++;
            document.getElementById('elapsed-time').innerHTML = second;
        }, 1000);
    }

    return SAFE_MOVE;
}

/**
 * This function populates the 'menu' div with difficulty level buttons.
 * @param {MSGame} game The game object with which this file communicates
 */
function create_difficulty(game) {
    let menu = document.getElementById('menu');

    for (let i = 0; i < DIFFICULTY_LIST.length; i++) {
        let button = document.createElement('button');

        button.innerHTML = DIFFICULTY_LIST[i][0];

        button.classList.add('btn');
        button.classList.add('btn-light');
        button.classList.add('btn-difficulty');

        button.dataset.number_of_rows = DIFFICULTY_LIST[i][1];
        button.dataset.number_of_cols = DIFFICULTY_LIST[i][2];
        button.dataset.number_of_mines = DIFFICULTY_LIST[i][3];

        menu.append(button);
    }
}

/**
 * This function adds event listeners for user actions related to playing the game (click,
 * contextmenu, touchstart, and touchend) and communicates them with the game object. After
 * communicating with the game object, it automatically renders the grid and checks the game
 * status to immediately show the user the results of their actions.
 *
 * Event listener structure was inspired by code provided by Emmanuel Onu (TA).
 * @param {MSGame} game The game object with which this file communicates
 */
function add_grid_listeners(game) {
    let grid = document.getElementById('grid');

    // Event listener for 'click' (used for uncovering a square on the grid)
    grid.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('btn-grid')) {
            game.uncover(Number(event.target.dataset.row),
                         Number(event.target.dataset.col));

            render_grid(game);

            if (check_game_status(game)) {
                document.getElementById('unsafe_sound').play();
            }
            else {
                document.getElementById('safe_sound').play();
            }
        }
    });

    // Change listener for marking depending on whether or not device is touch screen
    if ('ontouchstart' in window || navigator.msMaxTouchPoints) {

        // Event listener for 'contextmenu'
        grid.addEventListener('contextmenu', function(event) {

            // When using a touch screen, disable the default behaviour of the 'contextmenu' event
            // so that a context menu does not show up when long tapping
            event.preventDefault();
        });

        // Variable to be used for 'touchstart' timeout
        var touch_timer;

        // Event listener for 'touchstart' (used for marking a square on the grid with a flag)
        grid.addEventListener('touchstart', function(event) {
            if (event.target && event.target.classList.contains('btn-grid')) {
                touch_timer = window.setTimeout(function() {
                    if (event.target.classList.contains('btn-flag')) {
                        event.target.classList.remove('btn-grid-flag');
                    }

                    game.mark(Number(event.target.dataset.row),
                              Number(event.target.dataset.col));

                    render_grid(game);
                    check_game_status(game);

                    document.getElementById('safe_sound').play();

                    event.preventDefault();
                }, 750); // User must hold touch for 750 milliseconds to place flag
            }
        });

        // Event listener for 'touchend'
        grid.addEventListener('touchend', function(event) {
            if (event.target && event.target.classList.contains('btn-grid')) {

                // Clear the 'touchstart' timeout if touch is released. This is to prevent a flag
                // from being placed if touch does not last for required period of time.
                clearTimeout(touch_timer);
            }
        });
    }
    else {
        // Event listener for 'contextmenu' (used for marking a square on the grid with a flag)
        grid.addEventListener('contextmenu', function(event) {
            event.preventDefault();

            if (event.target && event.target.classList.contains('btn-grid')) {
                if (event.target.classList.contains('btn-flag')) {
                    event.target.classList.remove('btn-grid-flag');
                }

                game.mark(Number(event.target.dataset.row),
                          Number(event.target.dataset.col));

                render_grid(game);
                check_game_status(game);

                document.getElementById('safe_sound').play();
            }
        });
    }
}

/**
 * This function adds event listeners for user actions related to changing the difficulty level
 * (click).
 * @param {MSGame} game The game object with which this file communicates
 */
function add_difficulty_listeners(game) {
    let menu = document.getElementById('menu');

    // Event listener for 'click'
    menu.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('btn-difficulty')) {
            helper_init(game, Number(event.target.dataset.number_of_rows),
                              Number(event.target.dataset.number_of_cols),
                              Number(event.target.dataset.number_of_mines));

            render_grid(game);
            check_game_status(game);

            document.getElementById('safe_sound').play();
        }
    });
}

/**
 * This function adds event listeners for user actions related to trying again after a game is done
 * (click).
 * @param {MSGame} game The game object with which this file communicates
 */
function add_try_again_listener(game) {
    let modal = document.getElementById('modal');

    // Event listener for 'click'
    modal.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('btn-try-again')) {
            game.init(game.nrows, game.ncols, game.nmines);

            render_grid(game);
            check_game_status(game);

            document.getElementById('safe_sound').play();
        }
    });
}

/**
 * The main function of this file
 */
function main() {

    // Create game object
    let game = new MSGame();

    create_difficulty(game);

    add_grid_listeners(game);

    add_difficulty_listeners(game);

    add_try_again_listener(game);

    // Start an easy game by default
    helper_init(game, DIFFICULTY_EASY[1], DIFFICULTY_EASY[2], DIFFICULTY_EASY[3]);

    render_grid(game);

    check_game_status(game);
}
