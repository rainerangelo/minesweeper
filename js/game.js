"use strict";

window.addEventListener('load', main);

const DIFFICULTY_EASY   = [  'Easy',  8, 10, 10];
const DIFFICULTY_MEDIUM = ['Medium', 14, 18, 40];
const DIFFICULTY_HARD   = [  'Hard', 20, 24, 99];

const DIFFICULTY_LIST = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD];

const SAFE_MOVE = 0;
const UNSAFE_MOVE = 1;

function helper_init(game, number_of_rows, number_of_cols, number_of_mines) {
    let media_query = window.matchMedia('(max-width: 600px)');

    if (media_query.matches) {
        game.init(number_of_cols, number_of_rows, number_of_mines);
    }
    else {
        game.init(number_of_rows, number_of_cols, number_of_mines);
    }
}

function render_grid(game) {
    let rendering = game.getRendering().join('');

    let number_of_rows = game.nrows;
    let number_of_cols = game.ncols;

    let grid = document.getElementById('grid');
    let button_size = grid.clientWidth / number_of_cols;

    grid.innerHTML = '';

    grid.style.gridTemplateRows = `repeat(${number_of_rows}, ${button_size}px)`;
    grid.style.gridTemplateColumns = `repeat(${number_of_cols}, ${button_size}px)`;

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

        button.dataset.row = Math.floor(i / number_of_cols);
        button.dataset.col = i % number_of_cols;

        grid.append(button);
    }
}

let timer = null;
let second = 0;

function check_game_status(game) {
    let game_status = game.getStatus();

    if (game_status.exploded) {
        window.clearInterval(timer);

        $("#modal .modal-message").html(`<h1>You lose!</h1><p>Your time was ${second} seconds</p>`);
        $("#modal").modal('show');

        return UNSAFE_MOVE;
    }
    else {
        if (game_status.done) {
            window.clearInterval(timer);

            $("#modal .modal-message").html(`<h1>You win!</h1><p>Your time was ${second} seconds</p>`);
            $("#modal").modal('show');
        }
    }

    // Display number of flags
    document.getElementById('number-of-flags').innerHTML = String(game.nmines - game_status.nmarked);

    // Display elapsed time
    if (game_status.nuncovered === 0) {
        timer = null;
        second = 0;
        document.getElementById('elapsed-time').innerHTML = 0;
    }
    else if (timer === null) {
        timer = setInterval(function() {
            second++;
            document.getElementById('elapsed-time').innerHTML = second;
        }, 1000);
    }

    return SAFE_MOVE;
}

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

function add_grid_listeners(game) {
    let grid = document.getElementById('grid');

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

function add_difficulty_listeners(game) {
    let menu = document.getElementById('menu');

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

function add_try_again_listener(game) {
    let modal = document.getElementById('modal');

    modal.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('btn-try-again')) {
            helper_init(game, game.nrows, game.ncols, game.nmines);

            render_grid(game);
            check_game_status(game);

            document.getElementById('safe_sound').play();
        }
    });
}

function main() {
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
