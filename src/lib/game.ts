
export type GameState = {
    squares: { [key: string]: string };
    currentplayer: "p1" | "p2";
    turnnumber: number;
    scores: { p1: number; p2: number };
    edges: { [key: string]: { player: string; turn: number } };
}

export function applyAction(gameState: GameState, action: { row: number, col: number, direction: string }) {
    const { row, col, direction } = action;
    const key = `${row}-${col}-${direction}`;
    if (gameState.edges[key]) {
      return gameState;
    }
  
    gameState.edges[key] = { player: gameState.currentplayer, turn: gameState.turnnumber };
  
    let squareCompleted = false;
    const newSquares = { ...gameState.squares };
    let completedSquaresCount = 0;
  
    if (direction === "h") {
      if (
        row > 0 &&
        gameState.edges[`${row - 1}-${col}-h`] &&
        gameState.edges[`${row - 1}-${col}-v`] &&
        gameState.edges[`${row - 1}-${col + 1}-v`]
      ) {
        newSquares[`${row - 1}-${col}`] = gameState.currentplayer;
        squareCompleted = true;
        completedSquaresCount++;
      }
      if (
        row < 7 &&
        gameState.edges[`${row}-${col}-v`] &&
        gameState.edges[`${row + 1}-${col}-h`] &&
        gameState.edges[`${row}-${col + 1}-v`]
      ) {
        newSquares[`${row}-${col}`] = gameState.currentplayer;
        squareCompleted = true;
        completedSquaresCount++;
      }
    } else {
      if (
        col > 0 &&
        gameState.edges[`${row}-${col - 1}-v`] &&
        gameState.edges[`${row}-${col - 1}-h`] &&
        gameState.edges[`${row + 1}-${col - 1}-h`]
      ) {
        newSquares[`${row}-${col - 1}`] = gameState.currentplayer;
        squareCompleted = true;
        completedSquaresCount++;
      }
      if (
        col < 7 &&
        gameState.edges[`${row}-${col + 1}-v`] &&
        gameState.edges[`${row}-${col}-h`] &&
        gameState.edges[`${row + 1}-${col}-h`]
      ) {
        newSquares[`${row}-${col}`] = gameState.currentplayer;
        squareCompleted = true;
        completedSquaresCount++;
      }
    }
  
    gameState.squares = newSquares;
    if (squareCompleted) {
      gameState.scores[gameState.currentplayer] += completedSquaresCount;
    } else {
      gameState.currentplayer = gameState.currentplayer === "p1" ? "p2" : "p1";
    }
  
    gameState.turnnumber += 1;
    return gameState;
  }