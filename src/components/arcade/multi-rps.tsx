"use client";

import React from "react";
import { Hand, ArrowLeft, RefreshCw, HandMetal, File, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";

interface RPSProps {
  matchId?: string;
  role?: 'X' | 'O';
  onLeave?: () => void;
}

export function RockPaperScissorsMultiplayer({ matchId, role, onLeave }: RPSProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [myChoice, setMyChoice] = React.useState<string | null>(null);
  const [opponentChoice, setOpponentChoice] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);
  const [channel, setChannel] = React.useState<any>(null);

  // Networking Setup
  React.useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'choose' }, (payload) => {
        setOpponentChoice(payload.payload.choice);
      })
      .on('broadcast', { event: 'reset' }, () => {
        setMyChoice(null);
        setOpponentChoice(null);
        setResult(null);
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [matchId, supabase]);

  React.useEffect(() => {
    if (myChoice && opponentChoice) {
      determineWinner(myChoice, opponentChoice);
    }
  }, [myChoice, opponentChoice]);

  const determineWinner = (mine: string, theirs: string) => {
    if (mine === theirs) {
      setResult('Draw!');
    } else if (
      (mine === 'rock' && theirs === 'scissors') ||
      (mine === 'paper' && theirs === 'rock') ||
      (mine === 'scissors' && theirs === 'paper')
    ) {
      setResult('You Win! 🎉');
      saveScore();
    } else {
      setResult('You Lose! 😢');
    }
  };

  const saveScore = async () => {
    if (!supabase || !profile) return;
    const payload = {
      family_id: profile.family_id,
      member_id: profile.id,
      game: 'Multi RPS',
      wins: 1,
      updated_at: new Date().toISOString()
    };
    await supabase.from('arcade_scores').insert([payload]);
  };

  const handleChoice = (choice: string) => {
    if (myChoice || !matchId) return; // Wait for opponent or reset
    setMyChoice(choice);
    
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'choose',
        payload: { choice }
      });
    }
  };
  
  const resetLocal = () => {
    setMyChoice(null);
    setOpponentChoice(null);
    setResult(null);
    
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'reset',
        payload: {}
      });
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
          <Hand className="h-6 w-6" /> Multi RPS
        </h3>
        {matchId && (
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            Multiplayer Match
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full gap-8 mt-8">
        {!myChoice && (
          <div className="flex justify-center gap-4">
            <Button onClick={() => handleChoice('rock')} className="h-24 w-24 rounded-[2rem] bg-slate-800 hover:bg-slate-700">
              <HandMetal className="h-12 w-12 text-white" />
            </Button>
            <Button onClick={() => handleChoice('paper')} className="h-24 w-24 rounded-[2rem] bg-blue-600 hover:bg-blue-500">
              <File className="h-12 w-12 text-white" />
            </Button>
            <Button onClick={() => handleChoice('scissors')} className="h-24 w-24 rounded-[2rem] bg-rose-600 hover:bg-rose-500">
              <Scissors className="h-12 w-12 text-white" />
            </Button>
          </div>
        )}

        {myChoice && !opponentChoice && (
          <div className="text-center animate-pulse text-muted-foreground font-bold">
            Waiting for opponent...
          </div>
        )}

        {myChoice && opponentChoice && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="h-24 w-24 rounded-[2rem] bg-primary flex items-center justify-center shadow-lg">
                  {myChoice === 'rock' && <HandMetal className="h-12 w-12 text-white" />}
                  {myChoice === 'paper' && <File className="h-12 w-12 text-white" />}
                  {myChoice === 'scissors' && <Scissors className="h-12 w-12 text-white" />}
                </div>
                <p className="mt-2 font-bold">You</p>
              </div>
              
              <div className="text-2xl font-black text-muted-foreground">VS</div>

              <div className="text-center">
                <div className="h-24 w-24 rounded-[2rem] bg-accent flex items-center justify-center shadow-lg">
                  {opponentChoice === 'rock' && <HandMetal className="h-12 w-12 text-white" />}
                  {opponentChoice === 'paper' && <File className="h-12 w-12 text-white" />}
                  {opponentChoice === 'scissors' && <Scissors className="h-12 w-12 text-white" />}
                </div>
                <p className="mt-2 font-bold">Opponent</p>
              </div>
            </div>

            <div className="text-3xl font-black text-primary animate-in zoom-in bounce">
              {result}
            </div>

            <Button onClick={resetLocal} variant="outline" className="h-12 px-8 rounded-full font-bold border-primary text-primary mt-4">
              <RefreshCw className="h-4 w-4 mr-2" /> Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
