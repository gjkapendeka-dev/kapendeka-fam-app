'use client';

import React, { useState, useEffect } from "react";
import { Ship, Crosshair, ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";
import { audio } from "@/lib/audio";
import { saveGameScore } from '@/lib/arcade-utils'

interface PVPProps {
  matchId?: string;
  role?: 'X' | 'O';
  opponentName?: string;
  onLeave?: () => void;
}

const BOARD_SIZE = 8;
const NUM_SHIPS = 5;

// MVP Sea Battle: Each player gets a random board with 5 ships hidden (1x1 size for MVP simplicity)
export function SeaBattleMultiplayer({ matchId, role, opponentName, onLeave }: PVPProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [myBoard, setMyBoard] = useState<boolean[][]>(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false)));
  const [opponentBoardGuesses, setOpponentBoardGuesses] = useState<number[][]>(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))); // 0=unknown, 1=miss, 2=hit
  const [myBoardReceivedHits, setMyBoardReceivedHits] = useState<number[][]>(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0)));

  const [myTurn, setMyTurn] = useState<boolean>(role === 'X'); // X goes first
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [localMode, setLocalMode] = useState(false);

  // Generate random board
  useEffect(() => {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));
    let placed = 0;
    while (placed < NUM_SHIPS) {
      const r = Math.floor(Math.random() * BOARD_SIZE);
      const c = Math.floor(Math.random() * BOARD_SIZE);
      if (!board[r][c]) {
        board[r][c] = true;
        placed++;
      }
    }
    setMyBoard(board);
  }, []);

  // Networking
  useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'shoot' }, (payload) => {
        const { r, c } = payload.payload;
        // Check if hit my board
        const hit = myBoard[r][c];
        
        setMyBoardReceivedHits(prev => {
          const newHits = [...prev.map(row => [...row])];
          newHits[r][c] = hit ? 2 : 1;
          return newHits;
        });

        if (hit) {
           audio.playExplosion();
        } else {
           audio.playBlip(200);
        }

        // Send result back to opponent
        newChannel.send({
          type: 'broadcast',
          event: 'result',
          payload: { r, c, hit, remaining: getRemainingShips() - (hit ? 1 : 0) }
        });

        // Check if I lost
        if (getRemainingShips() - (hit ? 1 : 0) <= 0) {
          setGameOver('You Lost 😢');
          newChannel.send({ type: 'broadcast', event: 'gameover', payload: { winner: 'them' } });
        }

        setMyTurn(true);
      })
      .on('broadcast', { event: 'result' }, (payload) => {
        const { r, c, hit } = payload.payload;
        
        if (hit) {
           audio.playExplosion();
        } else {
           audio.playBlip(300);
        }

        setOpponentBoardGuesses(prev => {
          const newGuesses = [...prev.map(row => [...row])];
          newGuesses[r][c] = hit ? 2 : 1;
          return newGuesses;
        });
      })
      .on('broadcast', { event: 'gameover' }, (payload) => {
         if (payload.payload.winner === 'them') {
            setGameOver('You Won! 🎉');
            audio.playWin();
            saveGameScore(supabase, profile, 'Sea Battle', 1, 'win');
         }
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, supabase, myBoard]);

  const getRemainingShips = () => {
    let hits = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
       for (let c = 0; c < BOARD_SIZE; c++) {
          if (myBoard[r][c] && myBoardReceivedHits[r][c] === 2) hits++;
       }
    }
    return NUM_SHIPS - hits;
  };

  const handleShoot = (r: number, c: number) => {
    if (!myTurn || gameOver || opponentBoardGuesses[r][c] !== 0) return;
    
    setMyTurn(false);
    audio.playBlip(400);

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'shoot',
        payload: { r, c }
      });
    } else {
      // Bot mode
      const hit = Math.random() > 0.7;
      setTimeout(() => {
        setOpponentBoardGuesses(prev => {
          const newG = [...prev.map(row => [...row])];
          newG[r][c] = hit ? 2 : 1;
          return newG;
        });
        setMyTurn(true);
        if (hit) audio.playExplosion();
      }, 500);
    }
  };

  if (!matchId && !localMode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h3 className="text-xl font-bold">Waiting for opponent...</h3>
        <p className="text-muted-foreground text-sm">Join a multiplayer match from the main menu.</p>
        <div className="flex flex-col gap-2 w-full max-w-[200px]">
           <Button variant="default" onClick={() => { setLocalMode(true); if(typeof setMyTurn !== 'undefined') setMyTurn(true); }} className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-widest">Practice Locally</Button>
           <Button variant="outline" onClick={() => { if(localMode) setLocalMode(false); else if(onLeave) onLeave(); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      {(onLeave || localMode) && (
        <div className="w-full flex justify-start mb-4">
          <Button variant="ghost" size="sm" onClick={() => { if(localMode) setLocalMode(false); else if(onLeave) onLeave(); }} className="text-muted-foreground rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Leave Match
          </Button>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-sm space-y-6">
        
        {/* Status Bar */}
        <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-100 rounded-2xl">
          <div className={`text-sm font-bold ${role === 'X' ? 'text-primary' : 'text-slate-500'}`}>You</div>
          <div className="flex flex-col items-center">
            {gameOver ? (
              <span className="font-black text-rose-500 uppercase tracking-widest">{gameOver}</span>
            ) : (
              <span className="font-bold text-slate-600 uppercase tracking-widest text-xs">
                {myTurn ? "Your Turn" : "Enemy Turn"}
              </span>
            )}
          </div>
          <div className={`text-sm font-bold ${role === 'O' ? 'text-rose-500' : 'text-slate-500'}`}>{opponentName || 'Enemy'}</div>
        </div>

        {/* Enemy Waters */}
        <div className="w-full space-y-2">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-2">
              <Crosshair className="w-4 h-4 text-rose-500" /> Target Grid
           </h4>
           <div className={`grid grid-cols-8 gap-1 p-2 rounded-2xl bg-slate-900 border-4 ${myTurn && !gameOver ? 'border-primary shadow-lg shadow-primary/20' : 'border-slate-800'}`}>
              {opponentBoardGuesses.map((row, r) => row.map((cell, c) => (
                <div 
                  key={`opp-${r}-${c}`} 
                  onClick={() => handleShoot(r, c)}
                  className={`aspect-square rounded-sm flex items-center justify-center transition-colors cursor-pointer
                    ${cell === 0 ? 'bg-slate-700 hover:bg-slate-600' : 
                      cell === 1 ? 'bg-slate-500/30' : 'bg-rose-500'}`}
                >
                  {cell === 2 && <Crosshair className="w-3 h-3 text-white" />}
                </div>
              )))}
           </div>
        </div>

        {/* My Fleet */}
        <div className="w-full space-y-2 opacity-80">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-2">
              <Ship className="w-4 h-4 text-emerald-500" /> Your Fleet (Remaining: {getRemainingShips()})
           </h4>
           <div className="grid grid-cols-8 gap-1 p-2 rounded-2xl bg-blue-900/20 border-2 border-blue-900/10">
              {myBoard.map((row, r) => row.map((hasShip, c) => {
                 const hitState = myBoardReceivedHits[r][c];
                 return (
                  <div 
                    key={`my-${r}-${c}`} 
                    className={`aspect-square rounded-sm flex items-center justify-center
                      ${hitState === 1 ? 'bg-slate-300' : 
                        hitState === 2 ? 'bg-rose-500' : 
                        hasShip ? 'bg-emerald-500' : 'bg-blue-200/50'}`}
                  >
                     {hitState === 2 && <Crosshair className="w-3 h-3 text-white" />}
                  </div>
                 )
              }))}
           </div>
        </div>

      </div>
    </div>
  );
}
