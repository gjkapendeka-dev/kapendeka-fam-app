'use client';

import React, { useState, useEffect } from "react";
import { Dices, ArrowLeft, RotateCcw, Trophy, Circle, CircleDot } from "lucide-react";
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

const BOARD_SIZE = 30;

export function LudoMultiplayer({ matchId, role, opponentName, onLeave }: PVPProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [myPos, setMyPos] = useState(0);
  const [oppPos, setOppPos] = useState(0);
  const [myTurn, setMyTurn] = useState<boolean>(role === 'X'); 
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [rolling, setRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState(1);

  useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'roll' }, (payload) => {
        const { roll, finalPos, oppFinalPos } = payload.payload;
        setOppPos(finalPos);
        setMyPos(oppFinalPos); // In case they bumped us back to 0
        
        audio.playBlip(300);
        
        if (finalPos >= BOARD_SIZE) {
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
    if (!myTurn || gameOver || rolling) return;
    setRolling(true);
    setMyTurn(false);
    
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
         
         let newPos = myPos + finalRoll;
         if (newPos > BOARD_SIZE) newPos = BOARD_SIZE - (newPos - BOARD_SIZE); // Bounce back
         
         let newOppPos = oppPos;
         
         // Bump opponent!
         if (newPos === oppPos && newPos !== 0 && newPos !== BOARD_SIZE) {
            newOppPos = 0;
            audio.playCrash();
         } else {
            audio.playDramatic3D(0, 1.2);
         }

         setMyPos(newPos);
         setOppPos(newOppPos);
         setRolling(false);

         if (channel) {
            channel.send({ type: 'broadcast', event: 'roll', payload: { roll: finalRoll, finalPos: newPos, oppFinalPos: newOppPos } });
         }

         if (newPos === BOARD_SIZE) {
            setGameOver('You Won! 🎉');
            audio.playWin();
            saveGameScore(supabase, profile, 'Mini Ludo', 1, 'win');
         } else if (!channel) {
            // Bot logic
            setTimeout(() => {
               const botRoll = Math.floor(Math.random() * 6) + 1;
               let botNew = newOppPos + botRoll;
               if (botNew > BOARD_SIZE) botNew = BOARD_SIZE - (botNew - BOARD_SIZE);
               let myNewPos = newPos;
               if (botNew === myNewPos && botNew !== 0 && botNew !== BOARD_SIZE) {
                  myNewPos = 0;
                  audio.playCrash();
               }
               
               setOppPos(botNew);
               setMyPos(myNewPos);
               if (botNew === BOARD_SIZE) setGameOver('You Lost 😢');
               else setMyTurn(true);
            }, 1000);
         }
       }
    }, 50);
  };

  const renderTrack = () => {
     const cells = [];
     for (let i = 0; i <= BOARD_SIZE; i++) {
        const hasMe = myPos === i;
        const hasOpp = oppPos === i;

        cells.push(
           <div key={i} className={`relative aspect-square flex items-center justify-center border border-slate-200 bg-white shadow-sm rounded-md`}>
              <span className="absolute top-0.5 left-1 text-[8px] text-slate-300 font-bold">{i}</span>
              <div className="flex gap-0.5 absolute inset-0 items-center justify-center">
                  {hasMe && <CircleDot className="w-5 h-5 text-blue-500 fill-blue-500/20" />}
                  {hasOpp && <CircleDot className="w-5 h-5 text-rose-500 fill-rose-500/20" />}
              </div>
           </div>
        );
     }
     return cells;
  }

  if (!matchId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Dices className="w-16 h-16 text-slate-300" />
        <h3 className="text-xl font-bold">Waiting for opponent...</h3>
        <p className="text-muted-foreground text-sm">Join a multiplayer match from the main menu.</p>
        <Button variant="outline" onClick={onLeave}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 w-full">
      {onLeave && (
        <div className="w-full flex justify-start mb-4">
          <Button variant="ghost" size="sm" onClick={onLeave} className="text-muted-foreground rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Leave Match
          </Button>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-2xl space-y-4">
        
        {/* Status Bar */}
        <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-100 rounded-2xl">
          <div className="flex items-center gap-2">
             <CircleDot className="w-4 h-4 text-blue-500" />
             <div className={`text-sm font-bold ${role === 'X' ? 'text-primary' : 'text-slate-500'}`}>You</div>
          </div>
          <div className="flex flex-col items-center">
            {gameOver ? (
              <span className="font-black text-rose-500 uppercase tracking-widest">{gameOver}</span>
            ) : (
              <span className="font-bold text-slate-600 uppercase tracking-widest text-xs">
                {myTurn ? "Your Turn" : "Enemy Turn"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
             <div className={`text-sm font-bold ${role === 'O' ? 'text-rose-500' : 'text-slate-500'}`}>{opponentName || 'Enemy'}</div>
             <CircleDot className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        {/* Board Track */}
        <div className="w-full p-4 bg-slate-50 rounded-2xl border-4 border-slate-200 shadow-inner overflow-x-auto">
           <div className="grid grid-cols-10 gap-1 w-full min-w-[300px]">
              {renderTrack()}
           </div>
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
                disabled={!myTurn || rolling}
                className="rounded-xl font-black uppercase tracking-widest px-8 shadow-lg bg-blue-500 hover:bg-blue-600"
             >
                <Dices className="w-5 h-5 mr-2" /> 
                {myTurn ? (rolling ? 'Rolling...' : 'Roll Dice') : 'Waiting...'}
             </Button>
           </div>
        )}

      </div>
    </div>
  );
}
