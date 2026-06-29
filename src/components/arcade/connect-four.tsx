"use client";

import React from "react";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";

const saveGameScore = async (supabase: any, profile: any, game: string, score: number, type: 'score' | 'win' | 'loss' | 'draw' = 'score') => {
  if (!supabase || !profile?.id) return;
  try {
    const { data: existing } = await supabase.from('arcade_scores').select('*').eq('member_id', profile.id).eq('game', game).single();
    if (existing) {
      const best = Math.max(existing.best_score || 0, score);
      await supabase.from('arcade_scores').update({
        score: type === 'score' ? score : (existing.score || 0),
        best_score: type === 'score' ? best : existing.best_score,
        wins: type === 'win' ? (existing.wins || 0) + 1 : existing.wins,
        losses: type === 'loss' ? (existing.losses || 0) + 1 : existing.losses,
        draws: type === 'draw' ? (existing.draws || 0) + 1 : existing.draws,
        last_played: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabase.from('arcade_scores').insert({
        member_id: profile.id,
        game,
        score: type === 'score' ? score : 0,
        best_score: type === 'score' ? score : 0,
        wins: type === 'win' ? 1 : 0,
        losses: type === 'loss' ? 1 : 0,
        draws: type === 'draw' ? 1 : 0,
        last_played: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Failed to save score:", err);
  }
};

interface ConnectFourProps {
  personalBest?: number;
  matchId?: string;
  role?: 'Red' | 'Yellow';
  onLeave?: () => void;
}

export function ConnectFour({ personalBest = 0, matchId, role, onLeave }: ConnectFourProps) {
  const supabase = useSupabase();
  const { profile } = useUser();
  const ROWS = 6;
  const COLS = 7;
  
  const [grid, setGrid] = React.useState<string[][]>(Array(ROWS).fill(0).map(() => Array(COLS).fill("")));
  const [currentPlayer, setCurrentPlayer] = React.useState('Red');
  const [winner, setWinner] = React.useState<string | null>(null);
  const [channel, setChannel] = React.useState<any>(null);

  React.useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'move' }, (payload) => {
        setGrid(payload.payload.grid);
        setCurrentPlayer(payload.payload.currentPlayer);
        setWinner(payload.payload.winner);
      })
      .on('broadcast', { event: 'reset' }, () => {
        setGrid(Array(ROWS).fill(0).map(() => Array(COLS).fill("")));
        setWinner(null);
        setCurrentPlayer('Red');
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [matchId, supabase]);

  const dropChip = (col: number) => {
    if (winner) return;

    // Prevent moving if playing multiplayer and it's not our turn
    if (matchId && role && currentPlayer !== role) return;

    const newGrid = [...grid.map(r => [...r])];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!newGrid[r][col]) {
        newGrid[r][col] = currentPlayer;
        
        const isWin = checkWin(newGrid, r, col, currentPlayer);
        const nextPlayer = isWin ? currentPlayer : (currentPlayer === 'Red' ? 'Yellow' : 'Red');
        
        setGrid(newGrid);
        if (isWin) {
          setWinner(currentPlayer);
          if (!matchId) saveGameScore(supabase, profile, 'Connect 4', 1, 'win');
        } else {
          setCurrentPlayer(nextPlayer);
        }

        if (channel) {
          channel.send({
            type: 'broadcast',
            event: 'move',
            payload: { grid: newGrid, currentPlayer: nextPlayer, winner: isWin ? currentPlayer : null }
          });
        }
        return;
      }
    }
  };

  const checkWin = (g: string[][], r: number, c: number, player: string) => {
    const dirs = [[0,1], [1,0], [1,1], [1,-1]];
    for (let [dr, dc] of dirs) {
      let count = 1;
      for (let i = 1; i <= 3; i++) {
        if (r+dr*i>=0 && r+dr*i<ROWS && c+dc*i>=0 && c+dc*i<COLS && g[r+dr*i][c+dc*i] === player) count++; else break;
      }
      for (let i = 1; i <= 3; i++) {
        if (r-dr*i>=0 && r-dr*i<ROWS && c-dc*i>=0 && c-dc*i<COLS && g[r-dr*i][c-dc*i] === player) count++; else break;
      }
      if (count >= 4) return true;
    }
    return false;
  };

  const reset = () => {
    setGrid(Array(ROWS).fill(0).map(() => Array(COLS).fill("")));
    setWinner(null);
    setCurrentPlayer('Red');

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'reset',
        payload: {}
      });
    }
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4 select-none relative w-full">
      {matchId && (
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" onClick={onLeave} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave Match
          </Button>
        </div>
      )}
      <h3 className="text-2xl font-bold text-primary">Connect Four</h3>
      {matchId && (
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-2">
          Multiplayer Match - You are {role}
        </div>
      )}
      <div className="flex justify-between w-full max-w-sm items-center">
        {winner ? (
          <div className="text-xl font-black animate-pulse text-emerald-600">{winner} Wins!</div>
        ) : (
          <div className="flex items-center gap-2 font-bold text-muted-foreground">
            Turn: <div className={`w-4 h-4 rounded-full ${currentPlayer === 'Red' ? 'bg-red-500' : 'bg-yellow-400'}`} /> {currentPlayer}
          </div>
        )}
        <Button size="sm" variant="outline" onClick={reset}>Reset</Button>
      </div>
      
      <div className="bg-blue-600 p-3 rounded-2xl shadow-xl border-b-8 border-blue-800">
        <div className="grid grid-cols-7 gap-2">
          {grid[0].map((_, c) => (
            <button 
              key={`top-${c}`} 
              onClick={() => dropChip(c)} 
              disabled={matchId ? (currentPlayer !== role || winner !== null) : false}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center -mt-2 pb-2 disabled:opacity-50"
            >
               <ArrowDown className="h-4 w-4 text-white opacity-50" />
            </button>
          ))}
          {grid.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} className="w-8 h-8 md:w-10 md:h-10 bg-blue-700 rounded-full shadow-inner overflow-hidden relative">
               <div className={`absolute inset-0 rounded-full transition-transform duration-500 ${cell === 'Red' ? 'bg-red-500 shadow-inner scale-100' : cell === 'Yellow' ? 'bg-yellow-400 shadow-inner scale-100' : 'bg-transparent scale-0'}`} />
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
