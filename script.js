function createPlayer(playerName, playerNumber) {
    let name = playerName, number = playerNumber, winCount = 0;
    return {
        playerMarker: playerNumber === 0 ? 'x' : 'o',
        getPlayerName() {
            return name;
        },
        getPlayerNumber() {
            return number;
        },
        getPlayerWinCount() {
            return winCount;
        }, increasePlayerWinCount() {
            winCount += 1;
        },
        reset() {
            winCount = 0;
        }
    };
}

function createGameManager() {
    // Two dimensional array of empty items that can be accessed by gameBoard[row][column] (both are indexed from 0)
    let gameBoard = [[, , ,], [, , ,], [, , ,]];
    let totalMoveCount = 0;

    // player[0] is referred to as playerOne and player[1] as playerTwo in the game as well as in the comments below
    let player = [createPlayer('Player 1', 0), createPlayer('Player 2', 1)];

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
                console.log(moveResult.winner, player[moveResult.winner].getPlayerWinCount());
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

    return {getBoard, getGameStatus, getCurrentRound, getMoveCounts, getPlayers, getActivePlayer, makeMove, newRound, restartGame};
}

function createDisplayManager() {
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
            console.log(cell.classList);
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
            const roundResult = gameManager.makeMove(moveRow, moveColumn);

            if (roundResult === false) {
                toggleBoardEventListeners('initial');
                return;
            } else {
                const playerMarker = gameManager.getPlayers()[moveByPlayer].playerMarker;
                markCell(cell, playerMarker);
            }

            // Board event listeners will stay turned off if the round ended until new round starts
            if (roundResult.roundEnd === true) {
                if (roundResult.winner !== null) {
                    const player = gameManager.getPlayers()[roundResult.winner];
                    scores[roundResult.winner === 1 ? 2 : 0].textContent = player.getPlayerWinCount();
                    resultDisplay.textContent = `${player.getPlayerName()} won the round!`;
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
        gameManager.newRound();
        resultDisplay.textContent = '';
        toggleBoardEventListeners('initial');
    }

    function restartGame() {
        clearBoard();
        gameManager.restartGame();
        scores.forEach(score => score.textContent = '0');
        resultDisplay.textContent = '';
        toggleBoardEventListeners('initial');
    }

    board.addEventListener('click', event => processMove(event));

    buttons.addEventListener('click', event => {
        const target = event.target;
        if (target.id === 'new-round') {
            startNewRound();
        } else if (target.id === 'restart-game') {
            restartGame();
        }
    });

    return {markCell};
}

// Manages all the functions related to playing the game
let gameManager = createGameManager();

// Manages all the functions related to changing the display
const displayManager = createDisplayManager();