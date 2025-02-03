import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const initialState = {
  squares: {} as { [key: string]: string },
  currentPlayer: "p1" as "p1" | "p2",
  turnNumber: 1,
  scores: { p1: 0, p2: 0 } as { p1: number; p2: number },
  edges: {} as { [key: string]: { player: string; turn: number } },
};

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.pathname.split('/').pop();
  
  if (!slug) {
    return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
  }

  let gameState = await redis.get(slug) as typeof initialState | null;
  if (!gameState) {
    gameState = initialState;
    await redis.set(slug, gameState);
  }
  return NextResponse.json(gameState);
}

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.pathname.split('/').pop();

  if (!slug) {
    return NextResponse.json({ message: 'Slug is required' }, { status: 400 });
  }

  const { row, col, direction } = await req.json();
  let gameState = await redis.get(slug) as typeof initialState | null;

  if (!gameState) {
    gameState = initialState;
  }

  const key = `${row}-${col}-${direction}`;
  if (gameState.edges[key]) {
    return NextResponse.json(gameState);
  }

  gameState.edges[key] = { player: gameState.currentPlayer, turn: gameState.turnNumber };

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
      newSquares[`${row - 1}-${col}`] = gameState.currentPlayer;
      squareCompleted = true;
      completedSquaresCount++;
    }
    if (
      row < 7 &&
      gameState.edges[`${row}-${col}-v`] &&
      gameState.edges[`${row + 1}-${col}-h`] &&
      gameState.edges[`${row}-${col + 1}-v`]
    ) {
      newSquares[`${row}-${col}`] = gameState.currentPlayer;
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
      newSquares[`${row}-${col - 1}`] = gameState.currentPlayer;
      squareCompleted = true;
      completedSquaresCount++;
    }
    if (
      col < 7 &&
      gameState.edges[`${row}-${col + 1}-v`] &&
      gameState.edges[`${row}-${col}-h`] &&
      gameState.edges[`${row + 1}-${col}-h`]
    ) {
      newSquares[`${row}-${col}`] = gameState.currentPlayer;
      squareCompleted = true;
      completedSquaresCount++;
    }
  }

  gameState.squares = newSquares;
  if (squareCompleted) {
    gameState.scores[gameState.currentPlayer] += completedSquaresCount;
  } else {
    gameState.currentPlayer = gameState.currentPlayer === "p1" ? "p2" : "p1";
  }

  gameState.turnNumber += 1;
  await redis.set(slug, gameState);

  return NextResponse.json(gameState);
}
