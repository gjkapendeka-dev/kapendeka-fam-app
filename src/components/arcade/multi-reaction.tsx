"use client";

import React from "react";
import { Zap, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";
import { cn } from "@/lib/utils";

interface ReactionRaceProps {
  matchId?: string;
  role?: 'X' | 'O';
  opponentName?: string;
  onLeave?: () => void;
}

export function ReactionRaceMultiplayer({ matchId, role, opponentName, onLeave }: ReactionRaceProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [gameState, setGameState] = React.useState<'waiting' | 'ready' | 'go' | 'done'>('waiting');
  const [winner, setWinner] = React.useState<string | null>(null);
  const [channel, setChannel] = React.useState<any>(null);

  React.useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'state_change' }, (payload) => {
        setGameState(payload.payload.state);
        if (payload.payload.state === 'waiting') {
          setWinner(null);
        }
      })
      .on('broadcast', { event: 'reaction' }, (payload) => {
        setGameState('done');
        if (payload.payload.player !== role) {
          setWinner(`${matchId ? (opponentName || 'Opponent') : 'Opponent'} Wins! 😢`);
        } else {
          setWinner('You Win! 🎉');
        }
      })
      .on('broadcast', { event: 'false_start' }, (payload) => {
        setGameState('done');
        if (payload.payload.player !== role) {
          setWinner(`You Win! ${matchId ? (opponentName || 'Opponent') : 'Opponent'} false started. 🎉`);
        } else {
          setWinner(`${matchId ? (opponentName || 'Opponent') : 'Opponent'} Wins! You false started. 😢`);
        }
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [matchId, supabase, gameState]);

  const saveScore = async () => {
    if (!supabase || !profile) return;
    const payload = {
      family_id: profile.family_id,
      member_id: profile.id,
      game: 'Reaction Race',
      wins: 1,
      updated_at: new Date().toISOString()
    };
    await supabase.from('arcade_scores').insert([payload]);
  };

  const startSequence = () => {
    if (matchId && role !== 'X') return;
    
    setGameState('ready');
    setWinner(null);
    if (channel) {
      channel.send({ type: 'broadcast', event: 'state_change', payload: { state: 'ready' } });
    }

    const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
    setTimeout(() => {
      setGameState(currentState => {
        if (currentState === 'ready') {
          if (channel) {
            channel.send({ type: 'broadcast', event: 'state_change', payload: { state: 'go' } });
          }
          return 'go';
        }
        return currentState;
      });
    }, delay);
  };

  const handleTap = () => {
    if (gameState === 'waiting' || gameState === 'done') return;

    if (gameState === 'ready') {
      // False start!
      setGameState('done');
      setWinner('You Lose! False start! 😢');
      if (channel) {
        channel.send({ type: 'broadcast', event: 'false_start', payload: {} });
      }
    } else if (gameState === 'go') {
      // Valid tap!
      setGameState('done');
      setWinner('You Win! 🎉');
      saveScore();
      if (channel) {
        channel.send({ type: 'broadcast', event: 'tap', payload: {} });
      }
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
          <Zap className="h-6 w-6 text-yellow-500" /> Reaction Race
        </h3>
        <p className="text-sm font-bold text-muted-foreground">Tap when it turns green!</p>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full gap-8 mt-4">
        {gameState === 'waiting' ? (
          <div className="flex flex-col items-center gap-4">
            {!matchId || role === 'X' ? (
              <Button onClick={startSequence} className="h-16 px-12 rounded-full text-lg font-black bg-primary">
                {matchId ? 'Start Game' : 'Start Solo Practice'}
              </Button>
            ) : (
              <p className="font-bold text-muted-foreground animate-pulse">Waiting for host to start...</p>
            )}
          </div>
        ) : (
          <button 
            onClick={handleTap}
            disabled={gameState === 'done'}
            className={cn(
              "w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-2xl transition-all duration-100",
              gameState === 'ready' ? "bg-rose-500 scale-100" : 
              gameState === 'go' ? "bg-emerald-500 scale-105 shadow-[0_0_50px_rgba(16,185,129,0.5)]" : 
              "bg-slate-200 text-slate-400 scale-95"
            )}
          >
            {gameState === 'ready' && "WAIT..."}
            {gameState === 'go' && "TAP!"}
            {gameState === 'done' && winner}
          </button>
        )}

        {gameState === 'done' && role === 'X' && (
          <Button onClick={startSequence} variant="outline" className="h-12 px-8 rounded-full font-bold border-primary text-primary mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Play Again
          </Button>
        )}
      </div>
    </div>
  );
}
