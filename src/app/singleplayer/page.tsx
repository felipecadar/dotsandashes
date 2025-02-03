"use client";

import { useState } from "react";
import clsx from "clsx";

export default function Page() {
  const [rows, setRows] = useState(8);
  const [columns, setColumns] = useState(8);
  // const [dotSize, setDotSize] = useState(12);
  // const [dotSpacing, setDotSpacing] = useState(60);
  const dotSize = 12;
  const dotSpacing = 60;
  const [edges, setEdges] = useState<{
    [key: string]: { player: string; turn: number };
  }>({});
  const [squares, setSquares] = useState<{ [key: string]: string }>({}); // Stores completed squares
  const [currentPlayer, setCurrentPlayer] = useState<"p1" | "p2">("p1");
  const [turnNumber, setTurnNumber] = useState(1);
  const [scores, setScores] = useState<{ p1: number; p2: number }>({
    p1: 0,
    p2: 0,
  });

  const handleClick = (row: number, col: number, direction: "h" | "v") => {
    const key = `${row}-${col}-${direction}`;

    if (edges[key]) return; // Edge already taken

    console.log(
      `Clicked: ${key}, Current Player: ${currentPlayer}, Turn: ${turnNumber}`
    );

    // Create a copy of the current edges to check for square completion
    const newEdges = {
      ...edges,
      [key]: { player: currentPlayer, turn: turnNumber },
    };

    let squareCompleted = false;
    const newSquares = { ...squares };
    let completedSquaresCount = 0;

    // Check if this move completes a square
    if (direction === "h") {
      if (
        row > 0 &&
        newEdges[`${row - 1}-${col}-h`] &&
        newEdges[`${row - 1}-${col}-v`] &&
        newEdges[`${row - 1}-${col + 1}-v`]
      ) {
        newSquares[`${row - 1}-${col}`] = currentPlayer;
        squareCompleted = true;
        completedSquaresCount++;
      }
      if (
        row < rows - 1 &&
        newEdges[`${row}-${col}-v`] &&
        newEdges[`${row + 1}-${col}-h`] &&
        newEdges[`${row}-${col + 1}-v`]
      ) {
        newSquares[`${row}-${col}`] = currentPlayer;
        squareCompleted = true;
        completedSquaresCount++;
      }
    } else {
      if (
        col > 0 &&
        newEdges[`${row}-${col - 1}-v`] &&
        newEdges[`${row}-${col - 1}-h`] &&
        newEdges[`${row + 1}-${col - 1}-h`]
      ) {
        newSquares[`${row}-${col - 1}`] = currentPlayer;
        squareCompleted = true;
        completedSquaresCount++;
      }
      if (
        col < columns - 1 &&
        newEdges[`${row}-${col + 1}-v`] &&
        newEdges[`${row}-${col}-h`] &&
        newEdges[`${row + 1}-${col}-h`]
      ) {
        newSquares[`${row}-${col}`] = currentPlayer;
        squareCompleted = true;
        completedSquaresCount++;
      }
    }

    // Update state **only once** after determining if a square was completed
    setEdges(newEdges);
    if (squareCompleted) {
      setSquares(newSquares);
      setScores((prevScores) => ({
        ...prevScores,
        [currentPlayer]: prevScores[currentPlayer] + completedSquaresCount,
      }));
    } else {
      console.log("Switching turn");
      setCurrentPlayer((prev) => (prev === "p1" ? "p2" : "p1"));
    }

    setTurnNumber((prev) => prev + 1);
  };
  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-2xl font-bold mb-4">Dots and Boxes</h2>
      <div className="flex gap-4 mb-4">
        <div>
          <label className="block text-lg font-semibold mb-2">Rows:</label>
          <input
            type="number"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            className="w-20 p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-lg font-semibold mb-2">Columns:</label>
          <input
            type="number"
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            className="w-20 p-2 border border-gray-300 rounded"
          />
        </div>
      </div>
      <p className="mb-4 text-lg font-semibold">
        Current Turn:{" "}
        <span className="text-blue-600">{currentPlayer.toUpperCase()}</span>
      </p>
      <p className="mb-4 text-lg font-semibold">
        Score - P1: <span className="text-red-500">{scores.p1}</span> | P2:{" "}
        <span className="text-green-500">{scores.p2}</span>
      </p>

      <div
        className="grid gap-0"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${dotSpacing}px)`,
        }}
      >
        {[...Array(rows)].map((_, row) =>
          [...Array(columns)].map((_, col) => (
            <div
              key={`cell-${row}-${col}`}
              className="relative"
              style={{
                width: `${dotSpacing}px`,
                height: `${dotSpacing}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {/* Square background when completed */}
              {squares[`${row}-${col}`] && (
                <div
                  className={clsx(
                    "absolute w-full h-full",
                    squares[`${row}-${col}`] === "p1"
                      ? "bg-red-300"
                      : "bg-green-300"
                  )}
                />
              )}

              {/* Horizontal Edge - Render only if not last column */}
              {col < columns - 1 && (
                <div
                  className={clsx(
                    "absolute cursor-pointer hover:bg-gray-500 transition-colors duration-200",
                    edges[`${row}-${col}-h`]
                      ? edges[`${row}-${col}-h`].player === "p1"
                        ? "bg-red-500"
                        : "bg-green-500"
                      : "bg-gray-200"
                  )}
                  style={{
                    width: `${dotSpacing}px`,
                    height: `${dotSize / 3}px`,
                    top: `-${dotSize / 6}px`,
                    left: `0px`,
                  }}
                  onClick={() => handleClick(row, col, "h")}
                />
              )}

              {/* Vertical Edge - Render only if not last row */}
              {row < rows - 1 && (
                <div
                  className={clsx(
                    "absolute cursor-pointer hover:bg-gray-500 transition-colors duration-200",
                    edges[`${row}-${col}-v`]
                      ? edges[`${row}-${col}-v`].player === "p1"
                        ? "bg-red-500"
                        : "bg-green-500"
                      : "bg-gray-200"
                  )}
                  style={{
                    width: `${dotSize / 3}px`,
                    height: `${dotSpacing}px`,
                    left: `-${dotSize / 6}px`,
                    top: `0px`,
                  }}
                  onClick={() => handleClick(row, col, "v")}
                />
              )}

              {/* Dot */}
              <div
                className="bg-black rounded-full"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  position: "absolute",
                  zIndex: 2,
                  top: `-${dotSize/2}px`,
                  left: `-${dotSize/2}px`,
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
