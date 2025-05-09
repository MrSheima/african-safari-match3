// Tile types with name, color, and SVG filename (relative to root)
const tileTypes = [
  { name: 'Elephant', color: '#CC7722', svg: 'https://github.com/MrSheima/african-safari-match3/blob/main/icons/elephant.svg' },
  { name: 'Lion', color: '#984B2B', svg: 'https://github.com/MrSheima/african-safari-match3/blob/main/icons/lion.svg' },
  { name: 'Giraffe', color: '#F4E5D6', svg: 'https://github.com/MrSheima/african-safari-match3/blob/main/icons/giraffe.svg', textColor: '#795548' },
  { name: 'Drum', color: '#5C4033', svg: 'https://github.com/MrSheima/african-safari-match3/blob/main/icons/drum.svg' },
  { name: 'Basket', color: '#E07622', svg: 'https://github.com/MrSheima/african-safari-match3/blob/main/icons/basket.svg' },
  { name: 'Stone Carving', color: '#8C471B', svg: 'https://github.com/MrSheima/african-safari-match3/blob/main/icons/stonecarving.svg' }
];

let gridSize = 8;
let board = [];
let selected = null;
let score = 0;
let level = 1;
let scoreGoal = 800;
let moves = 0;
let movesLimit = 25;
let timerInterval = null;
let timeLeft = 60; // seconds

// Levels data with increasing difficulty and decreasing time
const levels = [
  { gridSize: 8, scoreGoal: 800, movesLimit: 25, timeLimit: 60 },
  { gridSize: 8, scoreGoal: 1200, movesLimit: 24, timeLimit: 55 },
  { gridSize: 8, scoreGoal: 1600, movesLimit: 23, timeLimit: 50 },
  { gridSize: 8, scoreGoal: 2000, movesLimit: 22, timeLimit: 45 },
  { gridSize: 8, scoreGoal: 2500, movesLimit: 21, timeLimit: 40 },
  { gridSize: 8, scoreGoal: 3000, movesLimit: 20, timeLimit: 38 },
  { gridSize: 8, scoreGoal: 3500, movesLimit: 19, timeLimit: 36 },
  { gridSize: 8, scoreGoal: 4000, movesLimit: 18, timeLimit: 34 },
  { gridSize: 8, scoreGoal: 4500, movesLimit: 17, timeLimit: 32 },
  { gridSize: 8, scoreGoal: 5000, movesLimit: 16, timeLimit: 30 }
];

// Returns a random tile index
function randomTile() {
  return Math.floor(Math.random() * tileTypes.length);
}

// Create a new board filled with random tiles
function createBoard() {
  board = [];
  for (let r = 0; r < gridSize; r++) {
    let row = [];
    for (let c = 0; c < gridSize; c++) {
      row.push(randomTile());
    }
    board.push(row);
  }
}

// Draw the game board to the DOM
function drawBoard() {
  const boardDiv = document.getElementById('game-board');
  boardDiv.innerHTML = '';
  boardDiv.style.gridTemplateColumns = `repeat(${gridSize}, 60px)`;
  boardDiv.style.gridTemplateRows = `repeat(${gridSize}, 60px)`;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const idx = board[r][c];
      const tile = tileTypes[idx];
      const div = document.createElement('div');
      div.className = 'tile';
      div.style.backgroundColor = tile.color;
      div.style.color = tile.textColor || '#fff';
      div.dataset.row = r;
      div.dataset.col = c;
      if (selected && selected.row === r && selected.col === c) {
        div.classList.add('selected');
      }
      div.onclick = () => selectTile(r, c);

      // Add SVG icon as image
      const img = document.createElement('img');
      img.src = tile.svg;
      img.alt = tile.name;
      div.appendChild(img);

      // Add label below icon
      const label = document.createElement('div');
      label.className = 'tile-label';
      label.textContent = tile.name;
      div.appendChild(label);

      boardDiv.appendChild(div);
    }
  }
}

// Handle tile selection and swapping logic
function selectTile(r, c) {
  if (selected) {
    if (selected.row === r && selected.col === c) {
      selected = null;
      drawBoard();
      return;
    }
    if (isAdjacent(selected, { row: r, col: c })) {
      swapTiles(selected, { row: r, col: c });
      moves++;
      updateScoreMoves();
      selected = null;
    } else {
      selected = { row: r, col: c };
    }
  } else {
    selected = { row: r, col: c };
  }
  drawBoard();
}

// Check if two tiles are adjacent
function isAdjacent(a, b) {
  return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
}

// Swap two tiles and check for matches
function swapTiles(a, b) {
  const temp = board[a.row][a.col];
  board[a.row][a.col] = board[b.row][b.col];
  board[b.row][b.col] = temp;
  drawBoard();
  setTimeout(() => {
    if (!checkAndClearMatches()) {
      // No match, swap back
      const temp2 = board[a.row][a.col];
      board[a.row][a.col] = board[b.row][b.col];
      board[b.row][b.col] = temp2;
      drawBoard();
    } else {
      cascadeTiles();
    }
  }, 200);
}

// Check for horizontal and vertical matches and clear them
function checkAndClearMatches() {
  let matched = [];
  // Horizontal matches
  for (let r = 0; r < gridSize; r++) {
    let count = 1;
    for (let c = 1; c < gridSize; c++) {
      if (board[r][c] === board[r][c - 1]) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) matched.push([r, c - 1 - k]);
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let k = 0; k < count; k++) matched.push([r, gridSize - 1 - k]);
    }
  }
  // Vertical matches
  for (let c = 0; c < gridSize; c++) {
    let count = 1;
    for (let r = 1; r < gridSize; r++) {
      if (board[r][c] === board[r - 1][c]) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 0; k < count; k++) matched.push([r - 1 - k, c]);
        }
        count = 1;
      }
    }
    if (count >= 3) {
      for (let k = 0; k < count; k++) matched.push([gridSize - 1 - k, c]);
    }
  }
  // Remove duplicates
  matched = matched.map(([r, c]) => `${r},${c}`);
  matched = [...new Set(matched)].map(str => str.split(',').map(Number));
  if (matched.length === 0) return false;
  // Clear matched tiles
  matched.forEach(([r, c]) => {
    board[r][c] = null;
  });
  // Increase score
  score += matched.length * 50;
  updateScoreMoves();
  setTimeout(() => {
    drawBoard();
    setTimeout(cascadeTiles, 200);
  }, 200);
  return true;
}

// Make tiles fall down and fill empty spaces
function cascadeTiles() {
  for (let c = 0; c < gridSize; c++) {
    for (let r = gridSize - 1; r >= 0; r--) {
      if (board[r][c] === null) {
        let above = r - 1;
        while (above >= 0 && board[above][c] === null) above--;
        if (above >= 0) {
          board[r][c] = board[above][c];
          board[above][c] = null;
        } else {
          board[r][c] = randomTile();
        }
      }
    }
  }
  drawBoard();
  setTimeout(() => {
    if (checkAndClearMatches()) {
      // Cascade again if new matches
    } else {
      checkLevelEnd();
    }
  }, 200);
}

// Check if level is complete or failed
function checkLevelEnd() {
  if (score >= scoreGoal) {
    clearInterval(timerInterval);
    document.getElementById('next-level').style.display = 'inline-block';
  } else if (moves >= movesLimit) {
    clearInterval(timerInterval);
    alert('Out of moves! Try again.');
    startLevel(level);
  }
}

// Update score, moves, and timer display
function updateScoreMoves() {
  document.getElementById('score').textContent = `Score: ${score}`;
  document.getElementById('moves').textContent = `Moves: ${moves}/${movesLimit}`;
}

function updateTimer() {
  timeLeft--;
  document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    alert('Time\'s up! Try again.');
    startLevel(level);
  }
}

// Start a new level
function startLevel(lvl) {
  level = lvl;
  if (level > levels.length) {
    alert('Congratulations! You completed all levels!');
    level = 1;
  }
  const lvlData = levels[level - 1];
  gridSize = lvlData.gridSize;
  scoreGoal = lvlData.scoreGoal;
  movesLimit = lvlData.movesLimit;
  timeLeft = lvlData.timeLimit;
  score = 0;
  moves = 0;
  selected = null;
  document.getElementById('level').textContent = `Level ${level} - Goal: ${scoreGoal} points in ${movesLimit} moves`;
  updateScoreMoves();
  document.getElementById('timer').textContent = `Time: ${timeLeft}s`;
  document.getElementById('next-level').style.display = 'none';
  createBoard();
  drawBoard();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  setTimeout(() => {
    while (checkAndClearMatches()) {
      cascadeTiles();
    }
  }, 100);
}

// Next level button handler
document.getElementById('next-level').onclick = () => {
  startLevel(level + 1);
};

// Loading screen fade out and start game
window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const body = document.body;
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    body.classList.add('visible');
    startLevel(1);
  }, 3000);
});
