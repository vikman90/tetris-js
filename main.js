// Configuration - Standard Script Mode

// Configuration
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // Matches canvas width 300 / 10

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

// Game State
let board = null;
let requestId = null;
let accountValues = {
    score: 0,
    level: 1,
    lines: 0
};

// Initialize i18n
updateTexts();

const MOVES = {
    [37]: p => ({ ...p, x: p.x - 1 }), // Left
    [39]: p => ({ ...p, x: p.x + 1 }), // Right
    [40]: p => ({ ...p, y: p.y + 1 }), // Down
    [38]: p => board.rotate(p),        // Up (Rotate)
    [32]: p => ({ ...p, y: p.y + 1 })  // Space (Hard drop placeholder)
};

const KEY_MAP = {
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    32: 'SPACE',
    80: 'P' // Pause
};

let time = { start: 0, elapsed: 0, level: 1000 };

function init() {
    ctx.canvas.width = COLS * BLOCK_SIZE;
    ctx.canvas.height = ROWS * BLOCK_SIZE;
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

    nextCtx.canvas.width = 4 * 20;
    nextCtx.canvas.height = 4 * 20;
    nextCtx.scale(20, 20); // Smaller scale for preview
}

function resetGame() {
    accountValues = { score: 0, level: 1, lines: 0 };
    updateAccount('score', 0);
    updateAccount('level', 1);
    board = new Board(ctx, nextCtx);
    board.reset(); // Initial piece

    time = { start: performance.now(), elapsed: 0, level: 1000 };
    if (requestId) cancelAnimationFrame(requestId);
    animate();
}

function play() {
    document.getElementById('overlay').classList.add('hidden');
    resetGame();
}

function animate(now = 0) {
    time.elapsed = now - time.start;

    if (time.elapsed > time.level) {
        time.start = now;
        if (!drop()) {
            gameOver();
            return;
        }
    }

    // Clear and Redraw
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    board.draw();

    requestId = requestAnimationFrame(animate);
}

function drop() {
    let p = MOVES[40](board.piece);
    if (board.valid(p)) {
        board.piece.move(p);
        return true;
    } else {
        board.freeze(board.piece);

        // Remove lines
        const lines = board.clearLines();
        if (lines > 0) {
            accountValues.score += getLineScore(lines, accountValues.level);
            accountValues.lines += lines;
            accountValues.level = Math.floor(accountValues.lines / 10) + 1;
            time.level = Math.max(100, 1000 - (accountValues.level - 1) * 100);

            updateAccount('score', accountValues.score);
            updateAccount('level', accountValues.level);
        }

        // Spawn new piece
        // If can't spawn, game over
        // board.getNewPiece() does internal logic, we need to check validity immediately

        // Move next to current
        if (board.next) {
            board.piece = board.next;
            board.piece.ctx = ctx; // Switch context to main board
            board.piece.setStartingPosition();
            board.getNewPiece(); // Generate new next
        } else {
            board.piece = new Piece(ctx, 'I'); // Fallback for first run logic if needed
            board.piece.setStartingPosition();
            board.getNewPiece();
        }

        // Check if new piece collides immediately (Game Over)
        if (!board.valid(board.piece)) {
            return false;
        }
    }
    return true;
}

function getLineScore(lines, level) {
    const lineScores = [0, 40, 100, 300, 1200];
    return lineScores[lines] * level;
}

function updateAccount(key, value) {
    let element = document.getElementById(key);
    if (element) {
        element.textContent = value;
    }
}

function gameOver() {
    cancelAnimationFrame(requestId);

    document.getElementById('overlay-title').textContent = TEXTS.gameOver;
    document.getElementById('overlay-message').textContent = `${TEXTS.scoreMessage}${accountValues.score}`;
    document.getElementById('start-btn').textContent = TEXTS.playAgain;
    document.getElementById('overlay').classList.remove('hidden');
}

// Event Listeners
document.getElementById('start-btn').addEventListener('click', () => {
    play();
});

// Controls
document.addEventListener('keydown', event => {
    if (MOVES[event.keyCode]) {
        // Prevent default scrolling for arrows and space
        event.preventDefault();

        let p = MOVES[event.keyCode](board.piece);

        if (event.keyCode === 32) {
            // Hard Drop
            while (board.valid(p)) {
                board.piece.move(p);
                accountValues.score += 2; // Hard drop points
                updateAccount('score', accountValues.score);
                p = MOVES[40](board.piece);
            }
            // Force lock in next loop or manually call drop logic
            // To simplify, let's just let the next tick handle the freeze or force a drop cycle
            // Better: Loop move down until invalid, then freeze immediately
            // Since we moved until invalid in the while loop above (actually while valid move, so p is valid NEXT step)
            // Wait, logic above:
            // while valid(p) -> move. p becomes next pos.
            // If we use while (board.valid(nextP)) { move; nextP... }

            // Correct hard drop:
            // while (board.valid(MOVES[40](board.piece))) {
            //    board.piece.move(MOVES[40](board.piece));
            // }
            // board.piece is now at lowest point.
            // Force drop logic to freeze
            time.start = 0; // Force update in loop? Or call drop() immediately?
            drop();

        } else if (board.valid(p)) {
            board.piece.move(p);
        }
    }
});

init();
