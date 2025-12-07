class Board {
    constructor(ctx, nextCtx) {
        this.ctx = ctx;
        this.nextCtx = nextCtx;
        this.grid = this.getEmptyBoard();
        this.piece = null;
        this.next = null;
    }

    getEmptyBoard() {
        return Array.from({ length: 20 }, () => Array(10).fill(0));
    }

    reset() {
        this.grid = this.getEmptyBoard();
        const keys = Object.keys(PIECES);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        this.piece = new Piece(this.ctx, randomKey);
        this.piece.setStartingPosition();
        this.getNewPiece();
    }

    getNewPiece() {
        const keys = Object.keys(PIECES);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        this.next = new Piece(this.nextCtx, randomKey);
        this.nextCtx.clearRect(0, 0, this.nextCtx.canvas.width, this.nextCtx.canvas.height);
        this.next.draw();
    }

    valid(p) {
        return p.shape.every((row, dy) => {
            return row.every((value, dx) => {
                let x = p.x + dx;
                let y = p.y + dy;
                return (
                    value === 0 ||
                    (this.isInside(x, y) && this.isNotOccupied(x, y))
                );
            });
        });
    }

    isInside(x, y) {
        return x >= 0 && x < 10 && y <= 20; // y can be < 20
    }

    isNotOccupied(x, y) {
        // If y >= 20, it's the floor, treated as occupied (handled by isInside check usually, but for validity:
        // Actually wall kick/floor logic usually checks boundaries first.
        // Let's refine:
        // If we are below the floor, we are invalid. 
        if (y >= 20) return false;
        // If we are above the top, it's valid (spawning) unless collision
        return this.grid[y] && this.grid[y][x] === 0;
    }

    rotate(piece) {
        let p = JSON.parse(JSON.stringify(piece));
        // Transpose + Reverse = Rotate 90 deg
        for (let y = 0; y < p.shape.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [p.shape[x][y], p.shape[y][x]] = [p.shape[y][x], p.shape[x][y]];
            }
        }
        p.shape.forEach(row => row.reverse());
        return p;
    }

    freeze(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.grid[piece.y + y][piece.x + x] = piece.typeId;
                }
            });
        });
    }

    // Check for full lines
    clearLines() {
        let lines = 0;
        this.grid.forEach((row, y) => {
            if (row.every(value => value !== 0)) {
                lines++;
                this.grid.splice(y, 1);
                this.grid.unshift(Array(10).fill(0));
            }
        });
        return lines;
    }

    draw() {
        // Draw grid lines
        this.ctx.lineWidth = 0.06;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';

        // Vertical
        for (let x = 1; x < 10; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, 20);
            this.ctx.stroke();
        }
        // Horizontal
        for (let y = 1; y < 20; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(10, y);
            this.ctx.stroke();
        }

        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = PIECES[value].color;
                    this.ctx.fillRect(x, y, 1, 1);
                    // Optional: Add bevel/border for better look
                    this.ctx.lineWidth = 0.05;
                    this.ctx.strokeStyle = '#000';
                    this.ctx.strokeRect(x, y, 1, 1);
                }
            });
        });

        if (this.piece) {
            this.piece.draw();
        }
    }

    // Helper to map integer implementation if we use integers for colors, 
    // or if we store color strings directly.
    // For now we stored 0 or the piece definition ID.
    // Let's assume the grid stores the color string or ID.
}

class Piece {
    constructor(ctx, typeId) {
        this.ctx = ctx;
        this.typeId = typeId;
        this.color = PIECES[typeId].color;
        this.shape = PIECES[typeId].shape;
        this.x = 0;
        this.y = 0;
    }

    setStartingPosition() {
        this.x = 3;
        this.y = 0;
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.ctx.fillRect(this.x + x, this.y + y, 1, 1);
                    this.ctx.lineWidth = 0.05;
                    this.ctx.strokeStyle = '#000';
                    this.ctx.strokeRect(this.x + x, this.y + y, 1, 1);
                }
            });
        });
    }

    move(p) {
        this.x = p.x;
        this.y = p.y;
        this.shape = p.shape;
    }
}
