const MAXROUNDS = 3;

function createPlayer(playerNumber) {
    let playerMoveCount = 0, winCount = 0;
    return {
        playerNumber,
        playerMarker: playerNumber === 0 ? 'x' : 'o',
        getPlayerMoveCount() {
            return playerMoveCount;
        },
        increasePlayerMoveCount() {
            playerMoveCount++;
        },
        getWinCount() {
            return winCount;
        },
        increaseWinCount() {
            winCount++;
        },
        reset() {
            playerMoveCount = 0;
            winCount = 0;
        }
    };
}

function createGameManager() {
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
        currentRound = 1;
        gameOngoing = true;
    }

    function newRound() {
        if (currentRound === MAXROUNDS) {
            return;
        }

        gameBoard = [[, , ,], [, , ,], [, , ,]];
        totalMoveCount = 0;
        player[0].reset();
        player[1].reset();
        activePlayer = 0;
        currentRound++;
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

        const resultObject = {gameEnd: false, winner: null, round: currentRound};

        registerMove(moveRow, moveColumn);

        // Check for winner after registering move
        const moveResult = checkWin();

        // Update active player
        updateActivePlayer();

        // If game ended, let the player know
        if (moveResult.roundEnd) {
            if (moveResult.winner !== undefined) {
                player[moveResult.winner].increaseWinCount();
                resultObject.winner = moveResult.winner;
            }

            // Game has ended
            if (currentRound === MAXROUNDS) {
                const gameWinner = player[0].getWinCount() > player[1].getWinCount() ? 0 : 1;
                resultObject.gameEnd = true;
                resultObject.winner = gameWinner;
                gameOngoing = false;
            }
            newRound();
        }

        return resultObject;
    };

    function updateActivePlayer() {
        activePlayer = activePlayer === 0 ? 1 : 0;
    }

    function registerMove (moveRow, moveColumn) {
        // Stores which player made a move in that cell
        gameBoard[moveRow][moveColumn] = player[activePlayer].playerNumber;
        totalMoveCount++;
        player[activePlayer].increasePlayerMoveCount();
    };

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

    return {getBoard, getGameStatus, getCurrentRound, getMoveCounts, getPlayers, getActivePlayer, makeMove, restartGame};
}

function createDisplayManager() {
    const board = document.querySelector('#board');
    const resultDisplay = document.querySelector('#round-result');

    board.addEventListener('click', event => {
        if (gameManager.getGameStatus() !== true) {
            return;
        }
        if (event.target.classList.contains('cell')) {
            toggleBoardEventListeners();

            const cell = event.target;
            const rowParent = cell.parentNode;

            const moveColumn = Array.from(rowParent.children).indexOf(cell);
            const moveRow = Array.from(rowParent.parentNode.children).indexOf(rowParent);

            const player = gameManager.getActivePlayer();
            const roundResult = gameManager.makeMove(moveRow, moveColumn);

            if (roundResult === false) {
                toggleBoardEventListeners();
                return;
            } else {
                const playerMarker = gameManager.getPlayers()[player].playerMarker;
                markCell(cell, playerMarker);
            }

            if (roundResult.gameEnd === true) {
                resultDisplay.textContent = `Player ${roundResult.winner + 1} won the game!`;
            } else if (roundResult.winner !== null) {
                resultDisplay.textContent = `Player ${roundResult.winner + 1} won the round!`;
                clearBoard();
            }

            toggleBoardEventListeners();
        }
    });

    function toggleBoardEventListeners() {
        board.classList.toggle('disabled');
    }

    function markCell(cell, playerMarker) {
        cell.classList.add(`${playerMarker}`);
    }

    function clearBoard() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('o', 'x');
            console.log(cell.classList);
        });
    }

    return {markCell};
}

// Manages all the functions related to playing the game
let gameManager = createGameManager();

// Manages all the functions related to changing the display
const displayManager = createDisplayManager();