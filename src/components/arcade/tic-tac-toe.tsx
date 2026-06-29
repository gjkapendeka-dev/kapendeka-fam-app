"use client";

import React from "react";
import { X, Circle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";

interface TicTacToeProps {
  matchId?: string;
  role?: 'X' | 'O';
  onLeave?: () => void;
}

export function TicTacToe({ matchId, role, onLeave }: TicTacToeProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [board, setBoard] = React.useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = React.useState(true);
  const [channel, setChannel] = React.useState<any>(null);

  // Networking Setup
  React.useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'move' }, (payload) => {
        setBoard(payload.payload.board);
        setXIsNext(payload.payload.xIsNext);
      })
      .on('broadcast', { event: 'reset' }, () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [matchId, supabase]);

  const calculateWinner = (squares: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(s => s !== null);

  const handleClick = (i: number) => {
    if (board[i] || winner) return;
    
    // If in multiplayer, prevent moves out of turn
    if (matchId && role) {
      if ((xIsNext && role !== 'X') || (!xIsNext && role !== 'O')) {
        return; // Not your turn
      }
    }

    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O';
    const nextTurn = !xIsNext;
    
    setBoard(newBoard);
    setXIsNext(nextTurn);

    // Broadcast the move
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'move',
        payload: { board: newBoard, xIsNext: nextTurn }
      });
    }
  };
  
  const resetLocal = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'reset',
        payload: {}
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4 relative w-full">
      {matchId && (
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" onClick={onLeave} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave Match
          </Button>
        </div>
      )}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Tic-Tac-Toe</h3>
        {matchId && (
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            Multiplayer Match - You are {role}
          </div>
        )}
        <p className="text-muted-foreground font-medium text-sm mt-2">
          {winner ? `Winner: ${winner}!` : isDraw ? "It's a Draw!" : `Next Player: ${xIsNext ? 'X' : 'O'}`}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 bg-muted/20 p-4 rounded-[2rem] shadow-inner">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={matchId ? (xIsNext && role !== 'X') || (!xIsNext && role !== 'O') || winner !== null : false}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm active:scale-95 transition-all disabled:opacity-80"
          >
            {cell === 'X' && <X className="h-10 w-10 text-primary" />}
            {cell === 'O' && <Circle className="h-10 w-10 text-accent" />}
          </button>
        ))}
      </div>
      <Button onClick={resetLocal} variant="outline" className="h-12 px-4 rounded-full font-bold border-primary text-primary">
        Reset Game
      </Button>
    </div>
  );
}
