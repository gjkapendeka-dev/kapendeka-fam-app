"use client";

import React from "react";
import { Search, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";

interface WordRaceProps {
  matchId?: string;
  role?: 'X' | 'O';
  opponentName?: string;
  onLeave?: () => void;
}

const WORDS = [
  "FAMILY", "LOVE", "TOGETHER", "HAPPY", "SMILE", 
  "PLAY", "LAUGH", "FRIENDS", "HOME", "HEART",
  "JOY", "PEACE", "SUNSHINE", "SUMMER", "WINTER",
  "SPRING", "AUTUMN", "NATURE", "FOREST", "RIVER"
];

export function WordRaceMultiplayer({ matchId, role, opponentName, onLeave }: WordRaceProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [word, setWord] = React.useState<{ original: string, scrambled: string } | null>(null);
  const [myScore, setMyScore] = React.useState(0);
  const [opponentScore, setOpponentScore] = React.useState(0);
  const [winner, setWinner] = React.useState<string | null>(null);
  const [channel, setChannel] = React.useState<any>(null);

  const [guessInput, setGuessInput] = React.useState("");

  const generateWord = () => {
    const original = WORDS[Math.floor(Math.random() * WORDS.length)];
    let scrambled = original.split('').sort(() => 0.5 - Math.random()).join('');
    while (scrambled === original) {
      scrambled = original.split('').sort(() => 0.5 - Math.random()).join('');
    }
    return { original, scrambled };
  };

  React.useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'score' }, (payload) => {
        setOpponentScore(payload.payload.score);
        if (payload.payload.nextWord) {
          setWord(payload.payload.nextWord);
        }
      })
      .on('broadcast', { event: 'start' }, (payload) => {
        setWord(payload.payload.word);
        setMyScore(0);
        setOpponentScore(0);
        setWinner(null);
      })
      .subscribe();

    setChannel(newChannel);

    if (role === 'X' && !word) {
      setTimeout(() => {
        const w = generateWord();
        setWord(w);
        newChannel.send({
          type: 'broadcast',
          event: 'start',
          payload: { word: w }
        });
      }, 1000);
    }

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [matchId, supabase, role]);

  React.useEffect(() => {
    if (myScore >= 5) {
      setWinner('You Win! 🎉');
      saveScore();
    } else if (opponentScore >= 5) {
      setWinner('You Lose! 😢');
    }
  }, [myScore, opponentScore]);

  const saveScore = async () => {
    if (!supabase || !profile) return;
    const payload = {
      family_id: profile.family_id,
      member_id: profile.id,
      game: 'Word Race',
      wins: 1,
      updated_at: new Date().toISOString()
    };
    await supabase.from('arcade_scores').insert([payload]);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || winner) return;

    if (guessInput.toUpperCase() === word.original) {
      const newScore = myScore + 1;
      setMyScore(newScore);
      setGuessInput("");
      
      let nextW = null;
      if (newScore < 5) {
        nextW = generateWord();
        setWord(nextW);
      }

      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'score',
          payload: { score: newScore, nextWord: nextW }
        });
      }
    } else {
      setGuessInput(""); // clear on wrong guess
    }
  };

  React.useEffect(() => {
    if (!matchId && localMode && !winner && word) {
      const timer = setTimeout(() => {
         const newScore = opponentScore + 1;
         setOpponentScore(newScore);
      }, 4000 + Math.random() * 2000);
      return () => clearTimeout(timer);
    }
  }, [matchId, localMode, winner, word, opponentScore]);

  const startNewGame = () => {
    if (matchId && role !== 'X') return;
    const w = generateWord();
    setWord(w);
    setMyScore(0);
    setOpponentScore(0);
    setWinner(null);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'start',
        payload: { word: w }
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4 relative w-full h-full min-h-[400px]">
      {matchId && (
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" onClick={() => { if(localMode) setLocalMode(false); else if(onLeave) onLeave(); }} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave Match
          </Button>
        </div>
      )}
      
      <div className="text-center space-y-2 mt-8">
        <h3 className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
          <Search className="h-6 w-6" /> Word Race
        </h3>
        <p className="text-sm font-bold text-muted-foreground">Unscramble the word! First to 5 wins!</p>
      </div>

      <div className="flex w-full max-w-md justify-between px-8 py-2 bg-muted/20 rounded-3xl">
        <div className="text-center">
          <p className="font-bold text-blue-500">You</p>
          <p className="text-2xl font-black text-blue-500">{myScore}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-red-500">{matchId ? (opponentName || 'Opponent') : 'Opponent'}</p>
          <p className="text-2xl font-black text-red-500">{opponentScore}</p>
        </div>
      </div>

      {winner ? (
        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="text-3xl font-black text-primary animate-in zoom-in bounce">
            {winner}
          </div>
          {role === 'X' ? (
            <Button onClick={startNewGame} variant="outline" className="h-12 px-8 rounded-full font-bold border-primary text-primary mt-4">
              <RefreshCw className="h-4 w-4 mr-2" /> Start Rematch
            </Button>
          ) : (
            <p className="text-muted-foreground font-bold mt-4 animate-pulse">Waiting for host to restart...</p>
          )}
        </div>
      ) : word ? (
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="text-5xl md:text-7xl font-black text-slate-800 tracking-[0.2em] uppercase">
            {word.scrambled}
          </div>
          <form onSubmit={handleGuessSubmit} className="flex gap-2 w-full max-w-xs">
            <input 
              type="text" 
              value={guessInput}
              onChange={e => setGuessInput(e.target.value)}
              className="flex-1 h-14 rounded-2xl border-2 border-primary/20 text-center text-2xl font-black focus:outline-none focus:border-primary uppercase"
              autoFocus
            />
            <Button type="submit" className="h-14 px-6 rounded-2xl font-bold">Go</Button>
          </form>
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center">
          {!matchId || role === 'X' ? (
            <Button onClick={startNewGame} className="h-16 px-12 rounded-full text-lg font-black bg-primary">
              {matchId ? 'Start Game' : 'Start Solo Practice'}
            </Button>
          ) : (
            <p className="text-muted-foreground font-bold animate-pulse">Waiting for host to start...</p>
          )}
        </div>
      )}
    </div>
  );
}
