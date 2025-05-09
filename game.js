const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 480,
  backgroundColor: '#fff8dc',
  parent: 'game-container',
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

const GRID_SIZE = 8;
const TILE_SIZE = 60;
const TILE_TYPES = ['🦁', '🐘', '🐆', '🪘', '🛖', '🪶']; // African animals, drum, hut, feather emojis

let board = [];
let selectedTile = null;
let canInput = true;
let score = 0;
let scoreText;

function preload() {
  // No assets, using emojis as text objects
}

function create() {
  this.cameras.main.setBackgroundColor('#f0e4d7');

  // Create board grid with random tiles
  for (let row = 0; row < GRID_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      let tileType = Phaser.Math.RND.pick(TILE_TYPES);
      let tile = this.add.text(
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2,
        tileType,
        { fontSize: '48px' }
      ).setOrigin(0.5);
      tile.setInteractive();
      tile.row = row;
      tile.col = col;
      tile.type = tileType;

      tile.on('pointerdown', () => {
        if (!canInput) return;
        if (!selectedTile) {
          selectedTile = tile;
          highlightTile(tile, true);
        } else if (selectedTile === tile) {
          highlightTile(tile, false);
          selectedTile = null;
        } else if (areAdjacent(selectedTile, tile)) {
          highlightTile(selectedTile, false);
          swapTiles(selectedTile, tile).then((matched) => {
            if (!matched) {
              // Swap back if no match
              swapTiles(selectedTile, tile);
            } else {
              checkMatches();
            }
            selectedTile = null;
          });
        } else {
          highlightTile(selectedTile, false);
          selectedTile = tile;
          highlightTile(tile, true);
        }
      });

      board[row][col] = tile;
    }
  }

  // Score text
  scoreText = this.add.text(10, GRID_SIZE * TILE_SIZE + 10, 'Score: 0', { fontSize: '24px', color: '#a0522d' });

  // Initial match check to clear any starting matches
  this.time.delayedCall(100, () => {
    checkMatches();
  });
}

function update() {}

function highlightTile(tile, highlight) {
  if (highlight) {
    tile.setStyle({ backgroundColor: '#ffd700' });
  } else {
    tile.setStyle({ backgroundColor: null });
  }
}

function areAdjacent(tile1, tile2) {
  return (
    (tile1.row === tile2.row && Math.abs(tile1.col - tile2.col) === 1) ||
    (tile1.col === tile2.col && Math.abs(tile1.row - tile2.row) === 1)
  );
}

function swapTiles(tile1, tile2) {
  canInput = false;

  return new Promise((resolve) => {
    // Swap types
    let tempType = tile1.type;
    tile1.type = tile2.type;
    tile2.type = tempType;

    tile1.setText(tile1.type);
    tile2.setText(tile2.type);

    // Animate swap
    const duration = 200;
    const tile1Pos = { x: tile1.x, y: tile1.y };
    const tile2Pos = { x: tile2.x, y: tile2.y };

    const tween1 = tile1.scene.tweens.add({
      targets: tile1,
      x: tile2Pos.x,
      y: tile2Pos.y,
      duration,
      ease: 'Power2',
    });

    const tween2 = tile2.scene.tweens.add({
      targets: tile2,
      x: tile1Pos.x,
      y: tile1Pos.y,
      duration,
      ease: 'Power2',
      onComplete: () => {
        // Swap back positions to keep grid consistent
        tile1.x = tile1Pos.x;
        tile1.y = tile1Pos.y;
        tile2.x = tile2Pos.x;
        tile2.y = tile2Pos.y;

        canInput = true;
        resolve(checkAnyMatches());
      },
    });
  });
}

function checkAnyMatches() {
  // Check if there is any match on the board
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = board[row][col];
      // Horizontal match
      if (col <= GRID_SIZE - 3) {
        if (
          tile.type === board[row][col + 1].type &&
          tile.type === board[row][col + 2].type
        ) {
          return true;
        }
      }
      // Vertical match
      if (row <= GRID_SIZE - 3) {
        if (
          tile.type === board[row + 1][col].type &&
          tile.type === board[row + 2][col].type
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function checkMatches() {
  canInput = false;

  let matches = [];

  // Find horizontal matches
  for (let row = 0; row < GRID_SIZE; row++) {
    let matchLength = 1;
    for (let col = 0; col < GRID_SIZE; col++) {
      let checkMatch = false;

      if (col === GRID_SIZE - 1) {
        checkMatch = true;
      } else {
        if (board[row][col].type === board[row][col + 1].type) {
          matchLength++;
        } else {
          checkMatch = true;
        }
      }

      if (checkMatch) {
        if (matchLength >= 3) {
          for (let i = 0; i < matchLength; i++) {
            matches.push(board[row][col - i]);
          }
        }
        matchLength = 1;
      }
    }
  }

  // Find vertical matches
  for (let col = 0; col < GRID_SIZE; col++) {
    let matchLength = 1;
    for (let row = 0; row < GRID_SIZE; row++) {
      let checkMatch = false;

      if (row === GRID_SIZE - 1) {
        checkMatch = true;
      } else {
        if (board[row][col].type === board[row + 1][col].type) {
          matchLength++;
        } else {
          checkMatch = true;
        }
      }

      if (checkMatch) {
        if (matchLength >= 3) {
          for (let i = 0; i < matchLength; i++) {
            matches.push(board[row - i][col]);
          }
        }
        matchLength = 1;
      }
    }
  }

  if (matches.length === 0) {
    canInput = true;
    return;
  }

  // Remove duplicates
  matches = [...new Set(matches)];

  // Clear matched tiles
  matches.forEach(tile => {
    tile.type = null;
    tile.setText('');
  });

  // Update score
  score += matches.length * 10;
  scoreText.setText('Score: ' + score);

  // Drop tiles down and fill empty spaces
  dropTiles().then(() => {
    // After dropping, check for new matches (cascades)
    checkMatches();
  });
}

function dropTiles() {
  return new Promise((resolve) => {
    let moved = false;

    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (board[row][col].type === null) {
          // Find tile above that is not null
          for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
            if (board[aboveRow][col].type !== null) {
              // Move tile down
              board[row][col].type = board[aboveRow][col].type;
              board[row][col].setText(board[row][col].type);
              board[aboveRow][col].type = null;
              board[aboveRow][col].setText('');
              moved = true;
              break;
            }
          }
        }
      }
    }

    // Fill empty tiles at top with new random tiles
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE; row++) {
        if (board[row][col].type === null) {
          board[row][col].type = Phaser.Math.RND.pick(TILE_TYPES);
          board[row][col].setText(board[row][col].type);
        }
      }
    }

    // Small delay for drop animation effect (optional)
    setTimeout(() => {
      resolve();
    }, 300);
  });
}
