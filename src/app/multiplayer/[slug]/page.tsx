"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from 'next/navigation';

import clsx from "clsx";
import axios from "axios";

import { createClient } from '@/utils/supabase/client'

export default function Page() {
  const supabase = createClient()
  const rows = 8;
  const columns = 8;
  const dotSize = 12;
  const dotSpacing = 60;
  const [edges, setEdges] = useState<{
    [key: string]: { player: string; turn: number };
  }>({});
  const [squares, setSquares] = useState<{ [key: string]: string }>({});
  const [currentPlayer, setCurrentPlayer] = useState<"p1" | "p2">("p1");
  const [turnNumber, setTurnNumber] = useState(1);
  const [scores, setScores] = useState<{ p1: number; p2: number }>({
    p1: 0,
    p2: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [player, setPlayer] = useState<"p1" | "p2">("p1");

  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const channel = supabase.channel(`multiplayer:${params.slug}`)

  async function fetchGameState() {
    try{
      const response = await axios.get(`/api/multiplayer/${params.slug}`);
      const data = response.data;
      
      if (JSON.stringify(data.squares) !== JSON.stringify(squares)) {
        setSquares(data.squares);
      }
      if (data.currentplayer !== currentPlayer) {
        setCurrentPlayer(data.currentplayer);
      }
      if (data.turnnumber !== turnNumber) {
        setTurnNumber(data.turnnumber);
      }
      if (JSON.stringify(data.scores) !== JSON.stringify(scores)) {
        setScores(data.scores);
      }
      if (JSON.stringify(data.edges) !== JSON.stringify(edges)) {
        setEdges(data.edges || {});
      }
      setIsLoaded(true);
    }
    catch(error){
      console.error("Error fetching game state:", error);
    }
  }

  useEffect(() => {
    fetchGameState()
  }, [])

  channel
    .on('postgres_changes', 
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `slug=eq.${params.slug}`
      },
      () => {
        fetchGameState()
      }
    )
    .subscribe()

  useEffect(() => {
    const assignedPlayer = searchParams.get('player') as "p1" | "p2";
    if (assignedPlayer) {
      setPlayer(assignedPlayer);
    }
  }, [searchParams]);

  const handleClick = async (row: number, col: number, direction: "h" | "v") => {
    if (currentPlayer !== player) return;

    const key = `${row}-${col}-${direction}`;
    if (edges[key]) return;

    try {
      await axios.post(`/api/multiplayer/${params.slug}`, { action: { row, col, direction }, gameState: { squares, currentplayer: currentPlayer, turnnumber: turnNumber, scores, edges } });
    } catch (error) {
      console.error("Error updating game state:", error);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center p-4">
      <p className="mb-4 text-lg font-semibold">
        Current Turn:{" "}
        <span className="text-blue-600">{turnNumber}</span> -{" "}
        <span className="text-blue-600">{currentPlayer?.toUpperCase()}</span>
      </p>
      <p className="mb-4 text-lg font-semibold">
        Score - P1: <span className="text-red-500">{scores.p1}</span> | P2:{" "}
        <span className="text-green-500">{scores.p2}</span>
      </p>
      <p className="mb-4 text-lg font-semibold">
        Session ID: <span className="text-gray-500">{params.slug}</span>
      </p>
      <p className="mb-4 text-lg font-semibold">
        You are:{" "}
        <span className={player === "p1" ? "text-red-500" : "text-green-500"}>
          {player.toUpperCase()}
        </span>
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

              <div
                className="bg-black rounded-full"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  position: "absolute",
                  zIndex: 2,
                  top: `-${dotSize / 2}px`,
                  left: `-${dotSize / 2}px`,
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
