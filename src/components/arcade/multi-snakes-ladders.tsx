'use client';

import React, { useState, useEffect } from "react";
import { Dices, ArrowLeft, Trophy } from "lucide-react";
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

const BOARD_SIZE = 100;
const SNAKES: Record<number, number> = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS: Record<number, number> = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

export function SnakesLaddersMultiplayer({ matchId, role, opponentName, onLeave }: PVPProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [myPos, setMyPos] = useState(1);
  const [oppPos, setOppPos] = useState(1);
  const [myTurn, setMyTurn] = useState<boolean>(role === 'X'); 
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [rolling, setRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState(1);
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'roll' }, (payload) => {
        const { roll, finalPos } = payload.payload;
        setOppPos(finalPos);
        audio.playBlip(300);
        
        if (finalPos >= 100) {
          setGameOver('You Lost 😢');
          audio.playCrash();
        } else {
          setMyTurn(true);
        }
      })
      .subscribe();

    setChannel(newChannel);
    return () => { supabase.removeChannel(newChannel); };
  }, [matchId, supabase]);

  const handleRoll = () => {
    if ((!localMode && !myTurn) || gameOver || rolling) return;
    setRolling(true);
    if (!localMode) setMyTurn(false);
    
    // Animate roll
    let rolls = 0;
    const interval = setInterval(() => {
       setCurrentRoll(Math.floor(Math.random() * 6) + 1);
       audio.playBlip(800);
       rolls++;
       if (rolls > 10) {
         clearInterval(interval);
         const finalRoll = Math.floor(Math.random() * 6) + 1;
         setCurrentRoll(finalRoll);
         
         if (localMode) {
            let activePos = myTurn ? myPos : oppPos;
            let newPos = activePos + finalRoll;
            if (newPos > BOARD_SIZE) newPos = BOARD_SIZE - (newPos - BOARD_SIZE);
            
            if (SNAKES[newPos]) {
               newPos = SNAKES[newPos];
               audio.playCrash();
            } else if (LADDERS[newPos]) {
               newPos = LADDERS[newPos];
               audio.playDramatic3D(0, 1.2);
            } else {
               audio.playBlip(300);
            }

            if (myTurn) {
               setMyPos(newPos);
               if (newPos === BOARD_SIZE) { setGameOver('Player 1 Won! 🎉'); audio.playWin(); }
               else setMyTurn(false);
            } else {
               setOppPos(newPos);
               if (newPos === BOARD_SIZE) { setGameOver('Player 2 Won! 🎉'); audio.playWin(); }
               else setMyTurn(true);
            }
            setRolling(false);
            return;
         }
         
         let newPos = myPos + finalRoll;
         if (newPos > 100) newPos = 100 - (newPos - 100); // Bounce back
         
         // Check snakes and ladders
         if (SNAKES[newPos]) {
            newPos = SNAKES[newPos];
            audio.playCrash();
         } else if (LADDERS[newPos]) {
            newPos = LADDERS[newPos];
            audio.playDramatic3D(0, 1.5);
         } else {
            audio.playWin();
         }

         setMyPos(newPos);
         setRolling(false);

         if (channel) {
            channel.send({ type: 'broadcast', event: 'roll', payload: { roll: finalRoll, finalPos: newPos } });
         }

         if (newPos === 100) {
            setGameOver('You Won! 🎉');
            audio.playWin();
            saveGameScore(supabase, profile, 'Snakes and Ladders', 1, 'win');
         } else if (!channel) {
            // Bot logic
            setTimeout(() => {
               const botRoll = Math.floor(Math.random() * 6) + 1;
               let botNew = oppPos + botRoll;
               if (botNew > 100) botNew = 100 - (botNew - 100);
               if (SNAKES[botNew]) botNew = SNAKES[botNew];
               else if (LADDERS[botNew]) botNew = LADDERS[botNew];
               setOppPos(botNew);
               if (botNew === 100) setGameOver('You Lost 😢');
               else setMyTurn(true);
            }, 1000);
         }
       }
    }, 50);
  };

  const renderBoard = () => {
     const cells = [];
     for (let row = 9; row >= 0; row--) {
        for (let col = 0; col < 10; col++) {
           // Zig zag pattern
           const cellNum = row % 2 === 0 ? (row * 10) + col + 1 : (row * 10) + (9 - col) + 1;
           const isSnake = Object.keys(SNAKES).includes(cellNum.toString());
           const isLadder = Object.keys(LADDERS).includes(cellNum.toString());
           const hasMe = myPos === cellNum;
           const hasOpp = oppPos === cellNum;

           cells.push(
              <div key={cellNum} className={`relative aspect-square flex items-center justify-center border border-slate-700 text-[8px] sm:text-xs font-bold text-slate-500
                 ${isSnake ? 'bg-rose-900/40' : isLadder ? 'bg-emerald-900/40' : 'bg-slate-800'}`}>
                 <span className="absolute top-1 left-1 opacity-50">{cellNum}</span>
                 {isSnake && <span className="text-rose-500">🐍</span>}
                 {isLadder && <span className="text-emerald-500">🪜</span>}
                 
                 <div className="absolute inset-0 flex items-center justify-center gap-1">
                    {hasMe && <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary shadow-lg shadow-primary/50 animate-bounce" />}
                    {hasOpp && <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />}
                 </div>
              </div>
           );
        }
     }
     return cells;
  }

  if (!matchId && !localMode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Dices className="w-16 h-16 text-slate-300" />
        <h3 className="text-xl font-bold">Waiting for opponent...</h3>
        <p className="text-muted-foreground text-sm">Join a multiplayer match from the main menu.</p>
        <div className="flex flex-col gap-2 w-full">
           <Button variant="default" onClick={() => { setLocalMode(true); setMyTurn(true); }} className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-widest">Pass & Play Locally</Button>
           <Button variant="outline" onClick={onLeave}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 w-full">
      {(onLeave || localMode) && (
        <div className="w-full flex justify-start mb-4">
          <Button variant="ghost" size="sm" onClick={() => { if(localMode) setLocalMode(false); else if(onLeave) onLeave(); }} className="text-muted-foreground rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Leave Match
          </Button>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-lg space-y-4">
        
        {/* Status Bar */}
        <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-100 rounded-2xl">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-primary" />
             <div className={`text-sm font-bold ${role === 'X' || localMode ? 'text-primary' : 'text-slate-500'}`}>{localMode ? 'Player 1' : 'You'}</div>
          </div>
          <div className="flex flex-col items-center">
            {gameOver ? (
              <span className="font-black text-rose-500 uppercase tracking-widest">{gameOver}</span>
            ) : (
              <span className="font-bold text-slate-600 uppercase tracking-widest text-xs">
                {localMode ? (myTurn ? "P1 Turn" : "P2 Turn") : (myTurn ? "Your Turn" : "Enemy Turn")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
             <div className={`text-sm font-bold ${role === 'O' || localMode ? 'text-rose-500' : 'text-slate-500'}`}>{localMode ? 'Player 2' : opponentName || 'Enemy'}</div>
             <div className="w-3 h-3 rounded-full bg-rose-500" />
          </div>
        </div>

        {/* Board */}
        <div className="w-full aspect-square max-w-[400px] grid grid-cols-10 grid-rows-10 border-4 border-slate-900 rounded-lg overflow-hidden bg-slate-900">
           {renderBoard()}
        </div>
        
        {/* Dice Area */}
        {!gameOver && (
           <div className="flex flex-col items-center mt-4">
             <div className="w-16 h-16 rounded-xl bg-slate-100 border-4 border-slate-300 flex items-center justify-center text-3xl font-black text-slate-800 mb-4 shadow-xl">
                {currentRoll}
             </div>
             <Button 
                size="lg" 
                onClick={handleRoll} 
                disabled={(!localMode && !myTurn) || rolling}
                className="rounded-xl font-black uppercase tracking-widest px-8 shadow-lg bg-blue-500 hover:bg-blue-600"
             >
                <Dices className="w-5 h-5 mr-2" /> 
                {localMode ? (rolling ? 'Rolling...' : `Roll Dice (${myTurn ? 'P1' : 'P2'})`) : (myTurn ? (rolling ? 'Rolling...' : 'Roll Dice') : 'Waiting...')}
             </Button>
           </div>
        )}

      </div>
    </div>
  );
}
