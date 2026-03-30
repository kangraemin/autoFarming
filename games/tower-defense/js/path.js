// Generate a winding path from left to right
function generatePath() {
  const cols = CONFIG.COLS;
  const rows = CONFIG.ROWS;
  const path = [];
  const pathSet = new Set();

  // Create a zigzag path
  let row = Math.floor(rows / 2);
  let col = 0;

  // Entry from left
  for (let i = 0; i < 2; i++) {
    path.push({ col, row });
    pathSet.add(`${col},${row}`);
    col++;
  }

  // Zigzag segments
  const segments = 4;
  const segWidth = Math.floor((cols - 4) / segments);

  for (let s = 0; s < segments; s++) {
    const targetRow = s % 2 === 0 ? 2 : rows - 3;

    // Move vertically
    const dir = targetRow > row ? 1 : -1;
    while (row !== targetRow) {
      row += dir;
      path.push({ col, row });
      pathSet.add(`${col},${row}`);
    }

    // Move horizontally
    for (let i = 0; i < segWidth; i++) {
      col++;
      if (col >= cols - 1) break;
      path.push({ col, row });
      pathSet.add(`${col},${row}`);
    }
  }

  // Final stretch to right edge
  while (col < cols) {
    path.push({ col, row });
    pathSet.add(`${col},${row}`);
    col++;
  }

  state.path = path;
  state.pathSet = pathSet;
  state.gridOccupied = new Set();
}

function isPathTile(col, row) {
  return state.pathSet && state.pathSet.has(`${col},${row}`);
}

function isOccupied(col, row) {
  return state.gridOccupied && state.gridOccupied.has(`${col},${row}`);
}

function getPathPosition(index) {
  if (index < 0) return state.path[0];
  if (index >= state.path.length) return state.path[state.path.length - 1];
  return state.path[index];
}
