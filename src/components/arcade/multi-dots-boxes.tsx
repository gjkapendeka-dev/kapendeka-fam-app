"use client";

import React from "react";
import { Grid3x3, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";
import { cn } from "@/lib/utils";

interface DotsBoxesProps {
  matchId?: string;
  role?: 'X' | 'O';
  opponentName?: string;
  onLeave?: () => void;
}

export function DotsAndBoxesMultiplayer({ matchId, role, opponentName, onLeave }: DotsBoxesProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const GRID_SIZE = 3;
  // State representation: 
  // hLines: boolean array of horizontal lines [GRID_SIZE + 1][GRID_SIZE]
  // vLines: boolean array of vertical lines [GRID_SIZE][GRID_SIZE + 1]
  // boxes: string array of box owners (null, 'X', 'O') [GRID_SIZE][GRID_SIZE]
  
  const [hLines, setHLines] = React.useState<(string | null)[][]>(Array(GRID_SIZE + 1).fill(null).map(() => Array(GRID_SIZE).fill(null)));
  const [vLines, setVLines] = React.useState<(string | null)[][]>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE + 1).fill(null)));
  const [boxes, setBoxes] = React.useState<(string | null)[][]>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
  
  const [xIsNext, setXIsNext] = React.useState(true);
  const [channel, setChannel] = React.useState<any>(null);

  React.useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'move' }, (payload) => {
        setHLines(payload.payload.hLines);
        setVLines(payload.payload.vLines);
        setBoxes(payload.payload.boxes);
        setXIsNext(payload.payload.xIsNext);
      })
      .on('broadcast', { event: 'reset' }, () => {
        setHLines(Array(GRID_SIZE + 1).fill(null).map(() => Array(GRID_SIZE).fill(null)));
        setVLines(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE + 1).fill(null)));
        setBoxes(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
        setXIsNext(true);
      })
      .subscribe();

    setChannel(newChannel);
    return () => { supabase.removeChannel(newChannel); };
  }, [matchId, supabase]);

  const xScore = boxes.flat().filter(b => b === 'X').length;
  const oScore = boxes.flat().filter(b => b === 'O').length;
  const isGameOver = xScore + oScore === GRID_SIZE * GRID_SIZE;
  const winner = xScore > oScore ? 'X' : oScore > xScore ? 'O' : 'Draw';

  React.useEffect(() => {
    if (isGameOver) {
      if ((winner === 'X' && role === 'X') || (winner === 'O' && role === 'O')) {
        saveScore();
      }
    }
  }, [isGameOver, winner, role]);

  const saveScore = async () => {
    if (!supabase || !profile) return;
    const payload = {
      family_id: profile.family_id,
      member_id: profile.id,
      game: 'Dots & Boxes',
      wins: 1,
      updated_at: new Date().toISOString()
    };
    await supabase.from('arcade_scores').insert([payload]);
  };

  const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
    if (isGameOver) return;
    if (role && ((xIsNext && role !== 'X') || (!xIsNext && role !== 'O'))) return; // Not your turn

    const newHLines = hLines.map(row => [...row]);
    const newVLines = vLines.map(row => [...row]);
    let validMove = false;

    if (type === 'h' && !newHLines[r][c]) {
      newHLines[r][c] = xIsNext ? 'X' : 'O';
      validMove = true;
    } else if (type === 'v' && !newVLines[r][c]) {
      newVLines[r][c] = xIsNext ? 'X' : 'O';
      validMove = true;
    }

    if (!validMove) return;

    let boxesFilled = 0;
    const newBoxes = boxes.map(row => [...row]);

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!newBoxes[i][j] && newHLines[i][j] && newHLines[i+1][j] && newVLines[i][j] && newVLines[i][j+1]) {
          newBoxes[i][j] = xIsNext ? 'X' : 'O';
          boxesFilled++;
        }
      }
    }

    setHLines(newHLines);
    setVLines(newVLines);
    setBoxes(newBoxes);
    
    const nextTurn = boxesFilled > 0 ? xIsNext : !xIsNext;
    setXIsNext(nextTurn);

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'move',
        payload: { hLines: newHLines, vLines: newVLines, boxes: newBoxes, xIsNext: nextTurn }
      });
    }
  };

  const resetLocal = () => {
    if (!matchId) {
      setHLines(Array(GRID_SIZE + 1).fill(null).map(() => Array(GRID_SIZE).fill(null)));
      setVLines(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE + 1).fill(null)));
    }
    setBoxes(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setXIsNext(true);
    
    if (channel) {
      channel.send({ type: 'broadcast', event: 'reset', payload: {} });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4 relative w-full h-full min-h-[400px]">
      {matchId && (
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" onClick={onLeave} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave Match
          </Button>
        </div>
      )}
      
      <div className="text-center space-y-2 mt-8">
        <h3 className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
          <Grid3x3 className="h-6 w-6" /> Dots & Boxes
        </h3>
        {matchId && (
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            You are {role}
          </div>
        )}
        <p className="text-sm font-bold text-muted-foreground">
          {isGameOver ? (winner === 'Draw' ? "It's a Draw!" : `${winner} Wins! 🎉`) : `Turn: ${xIsNext ? 'X' : 'O'}`}
        </p>
      </div>

      <div className="flex w-full max-w-md justify-between px-8 py-2 bg-muted/20 rounded-3xl">
        <div className="text-center">
          <p className="font-bold text-blue-500">{matchId ? (role === 'X' ? 'You' : opponentName || 'Opponent') : 'Player X'}</p>
          <p className="text-2xl font-black text-blue-500">{xScore}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-red-500">{matchId ? (role === 'O' ? 'You' : opponentName || 'Opponent') : 'Player O'}</p>
          <p className="text-2xl font-black text-red-500">{oScore}</p>
        </div>
      </div>

      <div className="relative mt-8 select-none touch-none" style={{ width: 240, height: 240 }}>
        {/* Render horizontal lines */}
        {hLines.map((row, r) => 
          row.map((val, c) => (
            <div 
              key={`h-${r}-${c}`}
              onClick={() => handleLineClick('h', r, c)}
              className={cn(
                "absolute cursor-pointer rounded-full transition-colors",
                val === 'X' ? "bg-blue-500" : val === 'O' ? "bg-red-500" : "bg-slate-200 hover:bg-slate-300"
              )}
              style={{ top: r * 70, left: c * 70 + 10, width: 60, height: 10, zIndex: 10 }}
            />
          ))
        )}
        {/* Render vertical lines */}
        {vLines.map((row, r) => 
          row.map((val, c) => (
            <div 
              key={`v-${r}-${c}`}
              onClick={() => handleLineClick('v', r, c)}
              className={cn(
                "absolute cursor-pointer rounded-full transition-colors",
                val === 'X' ? "bg-blue-500" : val === 'O' ? "bg-red-500" : "bg-slate-200 hover:bg-slate-300"
              )}
              style={{ top: r * 70 + 10, left: c * 70, width: 10, height: 60, zIndex: 10 }}
            />
          ))
        )}
        {/* Render dots */}
        {Array(GRID_SIZE + 1).fill(0).map((_, r) => 
          Array(GRID_SIZE + 1).fill(0).map((_, c) => (
            <div 
              key={`d-${r}-${c}`}
              className="absolute bg-slate-900 rounded-full"
              style={{ top: r * 70 - 2, left: c * 70 - 2, width: 14, height: 14, zIndex: 20 }}
            />
          ))
        )}
        {/* Render boxes */}
        {boxes.map((row, r) => 
          row.map((val, c) => (
            <div 
              key={`b-${r}-${c}`}
              className={cn(
                "absolute flex items-center justify-center text-3xl font-black transition-all",
                val === 'X' ? "text-blue-500" : "text-red-500"
              )}
              style={{ top: r * 70 + 10, left: c * 70 + 10, width: 60, height: 60 }}
            >
              {val}
            </div>
          ))
        )}
      </div>

      {isGameOver && (
        <Button onClick={resetLocal} variant="outline" className="h-12 px-8 rounded-full font-bold border-primary text-primary mt-8">
          <RefreshCw className="h-4 w-4 mr-2" /> Play Again
        </Button>
      )}
    </div>
  );
}
