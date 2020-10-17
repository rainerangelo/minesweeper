"use strict";

window.addEventListener('load', main);

const DIFFICULTY_EASY   = [  'Easy',  8, 10, 10];
const DIFFICULTY_MEDIUM = ['Medium', 14, 18, 40];
const DIFFICULTY_HARD   = [  'Hard', 20, 24, 99];

const DIFFICULTY_LIST = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD];

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

        button.innerHTML = rendering[i];

        button.classList.add('btn');
        button.classList.add('btn-light');
        button.classList.add('btn-grid');
        button.dataset.row = Math.floor(i / number_of_cols);
        button.dataset.col = i % number_of_cols;

        grid.append(button);
    }
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
            game.uncover(event.target.dataset.row, event.target.dataset.col);
            render_grid(game);
        }
    });

    grid.addEventListener('contextmenu', function(event) {
        event.preventDefault();

        if (event.target && event.target.classList.contains('btn-grid')) {
            game.mark(event.target.dataset.row, event.target.dataset.col);
            render_grid(game);
        }
    });
}

function add_difficulty_listeners(game) {
    let menu = document.getElementById('menu');

    menu.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('btn-difficulty')) {
            game.init(event.target.dataset.number_of_rows, event.target.dataset.number_of_cols, event.target.dataset.number_of_mines);
            render_grid(game);
        }
    });
}

function main() {
    let game = new MSGame();

    // Start an easy game by default
    game.init(DIFFICULTY_EASY[1], DIFFICULTY_EASY[2], DIFFICULTY_EASY[3]);

    render_grid(game);

    create_difficulty(game);

    add_grid_listeners(game);

    add_difficulty_listeners(game);
}
