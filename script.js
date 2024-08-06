const COLS = 10;
const ROWS = 20;
let TILE_SIZE = 20;
let scoreElement = document.getElementById('score');
let startBtn = document.getElementById('startBtn');
let pauseBtn = document.getElementById('pauseBtn');
let restartBtn = document.getElementById('restartBtn');
let game;
let isPaused = false;

// Carregar os sons
const lineClearSound = new Audio('./som/tetris-line-clear-sound.mp3');
const gameOverSound = new Audio('./som/game-over-sound.mp3');

class Tile {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.strokeRect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

class Piece {
  constructor(matrix, tile) {
    this.matrix = matrix;
    this.tile = tile;
  }

  draw(ctx) {
    for (let i = 0; i < this.matrix.length; i++) {
      for (let j = 0; j < this.matrix[i].length; j++) {
        if (this.matrix[i][j] === 1) {
          const tile = new Tile(this.tile.x + j, this.tile.y + i, this.tile.color);
          tile.draw(ctx);
        }
      }
    }
  }

  rotate() {
    const newMatrix = this.matrix[0].map((_, index) => this.matrix.map(row => row[index]).reverse());
    this.matrix = newMatrix;
  }
}

class PieceFactory {
  constructor() {
    this.pieces = [
      { matrix: [[1, 1], [1, 1]], color: 'red' },
      { matrix: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
      { matrix: [[0, 0, 1], [1, 1, 1]], color: 'green' },
      { matrix: [[1, 1, 0], [0, 1, 1]], color: 'yellow' },
      { matrix: [[0, 1, 1], [1, 1, 0]], color: 'purple' },
      { matrix: [[0, 1, 0], [1, 1, 1]], color: 'orange' },
      { matrix: [[1, 1, 1, 1]], color: 'cyan' }
    ];
  }

  createPiece() {
    const randomIndex = Math.floor(Math.random() * this.pieces.length);
    const piece = this.pieces[randomIndex];
    const tile = new Tile(COLS / 2 - Math.floor(piece.matrix[0].length / 2), 0, piece.color);
    return new Piece(piece.matrix, tile);
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pieceFactory = new PieceFactory();
    this.pawn = null;
    this.board = this.createBoard();
    this.score = 0;
    this.isGameOver = false;
  }

  createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  start() {
    this.isGameOver = false;
    this.board = this.createBoard();
    this.score = 0;
    scoreElement.textContent = 'Score: ' + this.score;
    this.pawn = this.pieceFactory.createPiece();
    this.draw();
    this.intervalId = setInterval(() => {
      if (!isPaused) {
        this.update();
        this.draw();
      }
    }, 1000);
  }

  update() {
    if (!this.collides(this.pawn, 0, 1)) {
      this.pawn.tile.y += 1;
    } else {
      this.merge(this.pawn);
      this.pawn = this.pieceFactory.createPiece();
      if (this.collides(this.pawn, 0, 0)) {
        this.gameOver();
      }
    }
    const linesCleared = this.clearLines();
    if (linesCleared > 0) {
      this.score += 10 * linesCleared;
      scoreElement.textContent = 'Score: ' + this.score;
      lineClearSound.play(); // Toca o som quando uma linha é limpa
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.pawn.draw(this.ctx);
    this.drawBoard();
  }

  drawBoard() {
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[y].length; x++) {
        if (this.board[y][x] !== 0) {
          const tile = new Tile(x, y, this.board[y][x]);
          tile.draw(this.ctx);
        }
      }
    }
  }

  collides(piece, offsetX, offsetY) {
    for (let y = 0; y < piece.matrix.length; y++) {
      for (let x = 0; x < piece.matrix[y].length; x++) {
        if (
          piece.matrix[y][x] === 1 &&
          (this.board[y + piece.tile.y + offsetY] && this.board[y + piece.tile.y + offsetY][x + piece.tile.x + offsetX]) !== 0
        ) {
          return true;
        }
      }
    }
    return false;
  }

  merge(piece) {
    piece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          this.board[y + piece.tile.y][x + piece.tile.x] = piece.tile.color;
        }
      });
    });
  }

  clearLines() {
    const fullRows = this.board.reduce((acc, row, index) => {
      if (row.every(tile => tile !== 0)) {
        acc.push(index);
      }
      return acc;
    }, []);

    fullRows.forEach(rowIndex => {
      this.board.splice(rowIndex, 1);
      this.board.unshift(new Array(COLS).fill(0));
    });

    return fullRows.length;
  }

  gameOver() {
    clearInterval(this.intervalId);
    this.isGameOver = true;
    gameOverSound.load(); // Carrega o som antes de tocar
    gameOverSound.play(); // Toca o som de game over
    alert("Game Over! Final Score: " + this.score);
    restartBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
  }

  setKeyControls() {
    document.addEventListener('keydown', (event) => {
      if (!this.isGameOver && !isPaused) {
        switch (event.key) {
          case 'ArrowLeft':
            if (!this.collides(this.pawn, -1, 0)) {
              this.pawn.tile.x -= 1;
            }
            break;
          case 'ArrowRight':
            if (!this.collides(this.pawn, 1, 0)) {
              this.pawn.tile.x += 1;
            }
            break;
          case 'ArrowDown':
            if (!this.collides(this.pawn, 0, 1)) {
              this.pawn.tile.y += 1;
            }
            break;
          case 'ArrowUp':
            const oldMatrix = this.pawn.matrix;
            this.pawn.rotate();
            if (this.collides(this.pawn, 0, 0)) {
              this.pawn.matrix = oldMatrix;
            }
            break;
        }
        this.draw();
      }
    });
  }
}

pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume Game' : 'Pause Game';
});

startBtn.addEventListener('click', () => {
  game = new Game(document.getElementById('canvas'));
  game.start();
  game.setKeyControls();
  startBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-block';
});

restartBtn.addEventListener('click', () => {
  restartBtn.style.display = 'none';
  game.start();
  pauseBtn.style.display = 'inline-block';
});

canvas.width = window.innerWidth < 400 ? window.innerWidth * 0.9 : 200;
canvas.height = canvas.width * 2;
TILE_SIZE = canvas.width / COLS;
