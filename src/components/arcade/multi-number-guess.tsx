"use client";

import React from "react";
import { HelpCircle, ArrowLeft, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";

interface NumberGuessProps {
  matchId?: string;
  role?: 'X' | 'O';
  opponentName?: string;
  onLeave?: () => void;
}

export function NumberGuessMultiplayer({ matchId, role, opponentName, onLeave }: NumberGuessProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [targetNumber, setTargetNumber] = React.useState<number | null>(null);
  const [min, setMin] = React.useState(1);
  const [max, setMax] = React.useState(100);
  const [xIsNext, setXIsNext] = React.useState(true);
  
  const [lastGuess, setLastGuess] = React.useState<{ val: number, player: string, hint: string } | null>(null);
  const [winner, setWinner] = React.useState<string | null>(null);
  const [channel, setChannel] = React.useState<any>(null);

  const [guessInput, setGuessInput] = React.useState("");

  React.useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'start' }, (payload) => {
        setTargetNumber(payload.payload.target);
        setMin(1);
        setMax(100);
        setXIsNext(true);
        setLastGuess(null);
        setWinner(null);
      })
      .on('broadcast', { event: 'guess' }, (payload) => {
        const { guess, player, hint, newMin, newMax, nextPlayer } = payload.payload;
        setLastGuess({ val: guess, player, hint });
        setMin(newMin);
        setMax(newMax);
        setXIsNext(nextPlayer === 'X');
        if (hint === 'Correct') {
          setWinner(player);
        }
      })
      .subscribe();

    setChannel(newChannel);

    if (role === 'X' && targetNumber === null) {
      setTimeout(() => {
        startNewGame(newChannel);
      }, 500);
    }

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [matchId, supabase, role]);

  const startNewGame = (activeChannel = channel) => {
    if (matchId && role !== 'X') return;
    const target = Math.floor(Math.random() * 100) + 1;
    setTargetNumber(target);
    setMin(1);
    setMax(100);
    setXIsNext(true);
    setLastGuess(null);
    setWinner(null);
    
    if (activeChannel) {
      activeChannel.send({
        type: 'broadcast',
        event: 'start',
        payload: { target }
      });
    }
  };

  React.useEffect(() => {
    if (winner && role === winner) {
      saveScore();
    }
  }, [winner, role]);

  const saveScore = async () => {
    if (!supabase || !profile) return;
    const payload = {
      family_id: profile.family_id,
      member_id: profile.id,
      game: 'Number Race',
      wins: 1,
      updated_at: new Date().toISOString()
    };
    await supabase.from('arcade_scores').insert([payload]);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (winner || !targetNumber) return;
    if (role && ((xIsNext && role !== 'X') || (!xIsNext && role !== 'O'))) return; // Not your turn

    const guess = parseInt(guessInput);
    if (isNaN(guess) || guess < 1 || guess > 100) return;

    let hint = "";
    let newMin = min;
    let newMax = max;

    if (guess === targetNumber) {
      hint = "Correct";
      setWinner(role || null);
    } else if (guess < targetNumber) {
      hint = "Higher";
      newMin = Math.max(min, guess + 1);
    } else {
      hint = "Lower";
      newMax = Math.min(max, guess - 1);
    }

    const nextPlayer = xIsNext ? 'O' : 'X';
    
    setLastGuess({ val: guess, player: role || 'X', hint });
    setMin(newMin);
    setMax(newMax);
    setXIsNext(nextPlayer === 'X');
    setGuessInput("");

    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'guess',
        payload: { guess, player: role || 'X', hint, newMin, newMax, nextPlayer }
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
          <HelpCircle className="h-6 w-6" /> Number Race
        </h3>
        <p className="text-sm font-bold text-muted-foreground">
          {winner ? (winner === role ? "You Win! 🎉" : `${matchId ? (opponentName || 'Opponent') : 'Opponent'} Wins! 😢`) : `Turn: ${xIsNext ? 'X' : 'O'}`}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full gap-8 mt-4">
        {targetNumber === null ? (
          <div className="flex flex-col items-center gap-4">
            {!matchId || role === 'X' ? (
              <Button onClick={() => startNewGame(channel)} className="h-16 px-12 rounded-full text-lg font-black bg-primary">
                {matchId ? 'Start Game' : 'Start Solo Practice'}
              </Button>
            ) : (
              <p className="font-bold text-muted-foreground animate-pulse">Waiting for host to start...</p>
            )}
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="font-bold text-muted-foreground">The number is between</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="text-4xl font-black text-primary">{min}</span>
                <span className="text-2xl font-bold text-muted-foreground">and</span>
                <span className="text-4xl font-black text-primary">{max}</span>
              </div>
            </div>

            {lastGuess && !winner && (
              <div className="text-center animate-in slide-in-from-bottom-4">
                <p className="text-lg font-bold">
                  {lastGuess.player === role ? 'You' : `${matchId ? (opponentName || 'Opponent') : 'Opponent'}`} guessed <span className="text-2xl text-primary font-black">{lastGuess.val}</span>
                </p>
                <div className="mt-2 flex items-center justify-center gap-2 text-xl font-black">
                  {lastGuess.hint === 'Higher' ? (
                    <><ArrowUp className="h-6 w-6 text-emerald-500" /> <span className="text-emerald-500">Higher!</span></>
                  ) : (
                    <><ArrowDown className="h-6 w-6 text-rose-500" /> <span className="text-rose-500">Lower!</span></>
                  )}
                </div>
              </div>
            )}

            {!winner && (
              <form onSubmit={handleGuessSubmit} className="flex gap-2 w-full max-w-[280px]">
                <input 
                  type="number" 
                  value={guessInput}
                  onChange={e => setGuessInput(e.target.value)}
                  disabled={role ? ((xIsNext && role !== 'X') || (!xIsNext && role !== 'O')) : false}
                  placeholder={role ? (((xIsNext && role !== 'X') || (!xIsNext && role !== 'O')) ? `${matchId ? (opponentName || 'Opponent') : 'Opponent'}'s turn...` : "Your guess") : "Your guess"}
                  className="flex-1 h-14 rounded-2xl border-2 border-primary/20 text-center text-xl font-bold focus:outline-none focus:border-primary disabled:opacity-50"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  disabled={(xIsNext && role !== 'X') || (!xIsNext && role !== 'O')}
                  className="h-14 px-6 rounded-2xl font-bold"
                >
                  Guess
                </Button>
              </form>
            )}

            {winner && (
              <div className="flex flex-col items-center gap-4 mt-4">
                <div className="text-4xl font-black text-primary animate-in zoom-in bounce">
                  It was {targetNumber}!
                </div>
                {role === 'X' && (
                  <Button onClick={() => startNewGame(channel)} variant="outline" className="h-12 px-8 rounded-full font-bold border-primary text-primary mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" /> Play Again
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
