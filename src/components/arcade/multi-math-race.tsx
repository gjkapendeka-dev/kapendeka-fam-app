"use client";

import React from "react";
import { Calculator, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase, useUser } from "@/supabase";

interface MathRaceProps {
  matchId?: string;
  role?: 'X' | 'O'; // 'X' is host, 'O' is guest
  onLeave?: () => void;
}

export function MathRaceMultiplayer({ matchId, role, onLeave }: MathRaceProps) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [question, setQuestion] = React.useState<{ q: string, a: number } | null>(null);
  const [myScore, setMyScore] = React.useState(0);
  const [opponentScore, setOpponentScore] = React.useState(0);
  const [winner, setWinner] = React.useState<string | null>(null);
  const [channel, setChannel] = React.useState<any>(null);

  const [answerInput, setAnswerInput] = React.useState("");

  const generateQuestion = () => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let q = "";
    let ans = 0;
    if (op === '+') { q = `${a} + ${b}`; ans = a + b; }
    if (op === '-') { 
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      q = `${max} - ${min}`; 
      ans = max - min; 
    }
    if (op === '*') { q = `${a % 10 + 1} * ${b % 10 + 1}`; ans = (a % 10 + 1) * (b % 10 + 1); }
    return { q, a: ans };
  };

  React.useEffect(() => {
    if (!matchId || !supabase) return;

    const newChannel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } }
    });

    newChannel
      .on('broadcast', { event: 'score' }, (payload) => {
        setOpponentScore(payload.payload.score);
        if (payload.payload.nextQuestion) {
          setQuestion(payload.payload.nextQuestion);
        }
      })
      .on('broadcast', { event: 'start' }, (payload) => {
        setQuestion(payload.payload.question);
        setMyScore(0);
        setOpponentScore(0);
        setWinner(null);
      })
      .subscribe();

    setChannel(newChannel);

    // Host starts the game
    if (role === 'X' && !question) {
      setTimeout(() => {
        const q = generateQuestion();
        setQuestion(q);
        newChannel.send({
          type: 'broadcast',
          event: 'start',
          payload: { question: q }
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
      game: 'Math Race',
      wins: 1,
      updated_at: new Date().toISOString()
    };
    await supabase.from('arcade_scores').insert([payload]);
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || winner) return;

    if (parseInt(answerInput) === question.a) {
      const newScore = myScore + 1;
      setMyScore(newScore);
      setAnswerInput("");
      
      let nextQ = null;
      if (newScore < 5) {
        nextQ = generateQuestion();
        setQuestion(nextQ);
      }

      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'score',
          payload: { score: newScore, nextQuestion: nextQ }
        });
      }
    } else {
      setAnswerInput(""); // clear on wrong answer
    }
  };

  const startNewGame = () => {
    if (role !== 'X' || !channel) return;
    const q = generateQuestion();
    setQuestion(q);
    setMyScore(0);
    setOpponentScore(0);
    setWinner(null);
    channel.send({
      type: 'broadcast',
      event: 'start',
      payload: { question: q }
    });
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
          <Calculator className="h-6 w-6" /> Math Race
        </h3>
        <p className="text-sm font-bold text-muted-foreground">First to 5 points wins!</p>
      </div>

      <div className="flex w-full max-w-md justify-between px-8 py-4 bg-muted/20 rounded-3xl">
        <div className="text-center">
          <p className="font-bold text-primary">You</p>
          <p className="text-4xl font-black text-primary">{myScore}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-accent">Opponent</p>
          <p className="text-4xl font-black text-accent">{opponentScore}</p>
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
      ) : question ? (
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter">
            {question.q} = ?
          </div>
          <form onSubmit={handleAnswerSubmit} className="flex gap-2 w-full max-w-xs">
            <input 
              type="number" 
              value={answerInput}
              onChange={e => setAnswerInput(e.target.value)}
              className="flex-1 h-14 rounded-2xl border-2 border-primary/20 text-center text-2xl font-black focus:outline-none focus:border-primary"
              autoFocus
            />
            <Button type="submit" className="h-14 px-6 rounded-2xl font-bold">Go</Button>
          </form>
        </div>
      ) : (
        <div className="mt-12 text-muted-foreground font-bold animate-pulse">
          Waiting for match to start...
        </div>
      )}
    </div>
  );
}
