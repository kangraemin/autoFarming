// Generate path for the current stage
function generatePath() {
  const stageIdx = state.currentStageIndex || 0;
  const { path, pathSet } = generatePathForStage(stageIdx);
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
