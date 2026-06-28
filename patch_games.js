const fs = require('fs');
let content = fs.readFileSync('src/app/arcade/page.tsx', 'utf8');

const games = [
  { func: 'PianoGame', trigger: 'setScore(s => s + 1)', replaceWith: 'setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Piano", ns); return ns; })' },
  { func: 'WordSearchGame', trigger: 'if (found.length === words.length)', replaceWith: 'saveGameScore(supabase, profile, "Word Search", words.length);\n      if (found.length === words.length)' },
  { func: 'TicTacToe', trigger: 'setWinner(newBoard', replaceWith: 'setWinner(newBoard); saveGameScore(supabase, profile, "Tic Tac Toe", 1, "win"); // hack for demo' },
  { func: 'MemoryMatch', trigger: 'setFound(newFound)', replaceWith: 'setFound(newFound); if (newFound.length === cards.length) saveGameScore(supabase, profile, "Memory Match", moves);' },
  { func: 'SnakeGame', trigger: 'setGameOver(true)', replaceWith: 'setGameOver(true); saveGameScore(supabase, profile, "Snake", score);' },
  { func: 'MathMaster', trigger: 'setScore(s => s + 1)', replaceWith: 'setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Math Master", ns); return ns; })' },
  { func: 'WhackATask', trigger: 'setTime(0)', replaceWith: 'setTime(0); saveGameScore(supabase, profile, "Whack-a-Task", score);' },
  { func: 'SimonSays', trigger: 'setGameOver(true)', replaceWith: 'setGameOver(true); saveGameScore(supabase, profile, "Simon Says", sequence.length - 1);' },
  { func: 'BalloonPop', trigger: 'setTime(0)', replaceWith: 'setTime(0); saveGameScore(supabase, profile, "Balloon Pop", score);' },
  { func: 'RockPaperScissors', trigger: 'setResult("You Win!")', replaceWith: 'setResult("You Win!"); saveGameScore(supabase, profile, "RPS", 1, "win");' },
  { func: 'ReactionTest', trigger: 'setState("result")', replaceWith: 'setState("result"); saveGameScore(supabase, profile, "Reaction", Date.now() - startTime);' },
  { func: 'SpeedClicker', trigger: 'setTime(0)', replaceWith: 'setTime(0); saveGameScore(supabase, profile, "Speed Clicker", clicks);' },
  { func: 'ColorFinder', trigger: 'setScore(s => s + 1)', replaceWith: 'setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Color Finder", ns); return ns; })' },
  { func: 'DiceRoller', trigger: 'setResult(sum)', replaceWith: 'setResult(sum); saveGameScore(supabase, profile, "Dice", sum);' },
  { func: 'NumberGuess', trigger: 'setMsg("You got it!")', replaceWith: 'setMsg("You got it!"); saveGameScore(supabase, profile, "Number Guess", guesses + 1);' },
  { func: 'TypingGame', trigger: 'setScore(s => s + 1)', replaceWith: 'setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Typing", ns); return ns; })' }
];

const hookCode = `\n  const supabase = useSupabase();\n  const { profile } = useUser();\n`;

games.forEach(g => {
  const funcRegex = new RegExp(`function ${g.func}\\(\\) \\{`);
  if (!content.includes(`function ${g.func}() {${hookCode}`)) {
    content = content.replace(funcRegex, `function ${g.func}() {${hookCode}`);
  }
  if (!content.includes(g.replaceWith)) {
      content = content.replace(g.trigger, g.replaceWith);
  }
});

fs.writeFileSync('src/app/arcade/page.tsx', content);
console.log('Hooks injected');
