'use client';

import React, { useState, useEffect } from "react";
import { Swords, ArrowLeft, RotateCcw, Zap } from "lucide-react";
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

export function FruitDuelMultiplayer({ matchId, role, opponentName, onLeave }: PVPProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [myClicks, setMyClicks] = useState(0);
  const [oppClicks, setOppClicks] = useState(0);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [localMode, setLocalMode] = useState(false);

  const WIN_SCORE = 30;

  useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'click' }, (payload) => {
        const { score } = payload.payload;
        setOppClicks(score);
        audio.playBlip(300);
        
        if (score >= WIN_SCORE) {
          setGameOver('You Lost 😢');
          audio.playCrash();
        }
      })
      .subscribe();

    setChannel(newChannel);
    return () => { supabase.removeChannel(newChannel); };
  }, [matchId, supabase]);

  const handleSlice = (player: 'me' | 'opp' = 'me') => {
    if (gameOver) return;
    audio.playBlip(600);
    
    if (localMode) {
      if (player === 'me') {
        const newClicks = myClicks + 1;
        setMyClicks(newClicks);
        if (newClicks >= WIN_SCORE) { setGameOver('Player 1 Won! 🎉'); audio.playWin(); }
      } else {
        const newClicks = oppClicks + 1;
        setOppClicks(newClicks);
        if (newClicks >= WIN_SCORE) { setGameOver('Player 2 Won! 🎉'); audio.playWin(); }
      }
      return;
    }

    const newClicks = myClicks + 1;
    setMyClicks(newClicks);

    if (channel) {
       channel.send({ type: 'broadcast', event: 'click', payload: { score: newClicks } });
    }

    if (newClicks >= WIN_SCORE) {
       setGameOver('You Won! 🎉');
       audio.playWin();
       saveGameScore(supabase, profile, 'Fruit Duel', 1, 'win');
    } else if (!channel) {
       // Bot mode
       if (Math.random() > 0.5) {
          setTimeout(() => {
            setOppClicks(prev => {
                const next = prev + 1;
                if (next >= WIN_SCORE) {
                    setGameOver('You Lost 😢');
                    audio.playCrash();
                }
                return next;
            });
          }, 200);
       }
    }
  };

  if (!matchId && !localMode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Swords className="w-16 h-16 text-slate-300" />
        <h3 className="text-xl font-bold">Waiting for opponent...</h3>
        <p className="text-muted-foreground text-sm">Join a multiplayer match from the main menu.</p>
        <div className="flex flex-col gap-2 w-full">
           <Button variant="default" onClick={() => setLocalMode(true)} className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-widest">Pass & Play Locally</Button>
           <Button variant="outline" onClick={onLeave}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 w-full select-none">
      {(onLeave || localMode) && (
        <div className="w-full flex justify-start mb-4">
          <Button variant="ghost" size="sm" onClick={() => { if(localMode) setLocalMode(false); else if(onLeave) onLeave(); }} className="text-muted-foreground rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Leave Match
          </Button>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-sm space-y-8">
        
        <h2 className="text-3xl font-black italic uppercase tracking-widest text-emerald-500 flex items-center gap-2">
            Fruit <Swords className="w-8 h-8 text-rose-500" /> Duel
        </h2>

        {/* Health Bars */}
        <div className="w-full space-y-4">
            <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-emerald-500">You</span>
                    <span className="text-slate-400">{myClicks} / {WIN_SCORE}</span>
                </div>
                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(myClicks/WIN_SCORE)*100}%` }} />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-rose-500">{opponentName || 'Enemy'}</span>
                    <span className="text-slate-400">{oppClicks} / {WIN_SCORE}</span>
                </div>
                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200">
                    <div className="h-full bg-rose-500 transition-all" style={{ width: `${(oppClicks/WIN_SCORE)*100}%` }} />
                </div>
            </div>
        </div>

        {gameOver ? (
            <div className="flex flex-col items-center space-y-4 animate-in zoom-in">
                <div className={`text-4xl font-black uppercase tracking-widest ${gameOver.includes('Won') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {gameOver}
                </div>
            </div>
        ) : (
            <div className="flex gap-4 w-full justify-center">
              <Button 
                  onClick={() => handleSlice('me')}
                  className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-amber-400 hover:bg-amber-500 border-8 border-amber-200 shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center space-y-2 group"
              >
                  <Zap className="w-12 h-12 md:w-16 md:h-16 text-white group-active:scale-125 transition-transform" />
                  <span className="font-black text-white text-xl md:text-2xl uppercase tracking-widest">{localMode ? 'P1' : 'Slice!'}</span>
              </Button>
              {localMode && (
                <Button 
                    onClick={() => handleSlice('opp')}
                    className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-rose-400 hover:bg-rose-500 border-8 border-rose-200 shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center space-y-2 group"
                >
                    <Zap className="w-12 h-12 md:w-16 md:h-16 text-white group-active:scale-125 transition-transform" />
                    <span className="font-black text-white text-xl md:text-2xl uppercase tracking-widest">P2</span>
                </Button>
              )}
            </div>
        )}
      </div>
    </div>
  );
}
