"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import clsx from "clsx";
import axios from "axios";
import { createClient } from "@/utils/supabase/client";

const ROWS = 8,
  COLUMNS = 8;
export default function Page() {
  const supabase = useMemo(() => createClient(), []);
  const [dotSize, setDotSize] = useState(12);
  const [dotSpacing, setDotSpacing] = useState(60);
  const [edges, setEdges] = useState<Record<string, { player: string }>>({});
  const [squares, setSquares] = useState<Record<string, string>>({});
  const [currentPlayer, setCurrentPlayer] = useState("p1");
  const [turnNumber, setTurnNumber] = useState(1);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [player, setPlayer] = useState<"p1" | "p2">("p1");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([]);

  const params = useParams();
  const searchParams = useSearchParams();

  const fetchGameState = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/multiplayer/${params.slug}`);
      if (JSON.stringify(data.squares) !== JSON.stringify(squares))
        setSquares(data.squares);
      if (data.currentplayer !== currentPlayer)
        setCurrentPlayer(data.currentplayer);
      if (data.turnnumber !== turnNumber) setTurnNumber(data.turnnumber);
      if (JSON.stringify(data.scores) !== JSON.stringify(scores))
        setScores(data.scores);
      if (JSON.stringify(data.edges) !== JSON.stringify(edges))
        setEdges(data.edges || {});
      setIsLoaded(true);
    } catch (error) {
      console.error("Error fetching game state:", error);
    }
  }, [params.slug, squares, currentPlayer, turnNumber, scores, edges]);

  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  useEffect(() => {
    const channel = supabase
      .channel(`multiplayer:${params.slug}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `slug=eq.${params.slug}`,
        },
        fetchGameState
      )
      .subscribe();
    return () => {
      void channel.unsubscribe();
    };
  }, [params.slug, supabase, fetchGameState]);

  useEffect(() => {
    const channel = supabase
      .channel(`multiplayer:${params.slug}`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlinePlayers(Object.keys(state));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") channel.track({ player });
      });
    return () => {
      void channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const assigned = searchParams.get("player");
    if (assigned === "p1" || assigned === "p2") setPlayer(assigned);
  }, [searchParams]);

  useEffect(() => {
    const updateSpacing = () => {
      const calc = (window.innerWidth * 0.9) / COLUMNS;
      setDotSpacing(Math.min(60, Math.max(20, calc)));
      setDotSize(Math.min(12, Math.max(8, calc / 4)));
    };
    updateSpacing();
    window.addEventListener("resize", updateSpacing);
    return () => window.removeEventListener("resize", updateSpacing);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) setIsTouchDevice(true);
  }, []);

  const handleClick = useCallback(
    async (row: number, col: number, direction: "h" | "v") => {
      if (currentPlayer !== player) return;
      const key = `${row}-${col}-${direction}`;
      if (edges[key]) return;
      try {
        await axios.post(`/api/multiplayer/${params.slug}`, {
          action: { row, col, direction },
          gameState: {
            squares,
            currentplayer: currentPlayer,
            turnnumber: turnNumber,
            scores,
            edges,
          },
        });
      } catch (error) {
        console.error("Error updating game state:", error);
      }
    },
    [currentPlayer, player, edges, params.slug, squares, turnNumber, scores]
  );

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 rounded-lg shadow-lg bg-white p-4">
        <h2 className="text-center text-xl font-bold mb-4">Score</h2>
        <div className="text-center text-sm text-blue-500 mb-2">
          {currentPlayer === player ? "Your Turn" : "Wait..."}
        </div>
        <div className="flex justify-around gap-4">
          <div className="flex flex-col items-center">
        <span className="text-sm text-gray-500">You</span>
        <span className="mt-1 text-3xl font-bold text-green-600">
          {scores[player]}
        </span>
          </div>
          <div className="flex flex-col items-center">
        <span className="text-sm text-gray-500">Enemy</span>
        <span className="mt-1 text-3xl font-bold text-red-600">
          {scores[player === "p1" ? "p2" : "p1"]}
        </span>
          </div>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4 text-base">
        <div className="flex flex-col space-y-2">
          <div>
        <strong>Online:</strong> {onlinePlayers.length}
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <div>
        <strong>Session:</strong>{" "}
        <span className="text-gray-500">{params.slug}</span>
          </div>
        </div>
      </div>
      <div
        className="grid gap-0 ml-10"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, ${dotSpacing}px)` }}
      >
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLUMNS }).map((_, col) => (
            <div
              key={`cell-${row}-${col}`}
              className="relative"
              style={{
                width: dotSpacing,
                height: dotSpacing,
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
                    squares[`${row}-${col}`] === player
                      ? "bg-green-300"
                      : "bg-red-300"
                  )}
                />
              )}
              {col < COLUMNS - 1 && (
                <div
                  className={clsx(
                    "absolute cursor-pointer transition-colors duration-200",
                    !isTouchDevice && "hover:bg-gray-500",
                    edges[`${row}-${col}-h`]
                      ? edges[`${row}-${col}-h`].player === player
                        ? "bg-green-500"
                        : "bg-red-500"
                      : "bg-gray-200"
                  )}
                  style={{
                    width: dotSpacing,
                    height: dotSize / 3,
                    top: -dotSize / 6,
                    left: 0,
                  }}
                  onClick={() => handleClick(row, col, "h")}
                />
              )}
              {row < ROWS - 1 && (
                <div
                  className={clsx(
                    "absolute cursor-pointer transition-colors duration-200",
                    !isTouchDevice && "hover:bg-gray-500",
                    edges[`${row}-${col}-v`]
                      ? edges[`${row}-${col}-v`].player === player
                        ? "bg-green-500"
                        : "bg-red-500"
                      : "bg-gray-200"
                  )}
                  style={{
                    width: dotSize / 3,
                    height: dotSpacing,
                    left: -dotSize / 6,
                    top: 0,
                  }}
                  onClick={() => handleClick(row, col, "v")}
                />
              )}
              <div
                className="bg-black rounded-full"
                style={{
                  width: dotSize,
                  height: dotSize,
                  position: "absolute",
                  zIndex: 2,
                  top: -dotSize / 2,
                  left: -dotSize / 2,
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
