function createPlayer(playerNumber) {
    let number = playerNumber, winCount = 0;
    const playerMarker = playerNumber === 0 ? 'x' : 'o';

    const getPlayerNumber = () => {
        return number;
    };

    const getPlayerWinCount = () => {
        return winCount;
    };

    const increasePlayerWinCount = () => {
        winCount += 1;
    };

    const reset = () => {
        winCount = 0;
    };

    return {playerMarker, getPlayerNumber, getPlayerWinCount, increasePlayerWinCount, reset};
}

// Manages all the functions related to playing the game
const gameManager = (function () {
    // Two dimensional array of empty items that can be accessed by gameBoard[row][column] (both are indexed from 0)
    let gameBoard = [[, , ,], [, , ,], [, , ,]];
    let totalMoveCount = 0;

    // player[0] is referred to as playerOne and player[1] as playerTwo in the game as well as in the comments below
    let player = [createPlayer(0), createPlayer(1)];

    // PlayerOne moves first
    let activePlayer = 0;

    // Game won't be played while this is turned off
    let gameOngoing = true;
    let currentRound = 1;

    const restartGame = () => {
        newRound();
        player[0].reset();
        player[1].reset();
        currentRound = 1;
    }

    const newRound = () => {
        gameBoard = [[, , ,], [, , ,], [, , ,]];
        totalMoveCount = 0;
        activePlayer = 0;
        currentRound++;
        toggleGameStatus(true);
    }

    // Get status of the game (whether it is ongoing or has ended)
    const getGameStatus = () => gameOngoing;

    const getCurrentRound = () => currentRound;

    const getBoard = () => gameBoard;

    const getMoveCounts = () => {
        return {
            totalMoveCount: totalMoveCount,
            playerOneMoveCount: player[0].getPlayerMoveCount(),
            playerTwoMoveCount: player[1].getPlayerMoveCount()
        };
    };

    const getPlayers = () => player;
    const getActivePlayer = () => activePlayer;

    const makeMove = (moveRow, moveColumn) => {
        if (!gameOngoing || ![0, 1, 2].includes(moveRow) || ![0, 1, 2].includes(moveColumn) || gameBoard[moveRow][moveColumn] !== undefined) {
            return false;
        }

        registerMove(moveRow, moveColumn);

        // Check for winner after registering move
        const moveResult = checkWin();

        const resultObject = Object.assign({}, moveResult);

        // Update active player
        updateActivePlayer();

        // If game ended, let the player know
        if (moveResult.roundEnd === true) {
            if (moveResult.winner !== null) {
                player[moveResult.winner].increasePlayerWinCount();
            }

            toggleGameStatus(false);
        }

        return resultObject;
    };

    function toggleGameStatus(status) {
        gameOngoing = status;
    }

    function updateActivePlayer() {
        activePlayer = activePlayer === 0 ? 1 : 0;
    }

    function registerMove (moveRow, moveColumn) {
        // Stores which player made a move in that cell
        gameBoard[moveRow][moveColumn] = player[activePlayer].getPlayerNumber();
        totalMoveCount++;
    }

    function checkWin() {
        let moveResult = {roundEnd: false};
        if (totalMoveCount === 9) {
            moveResult.roundEnd = true;
            moveResult.winner = null;
        }

        // Cells along one diagonal are equal
        if (gameBoard[1][1] !== undefined && (gameBoard[0][0] === gameBoard[1][1] && gameBoard[1][1] === gameBoard[2][2] || gameBoard[2][0] === gameBoard[1][1] && gameBoard[1][1] === gameBoard[0][2])) {
            moveResult.roundEnd = true;
            moveResult.winner = gameBoard[1][1];
        } else {
            for (let i = 0; i < 3; i++) {
                // Three cells in a row are equal
                if (gameBoard[i][0] !== undefined && gameBoard[i][0] === gameBoard[i][1] && gameBoard[i][1] === gameBoard[i][2]) {
                    moveResult.roundEnd = true;
                    moveResult.winner = gameBoard[i][0];
                    break;

                // Three cells in a column are equal
                } else if (gameBoard[0][i] !== undefined && gameBoard[0][i] === gameBoard[1][i] && gameBoard[1][i] === gameBoard[2][i]) {
                    moveResult.roundEnd = true;
                    moveResult.winner = gameBoard[0][i];
                    break;
                }
            }
        }
        return moveResult;
    }

    return {getGameStatus, getCurrentRound, getMoveCounts, getPlayers, getActivePlayer, makeMove, newRound, restartGame};
})();

// Manages all the functions related to changing the display
const displayManager = (function () {
    const board = document.querySelector('#board');
    const resultDisplay = document.querySelector('#round-result');
    const buttons = document.querySelector('.buttons');
    const scores = document.querySelectorAll('.count > p');

    function toggleBoardEventListeners(state) {
        board.style.pointerEvents = state;
    }

    function markCell(cell, playerMarker) {
        cell.classList.add(`${playerMarker}`);
    }

    function clearBoard() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('o', 'x');
        });
    }

    function processMove(event) {
        if (gameManager.getGameStatus() !== true) {
            return;
        }
        if (event.target.classList.contains('cell')) {
            toggleBoardEventListeners('none');

            // Use gameManager to make the move and return results and then analyze the results
            const cell = event.target;
            const rowParent = cell.parentNode;

            const moveColumn = Array.from(rowParent.children).indexOf(cell);
            const moveRow = Array.from(rowParent.parentNode.children).indexOf(rowParent);

            const moveByPlayer = gameManager.getActivePlayer();
            const moveResult = gameManager.makeMove(moveRow, moveColumn);

            if (moveResult === false) {
                toggleBoardEventListeners('initial');
                return;
            } else {
                const playerMarker = gameManager.getPlayers()[moveByPlayer].playerMarker;
                markCell(cell, playerMarker);
            }

            // Board event listeners will stay turned off if the round ended until new round starts
            if (moveResult.roundEnd === true) {
                if (moveResult.winner !== null) {
                    const player = gameManager.getPlayers()[moveResult.winner];
                    scores[moveResult.winner === 1 ? 2 : 0].textContent = player.getPlayerWinCount();
                    resultDisplay.textContent = `Player ${moveResult.winner + 1} won the round!`;
                } else {
                    scores[1].textContent = Number(scores[1].textContent) + 1;
                    resultDisplay.textContent = 'It\'s a tie!';
                }
            } else {
                toggleBoardEventListeners('initial');
            }
        }
    }

    function startNewRound() {
        clearBoard();
        const gameWasOngoing = gameManager.getGameStatus();
        gameManager.newRound();
        resultDisplay.textContent = `Round ${gameManager.getCurrentRound()}`;
        if (gameWasOngoing === true) {
            scores[1].textContent = Number(scores[1].textContent) + 1;
        }
        toggleBoardEventListeners('initial');
    }

    function restartGame() {
        clearBoard();
        gameManager.restartGame();
        resultDisplay.textContent = `Round ${gameManager.getCurrentRound()}`;
        scores.forEach(score => score.textContent = '0');
        toggleBoardEventListeners('initial');
    }

    return {board, buttons, processMove, startNewRound, restartGame};
})();

displayManager.board.addEventListener('click', event => displayManager.processMove(event));

displayManager.buttons.addEventListener('click', event => {
    const target = event.target;
    if (target.id === 'new-round') {
        displayManager.startNewRound();
    } else if (target.id === 'restart-game') {
        displayManager.restartGame();
    }
});