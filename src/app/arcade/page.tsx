"use client"

import * as React from "react"
import { 
  Gamepad, 
  Music, 
  Search, 
  Grid3x3, 
  ArrowLeft, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp,
  Play, 
  Pause,
  RefreshCw,
  Trophy,
  Type,
  Plus,
  X,
  Circle,
  Brain,
  Layout,
  Eraser,
  Hammer,
  Target,
  Calculator,
  PenTool,
  Shapes,
  Gamepad2,
  Mic2,
  Smile,
  Zap,
  Flame,
  Sun,
  Moon,
  Cloud,
  Heart,
  Star,
  Activity,
  MousePointer2,
  Dices,
  Keyboard,
  Grid2x2,
  HelpCircle,
  Hand,
  Bomb,
  Sparkles,
  Timer,
  Palette,
  Maximize,
  Languages
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { audio } from "@/lib/audio"
import { DPad } from "@/components/ui/dpad"
import { TicTacToe } from "@/components/arcade/tic-tac-toe"
import { ConnectFour } from "@/components/arcade/connect-four"
import { JudgingPanel } from "@/components/arcade/judging-panel"
import { TetrisGame } from "@/components/arcade/tetris"
import { RockPaperScissorsMultiplayer } from "@/components/arcade/multi-rps"
import { MathRaceMultiplayer } from "@/components/arcade/multi-math-race"
import { ReactionRaceMultiplayer } from "@/components/arcade/multi-reaction"
import { DotsAndBoxesMultiplayer } from "@/components/arcade/multi-dots-boxes"
import { NumberGuessMultiplayer } from "@/components/arcade/multi-number-guess"
import { WordRaceMultiplayer } from "@/components/arcade/multi-word-race"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSupabase, useUser, useCollection } from "@/supabase"
import { useToast } from "@/hooks/use-toast"

const saveGameScore = async (supabase: any, profile: any, game: string, score: number, type: 'score' | 'win' | 'loss' | 'draw' = 'score') => {
  if (!supabase || !profile) return
  
  const payload: any = {
    family_id: profile.family_id,
    member_id: profile.id,
    game: game,
    updated_at: new Date().toISOString()
  }

  if (type === 'score') payload.best_score = score
  if (type === 'win') payload.wins = 1
  if (type === 'loss') payload.losses = 1
  if (type === 'draw') payload.draws = 1

  await supabase.from('arcade_scores').insert([payload])
}

// --- 1. PIANO GAME ---
const PIANO_KEYS = [
  { note: "C", freq: 261.63, color: "bg-white", text: "DO", key: "A" },
  { note: "D", freq: 293.66, color: "bg-white", text: "RE", key: "S" },
  { note: "E", freq: 329.63, color: "bg-white", text: "MI", key: "D" },
  { note: "F", freq: 349.23, color: "bg-white", text: "FA", key: "F" },
  { note: "G", freq: 392.00, color: "bg-white", text: "SO", key: "G" },
  { note: "A", freq: 440.00, color: "bg-white", text: "LA", key: "H" },
  { note: "B", freq: 493.88, color: "bg-white", text: "TI", key: "J" },
  { note: "C2", freq: 523.25, color: "bg-white", text: "DO", key: "K" },
]

const KIDS_SONGS = [
  { name: "Twinkle Twinkle", notes: ["C", "C", "G", "G", "A", "A", "G", "F", "F", "E", "E", "D", "D", "C"] },
  { name: "Mary's Lamb", notes: ["E", "D", "C", "D", "E", "E", "E", "D", "D", "D", "E", "G", "G"] }
]

function PianoGame() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [activeNote, setActiveNote] = React.useState<string | null>(null)
  const [currentSong, setCurrentSong] = React.useState<{name: string, notes: string[]} | null>(null)
  const [songProgress, setSongProgress] = React.useState(0)
  
  const audioContext = React.useRef<AudioContext | null>(null)

  const playNote = (freq: number, note: string) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const osc = audioContext.current.createOscillator()
    const gain = audioContext.current.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, audioContext.current.currentTime)
    gain.gain.setValueAtTime(0.5, audioContext.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 1)
    osc.connect(gain)
    gain.connect(audioContext.current.destination)
    osc.start()
    osc.stop(audioContext.current.currentTime + 1)
    setActiveNote(note)
    setTimeout(() => setActiveNote(null), 200)

    if (currentSong) {
      if (note === currentSong.notes[songProgress]) {
        if (songProgress + 1 >= currentSong.notes.length) {
          // Finished
          setTimeout(() => {
             setCurrentSong(null)
             setSongProgress(0)
          }, 500)
        } else {
          setSongProgress(prev => prev + 1)
        }
      }
    }
  }

  const startSong = (song: {name: string, notes: string[]}) => {
    setCurrentSong(song)
    setSongProgress(0)
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-2 overflow-x-hidden">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Kids' Magic Piano</h3>
        <p className="text-muted-foreground font-medium text-sm">
          {currentSong ? <span className="text-amber-500 font-bold">Learn: {currentSong.name} - Tap the glowing key!</span> : "Tap the keys to make music!"}
        </p>
      </div>
      
      <div className="flex gap-2 mb-2">
         {KIDS_SONGS.map(song => (
            <Button 
               key={song.name} 
               variant={currentSong?.name === song.name ? "default" : "outline"}
               onClick={() => startSong(song)}
               className="rounded-full text-xs font-bold"
               size="sm"
            >
               🎵 {song.name}
            </Button>
         ))}
         {currentSong && (
            <Button variant="ghost" onClick={() => setCurrentSong(null)} className="rounded-full text-xs text-muted-foreground" size="sm">Stop</Button>
         )}
      </div>

      <div className="flex gap-1 p-2 md:p-4 bg-muted/30 rounded-3xl shadow-inner overflow-x-auto w-full max-w-2xl justify-start md:justify-center no-scrollbar relative">
        {PIANO_KEYS.map((k) => {
          const isTarget = currentSong && currentSong.notes[songProgress] === k.note;
          return (
          <button
            key={k.note}
            onClick={() => playNote(k.freq, k.note)}
            className={`
              relative w-12 md:w-16 h-40 md:h-64 rounded-xl transition-all active:scale-95 active:bg-primary/10 border-b-8 shadow-lg shrink-0
              ${activeNote === k.note ? "bg-primary/20 -translate-y-2 border-b-0" : "bg-white"}
              ${isTarget ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse" : "border-muted"}
            `}
          >
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-black text-[10px] md:text-sm text-muted-foreground/50">{k.text}</span>
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 md:w-3 md:h-3 rounded-full ${activeNote === k.note ? 'bg-primary' : (isTarget ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)]' : 'bg-muted')}`} />
          </button>
        )})}
      </div>
    </div>
  )
}

// --- 2. WORD SEARCH GAME ---
function WordSearchGame() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [words, setWords] = React.useState<string[]>(["FAMILY", "JOY", "HUB", "ARCADE"])
  const [newWord, setNewWord] = React.useState("")
  const [grid, setGrid] = React.useState<string[][]>([])
  const gridSize = 10

  const generateGrid = React.useCallback(() => {
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(""))
    
    words.forEach(word => {
      let placed = false
      let attempts = 0
      while (!placed && attempts < 100) {
        attempts++
        const direction = Math.random() > 0.5 ? "H" : "V"
        const row = Math.floor(Math.random() * (direction === "V" ? gridSize - word.length : gridSize))
        const col = Math.floor(Math.random() * (direction === "H" ? gridSize - word.length : gridSize))
        
        let canPlace = true
        for (let i = 0; i < word.length; i++) {
          const r = direction === "V" ? row + i : row
          const c = direction === "H" ? col + i : col
          if (newGrid[r][c] !== "" && newGrid[r][c] !== word[i]) {
            canPlace = false
            break
          }
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const r = direction === "V" ? row + i : row
            const c = direction === "H" ? col + i : col
            newGrid[r][c] = word[i]
          }
          placed = true
        }
      }
    })

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newGrid[r][c] === "") {
          newGrid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
        }
      }
    }
    setGrid(newGrid)
  }, [words])

  React.useEffect(() => {
    generateGrid()
  }, [generateGrid])

  const addWord = () => {
    if (newWord && !words.includes(newWord.toUpperCase())) {
      setWords([...words, newWord.toUpperCase()])
      setNewWord("")
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3 py-6 items-start px-2">
      <Card className="w-full lg:w-80 rounded-3xl border-none shadow-sm bg-muted/10">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            Word List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0 space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="NEW WORD" 
              className="h-11 rounded-xl"
              value={newWord} 
              onChange={(e) => setNewWord(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addWord()}
            />
            <Button size="icon" className="h-11 w-11 rounded-xl" onClick={addWord}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map(w => (
              <Badge key={w} className="bg-primary/10 text-primary border-none font-bold uppercase text-[10px] py-1">
                {w}
              </Badge>
            ))}
          </div>
          <Button variant="outline" className="w-full h-11 rounded-xl font-bold border-primary/20 text-primary" onClick={generateGrid}>
            <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
          </Button>
        </CardContent>
      </Card>

      <div className="w-full flex-1 flex justify-center">
        <div className="grid grid-cols-10 gap-1 p-2 bg-muted/20 rounded-2xl border border-muted/50 w-fit">
          {grid.map((row, ri) => row.map((char, ci) => (
            <div 
              key={`${ri}-${ci}`} 
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center bg-white rounded-lg font-black text-xs sm:text-sm md:text-lg text-primary shadow-sm active:bg-primary/10 cursor-pointer transition-colors"
            >
              {char}
            </div>
          )))}
        </div>
      </div>
    </div>
  )
}

// --- 4. MEMORY MATCH ---
const MEMORY_ICONS = [Heart, Star, Sun, Moon, Cloud, Zap, Flame, Smile]

function MemoryMatch() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [cards, setCards] = React.useState<any[]>([])
  const [flipped, setFlipped] = React.useState<number[]>([])
  const [solved, setSolved] = React.useState<number[]>([])
  const [disabled, setDisabled] = React.useState(false)

  const initialize = React.useCallback(() => {
    const doubled = [...MEMORY_ICONS, ...MEMORY_ICONS]
    const shuffled = doubled
      .sort(() => Math.random() - 0.5)
      .map((Icon, i) => ({ id: i, Icon }))
    setCards(shuffled)
    setSolved([])
    setFlipped([])
  }, [])

  React.useEffect(() => {
    initialize()
  }, [initialize])

  const handleClick = (id: number) => {
    if (disabled || flipped.includes(id) || solved.includes(id)) return
    
    if (flipped.length === 0) {
      setFlipped([id])
      return
    }

    if (flipped.length === 1) {
      setFlipped([flipped[0], id])
      setDisabled(true)

      const card1 = cards[flipped[0]]
      const card2 = cards[id]

      if (card1.Icon === card2.Icon) {
        setSolved([...solved, flipped[0], id])
        setFlipped([])
        setDisabled(false)
      } else {
        setTimeout(() => {
          setFlipped([])
          setDisabled(false)
        }, 1000)
      }
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Brain Boost Memory</h3>
        <p className="text-muted-foreground font-medium text-sm">Find all matching pairs!</p>
      </div>
      <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-md w-full">
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || solved.includes(i)
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={cn(
                "aspect-square rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                isFlipped ? "bg-white" : "bg-primary text-white active:scale-95"
              )}
            >
              {isFlipped ? (
                <card.Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary animate-in zoom-in" />
              ) : (
                <Shapes className="h-5 w-5 sm:h-6 sm:w-6 opacity-20" />
              )}
            </button>
          )
        })}
      </div>
      <Button onClick={initialize} variant="outline" className="rounded-xl font-bold h-12 px-4">
        <RefreshCw className="h-4 w-4 mr-2" /> New Game
      </Button>
    </div>
  )
}

// --- 5. SNAKE GAME ---
function SnakeGame({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [snake, setSnake] = React.useState([{ x: 10, y: 10 }])
  const [food, setFood] = React.useState({ x: 5, y: 5 })
  const [dir, setDir] = React.useState({ x: 0, y: -1 })
  const [gameOver, setGameOver] = React.useState(false)
  const [score, setScore] = React.useState(0)
  const gridSize = 20

  const moveSnake = React.useCallback(() => {
    if (gameOver) return

    const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

    if (
      newHead.x < 0 || newHead.x >= gridSize || 
      newHead.y < 0 || newHead.y >= gridSize ||
      snake.some(s => s.x === newHead.x && s.y === newHead.y)
    ) {
      audio.playCrash(); audio.playCrash(); setGameOver(true); saveGameScore(supabase, profile, "Snake", score);
      return
    }

    const newSnake = [newHead, ...snake]
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore(s => s + 10)
      setFood({
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      })
    } else {
      newSnake.pop()
    }
    setSnake(newSnake)
  }, [snake, dir, food, gameOver, supabase, profile, score])

  React.useEffect(() => {
    const interval = setInterval(moveSnake, Math.max(50, 180 - score * 0.5))
    return () => clearInterval(interval)
  }, [moveSnake])

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <div className="flex gap-4 items-center">
        <div className="text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">PB: {personalBest}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Score: {score}</p>
        </div>
      </div>
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square bg-slate-900 rounded-[2rem] border-4 border-slate-800 grid grid-cols-20 grid-rows-20 overflow-hidden">
        {snake.map((s, i) => (
          <div key={i} className="bg-emerald-400 rounded-sm" style={{ gridColumnStart: s.x + 1, gridRowStart: s.y + 1 }} />
        ))}
        <div className="bg-rose-500 rounded-full animate-pulse" style={{ gridColumnStart: food.x + 1, gridRowStart: food.y + 1 }} />
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Trophy className="h-12 w-12 text-yellow-500" />
            <h4 className="text-2xl font-bold text-white uppercase tracking-widest">Game Over</h4>
            <Button onClick={() => { setSnake([{ x: 10, y: 10 }]); setGameOver(false); setScore(0); }} className="bg-primary text-white rounded-xl font-bold px-4">Try Again</Button>
          </div>
        )}
      </div>
      <DPad 
        onUp={() => dir.y !== 1 && setDir({ x: 0, y: -1 })}
        onDown={() => dir.y !== -1 && setDir({ x: 0, y: 1 })}
        onLeft={() => dir.x !== 1 && setDir({ x: -1, y: 0 })}
        onRight={() => dir.x !== -1 && setDir({ x: 1, y: 0 })}
        className="mt-4 md:hidden"
      />
    </div>
  )
}

// --- 6. MATH MASTER ---
function MathMaster() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [q, setQ] = React.useState({ n1: 0, n2: 0, op: '+', ans: 0 })
  const [guess, setGuess] = React.useState("")
  const [score, setScore] = React.useState(0)
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [playing, setPlaying] = React.useState(false)

  const generate = React.useCallback(() => {
    const n1 = Math.floor(Math.random() * 12) + 1
    const n2 = Math.floor(Math.random() * 12) + 1
    const op = ['+', '-', '*'][Math.floor(Math.random() * 3)]
    let ans = 0
    if (op === '+') ans = n1 + n2
    if (op === '-') ans = n1 - n2
    if (op === '*') ans = n1 * n2
    setQ({ n1, n2, op, ans })
    setGuess("")
    setFeedback(null)
  }, [])

  React.useEffect(() => {
    if (playing) generate()
  }, [playing, generate])

  const check = () => {
    if (!playing) return
    if (parseInt(guess) === q.ans) {
      setScore(s => s + 1)
      setFeedback("Correct! ✨")
      setTimeout(generate, 1000)
    } else {
      setFeedback("Try again! ❌")
    }
  }

  const startGame = () => {
    setScore(0)
    setPlaying(true)
  }

  const endGame = () => {
    setPlaying(false)
    saveGameScore(supabase, profile, "Math Master", score, "score")
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <div className="flex items-center justify-between w-full max-w-sm">
        <h3 className="text-2xl font-bold text-primary">Math Master</h3>
        {playing && <Button onClick={endGame} variant="destructive" className="rounded-xl font-bold px-4">End Game</Button>}
      </div>
      <div className="bg-primary/5 p-4 md:p-5 rounded-[2.5rem] md:rounded-[3rem] text-center space-y-4 w-full max-w-sm border-2 border-primary/10 shadow-inner relative overflow-hidden">
        {!playing ? (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-2">
            {score > 0 && <div className="text-xl font-bold text-primary">Score: {score}</div>}
            <Button onClick={startGame} className="px-8 py-6 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">START GAME</Button>
          </div>
        ) : null}
        <div className="text-4xl md:text-5xl font-black text-primary flex items-center justify-center gap-4">
          <span>{q.n1}</span>
          <span className="text-accent">{q.op === '*' ? '×' : q.op}</span>
          <span>{q.n2}</span>
          <span className="text-accent">=</span>
          <span className="text-muted-foreground/30">?</span>
        </div>
        <div className="flex gap-2">
          <Input className="h-14 text-center text-2xl font-bold rounded-2xl" type="number" inputMode="numeric" value={guess} onChange={(e) => setGuess(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} />
          <Button className="h-14 px-6 bg-accent rounded-2xl font-black" onClick={check}>GO</Button>
        </div>
        {feedback && <div className="font-bold text-lg animate-bounce">{feedback}</div>}
        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Score: {score}</div>
      </div>
    </div>
  )
}

// --- 7. FRENCH MASTER ---
function FrenchMaster() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const words = [
    { en: 'Apple', fr: 'Pomme' }, { en: 'Dog', fr: 'Chien' },
    { en: 'Cat', fr: 'Chat' }, { en: 'House', fr: 'Maison' },
    { en: 'Car', fr: 'Voiture' }, { en: 'Book', fr: 'Livre' },
    { en: 'Water', fr: 'Eau' }, { en: 'Sun', fr: 'Soleil' },
    { en: 'Tree', fr: 'Arbre' }, { en: 'Friend', fr: 'Ami' },
    { en: 'Hello', fr: 'Bonjour' }, { en: 'Goodbye', fr: 'Au revoir' },
    { en: 'Please', fr: "S'il vous plaît" }, { en: 'Thank you', fr: 'Merci' }
  ]

  const [q, setQ] = React.useState<any>(null)
  const [options, setOptions] = React.useState<string[]>([])
  const [score, setScore] = React.useState(0)
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [playing, setPlaying] = React.useState(false)

  const generate = React.useCallback(() => {
    const target = words[Math.floor(Math.random() * words.length)]
    let opts = [target.fr]
    while (opts.length < 3) {
      const wrong = words[Math.floor(Math.random() * words.length)].fr
      if (!opts.includes(wrong)) opts.push(wrong)
    }
    opts = opts.sort(() => Math.random() - 0.5)
    
    setQ(target)
    setOptions(opts)
    setFeedback(null)
  }, [])

  React.useEffect(() => {
    if (playing) generate()
  }, [playing, generate])

  const check = (guess: string) => {
    if (!playing) return
    if (guess === q.fr) {
      setScore(s => s + 1)
      setFeedback("Très bien! ✨")
      setTimeout(generate, 1000)
    } else {
      setFeedback(`Non, it's "${q.fr}" ❌`)
      setTimeout(generate, 2000)
    }
  }

  const startGame = () => {
    setScore(0)
    setPlaying(true)
  }

  const endGame = () => {
    setPlaying(false)
    saveGameScore(supabase, profile, "French Master", score, "score")
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <div className="flex items-center justify-between w-full max-w-sm">
        <h3 className="text-2xl font-bold text-primary">French Master 🇫🇷</h3>
        {playing && <Button onClick={endGame} variant="destructive" className="rounded-xl font-bold px-4">End Game</Button>}
      </div>
      <div className="bg-primary/5 p-4 md:p-5 rounded-[2.5rem] md:rounded-[3rem] text-center space-y-4 w-full max-w-sm border-2 border-primary/10 shadow-inner relative overflow-hidden">
        {!playing ? (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-2">
            {score > 0 && <div className="text-xl font-bold text-primary">Score: {score}</div>}
            <Button onClick={startGame} className="px-8 py-6 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 bg-blue-500 hover:bg-blue-600 text-white">START GAME</Button>
          </div>
        ) : null}
        <div className="text-4xl md:text-5xl font-black text-primary flex items-center justify-center gap-4 py-6">
          <span>{q?.en}</span>
        </div>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <Button key={i} className="h-14 bg-white hover:bg-blue-50 text-primary border-2 border-primary/20 rounded-2xl font-black text-xl" onClick={() => check(opt)}>
              {opt}
            </Button>
          ))}
        </div>
        {feedback && <div className="font-bold text-lg animate-bounce">{feedback}</div>}
        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Score: {score}</div>
      </div>
    </div>
  )
}

// --- 8. DOODLE BOARD ---
function DoodleBoard() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = React.useState(false)
  const [color, setColor] = React.useState("#4f46e5")

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.strokeStyle = color
    setIsDrawing(true)
  }

  const draw = (e: any) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
    ctx?.lineTo(x, y)
    ctx?.stroke()
    if (e.touches) e.preventDefault()
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-2 w-full overflow-hidden">
      <h3 className="text-2xl font-bold text-primary">Doodle Board</h3>
      <div className="relative w-full max-w-2xl aspect-video bg-white rounded-3xl border-4 border-muted/50 shadow-inner overflow-hidden cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseOut={() => setIsDrawing(false)}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={() => setIsDrawing(false)}
        />
      </div>
      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-2xl overflow-x-auto w-full max-w-sm justify-center no-scrollbar">
        {["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"].map(c => (
          <button key={c} onClick={() => setColor(c)} className={cn("h-8 w-8 rounded-full border-2 shrink-0 transition-transform active:scale-125", color === c ? "scale-110 border-primary" : "border-white")} style={{ backgroundColor: c }} />
        ))}
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-none shadow-sm" onClick={clear}><Eraser className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

// --- 8. WHACK-A-TASK ---
function WhackATask() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [moles, setMoles] = React.useState(Array(9).fill(false))
  const [score, setScore] = React.useState(0)
  const [active, setActive] = React.useState(false)

  const whack = (i: number) => {
    if (moles[i]) {
      setScore(s => s + 1)
      const next = [...moles]; next[i] = false; setMoles(next)
    }
  }

  const toggleActive = () => {
    if (active) {
      setActive(false)
      saveGameScore(supabase, profile, "Whack-a-Task", score, "score")
    } else {
      setScore(0)
      setActive(true)
    }
  }

  React.useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      const next = Array(9).fill(false)
      next[Math.floor(Math.random() * 9)] = true
      setMoles(next)
    }, 800)
    return () => clearInterval(interval)
  }, [active])

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <h3 className="text-2xl font-bold text-primary">Whack-a-Task!</h3>
      <div className="grid grid-cols-3 gap-3 bg-amber-100/50 p-4 sm:p-6 rounded-[2.5rem] shadow-inner">
        {moles.map((isUp, i) => (
          <div key={i} className="relative w-20 h-20 sm:w-24 sm:h-24 bg-amber-900/10 rounded-full overflow-hidden">
            <button onClick={() => whack(i)} className={cn("absolute inset-0 transition-all duration-200", isUp ? "translate-y-0" : "translate-y-full")}>
              <div className="bg-primary p-4 rounded-2xl shadow-lg h-full flex items-center justify-center"><Smile className="h-10 w-10 text-white" /></div>
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-4">
        <div className="text-2xl font-black text-primary">Score: {score}</div>
        <Button className="rounded-xl px-4 h-12 font-bold bg-accent text-white" onClick={toggleActive}>{active ? 'End Game' : 'Start Game'}</Button>
      </div>
    </div>
  )
}

// --- 9. TETRIS ---

// --- 10. SIMON SAYS ---
function TinashePattern() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const { toast } = useToast();

  const [difficulty, setDifficulty] = React.useState<"easy" | "medium" | "hard">("easy")
  const [sequence, setSequence] = React.useState<number[]>([])
  const [userSequence, setUserSequence] = React.useState<number[]>([])
  const [activeColor, setActiveColor] = React.useState<number | null>(null)
  const [playing, setPlaying] = React.useState(false)
  
  const allColors = ["bg-rose-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500", "bg-fuchsia-500", "bg-lime-500"]
  const numBlocks = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8
  const currentColors = allColors.slice(0, numBlocks)

  const nextRound = (currentSeq: number[]) => {
    const next = [...currentSeq, Math.floor(Math.random() * numBlocks)]
    setSequence(next)
    playSequence(next)
  }

  const playSequence = async (seq: number[]) => {
    for (let i = 0; i < seq.length; i++) {
      audio.playBlip(300 + (seq[i] * 100), 'triangle')
      await new Promise(resolve => setTimeout(() => { setActiveColor(seq[i]); resolve(null) }, 600))
      await new Promise(resolve => setTimeout(() => { setActiveColor(null); resolve(null) }, 200))
    }
  }

  const handlePress = (i: number) => {
    if (!playing) return
    audio.playBlip(300 + (i * 100), 'triangle')
    setActiveColor(i)
    setTimeout(() => setActiveColor(null), 200)
    const nextUserSeq = [...userSequence, i]
    if (nextUserSeq[nextUserSeq.length - 1] !== sequence[nextUserSeq.length - 1]) {
      audio.playBoom(); // Dramatic loud noise!
      setTimeout(() => audio.playSad(), 1000); // Sad sound after boom
      saveGameScore(supabase, profile, "Tinashe Pattern", sequence.length - 1);
      toast({ title: "😭 Oops! Game Over", description: "You missed the pattern! Try again!", variant: "destructive" })
      setPlaying(false); setSequence([]); setUserSequence([])
      return
    }
    if (nextUserSeq.length === sequence.length) {
      setUserSequence([])
      setTimeout(() => { 
        audio.playWin(); 
        toast({ title: "🎉 Amazing!", description: "You got the pattern right! Next level!" })
        nextRound(sequence) 
      }, 1000)
    } else {
      setUserSequence(nextUserSeq)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4 w-full">
      <h3 className="text-2xl font-bold text-primary text-center">Tinashe Pattern</h3>
      
      {!playing && (
        <div className="flex gap-2">
          <Button variant={difficulty === "easy" ? "default" : "outline"} onClick={() => setDifficulty("easy")} className="rounded-xl">Easy (4)</Button>
          <Button variant={difficulty === "medium" ? "default" : "outline"} onClick={() => setDifficulty("medium")} className="rounded-xl">Medium (6)</Button>
          <Button variant={difficulty === "hard" ? "default" : "outline"} onClick={() => setDifficulty("hard")} className="rounded-xl">Hard (8)</Button>
        </div>
      )}

      <div className={cn(
        "grid gap-3 sm:gap-4 w-full max-w-sm justify-center", 
        difficulty === "easy" ? "grid-cols-2" : difficulty === "medium" ? "grid-cols-3" : "grid-cols-4"
      )}>
        {currentColors.map((c, i) => (
          <button 
            key={i} 
            onClick={() => handlePress(i)} 
            className={cn(
              "rounded-[2rem] shadow-lg transition-all active:scale-90", 
              difficulty === "easy" ? "w-28 h-28 sm:w-32 sm:h-32" : difficulty === "medium" ? "w-20 h-20 sm:w-24 sm:h-24" : "w-16 h-16 sm:w-20 sm:h-20",
              c, 
              activeColor === i ? "scale-110 brightness-150 shadow-2xl" : "opacity-80"
            )} 
          />
        ))}
      </div>
      <Button className="h-12 px-8 rounded-xl font-bold mt-4" onClick={() => { setSequence([]); setUserSequence([]); setPlaying(true); nextRound([]) }}>{playing ? "Restart" : "Start Game"}</Button>
    </div>
  )
}

// --- 11. BALLOON POP ---
function BalloonPop() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [balloons, setBalloons] = React.useState<{id: number, x: number, y: number, color: string}[]>([])
  const [score, setScore] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [gameOver, setGameOver] = React.useState(false)

  React.useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setBalloons(prev => [...prev, { id: Date.now(), x: Math.random() * 80 + 10, y: 100, color: ["bg-rose-400", "bg-blue-400", "bg-emerald-400", "bg-amber-400"][Math.floor(Math.random() * 4)] }])
    }, 1500)
    return () => clearInterval(interval)
  }, [playing])

  React.useEffect(() => {
    if (!playing) return;
    const move = setInterval(() => {
      setBalloons(prev => prev.map(b => ({ ...b, y: b.y - 2 })).filter(b => b.y > -10))
    }, 50)
    return () => clearInterval(move)
  }, [playing])

  const startGame = () => {
    setScore(0)
    setBalloons([])
    setPlaying(true)
    setGameOver(false)
  }

  const endGame = () => {
    setPlaying(false)
    setGameOver(true)
    saveGameScore(supabase, profile, "Pop", score, "score")
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4 w-full sm:min-w-[400px] md:min-w-[600px] overflow-hidden">
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="text-2xl font-bold text-primary">Balloon Pop</h3>
        <div className="flex gap-4 items-center">
          <div className="font-black text-primary text-xl md:text-2xl tracking-tighter bg-primary/10 px-4 py-2 rounded-2xl">Score: {score}</div>
          {playing && <Button onClick={endGame} variant="destructive" className="rounded-xl font-bold">End Game</Button>}
        </div>
      </div>
      <div className="relative w-full h-[380px] sm:h-[450px] bg-sky-100 rounded-[2.5rem] overflow-hidden border-4 border-sky-200">
        {!playing && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
            <Button onClick={startGame} className="px-8 py-6 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">START GAME</Button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md z-20 space-y-4">
            <h2 className="text-4xl font-black text-primary uppercase">Game Over</h2>
            <p className="text-xl font-bold text-muted-foreground">Final Score: {score}</p>
            <Button onClick={startGame} className="px-8 py-6 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">PLAY AGAIN</Button>
          </div>
        )}
        {balloons.map(b => (
          <button key={b.id} onPointerDown={(e) => { e.preventDefault(); if(playing) { audio.playBoom(); setScore(s => s + 1); setBalloons(prev => prev.filter(p => p.id !== b.id)) } }} className={cn("absolute w-12 h-16 sm:w-14 sm:h-18 rounded-[2rem] shadow-lg transition-transform active:scale-150 active:opacity-0", b.color)} style={{ left: `${b.x}%`, top: `${b.y}%` }}>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-4 bg-sky-300" />
          </button>
        ))}
      </div>
    </div>
  )
}

// --- 12. ROCK PAPER SCISSORS ---
function RockPaperScissors() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [user, setUser] = React.useState<string | null>(null)
  const [ai, setAi] = React.useState<string | null>(null)
  const [result, setResult] = React.useState("")
  const [score, setScore] = React.useState({ wins: 0, losses: 0, ties: 0 })
  const [animating, setAnimating] = React.useState(false)
  
  const moves = [
    { name: "Rock", icon: "🪨" },
    { name: "Paper", icon: "📄" },
    { name: "Scissors", icon: "✂️" }
  ]

  const play = (move: string) => {
    if (animating) return;
    
    setAnimating(true)
    setUser("✊") // Show fist while animating
    setAi("✊")
    setResult("...")
    
    setTimeout(() => {
      const aiMoveData = moves[Math.floor(Math.random() * 3)]
      const aiMove = aiMoveData.name
      const userMoveData = moves.find(m => m.name === move)!
      
      setUser(userMoveData.icon); 
      setAi(aiMoveData.icon)
      
      if (move === aiMove) {
         setResult("It's a Tie!")
         setScore(s => ({ ...s, ties: s.ties + 1 }))
      }
      else if ((move === "Rock" && aiMove === "Scissors") || (move === "Paper" && aiMove === "Rock") || (move === "Scissors" && aiMove === "Paper")) {
         setResult("You Win! 🎉")
         setScore(s => ({ ...s, wins: s.wins + 1 }))
      }
      else {
         setResult("AI Wins! 🤖")
         setScore(s => ({ ...s, losses: s.losses + 1 }))
      }
      setAnimating(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-5 px-4 w-full">
      <div className="flex justify-between w-full max-w-sm px-4 bg-muted/30 rounded-2xl py-3 font-bold text-sm">
         <div className="text-emerald-500 flex flex-col items-center"><span>WINS</span><span className="text-2xl font-black">{score.wins}</span></div>
         <div className="text-amber-500 flex flex-col items-center"><span>TIES</span><span className="text-2xl font-black">{score.ties}</span></div>
         <div className="text-rose-500 flex flex-col items-center"><span>LOSSES</span><span className="text-2xl font-black">{score.losses}</span></div>
      </div>
      
      <div className="flex gap-2 sm:gap-4 flex-wrap justify-center mt-4">
        {moves.map(m => (
          <Button key={m.name} onClick={() => play(m.name)} disabled={animating} className="rounded-2xl h-16 w-24 sm:w-28 font-black text-lg shadow-lg flex-col gap-1 active:scale-95 transition-all">
             <span className="text-2xl">{m.icon}</span>
          </Button>
        ))}
      </div>
      
      <div className="w-full flex items-center justify-center space-x-8 mt-8 h-40">
        <div className="flex flex-col items-center">
           <div className="text-sm font-bold text-muted-foreground mb-2">YOU</div>
           <div className={`text-6xl ${animating ? 'animate-bounce' : 'animate-in zoom-in duration-300'}`}>{user || "❓"}</div>
        </div>
        <div className="text-3xl font-black text-primary italic">VS</div>
        <div className="flex flex-col items-center">
           <div className="text-sm font-bold text-muted-foreground mb-2">AI</div>
           <div className={`text-6xl ${animating ? 'animate-bounce' : 'animate-in zoom-in duration-300'}`}>{ai || "❓"}</div>
        </div>
      </div>
      
      <div className="h-12 flex items-center justify-center">
        {!animating && result && (
           <div className="text-3xl md:text-4xl font-black text-primary uppercase italic tracking-tighter animate-in slide-in-from-bottom-4 duration-300">
             {result}
           </div>
        )}
      </div>
    </div>
  )
}

// --- 13. REACTION TEST ---
function ReactionTest() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [state, setState] = React.useState<"idle" | "waiting" | "ready" | "result">("idle")
  const [startTime, setStartTime] = React.useState(0)
  const [time, setTime] = React.useState(0)
  const timeoutRef = React.useRef<any>(null)

  const start = () => {
    setState("waiting")
    timeoutRef.current = setTimeout(() => {
      setState("ready"); setStartTime(Date.now())
    }, Math.random() * 3000 + 2000)
  }

  const handleClick = () => {
    if (state === "waiting") {
      clearTimeout(timeoutRef.current); alert("Too early!"); setState("idle")
    } else if (state === "ready") {
      const reactionTime = Date.now() - startTime;
      setTime(reactionTime); setState("result"); saveGameScore(supabase, profile, "Reaction", reactionTime);
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4 w-full h-full">
      <div onClick={state === "idle" || state === "result" ? start : handleClick} className={cn("w-full max-w-md h-64 rounded-[3rem] flex items-center justify-center text-3xl font-black text-white cursor-pointer transition-colors shadow-2xl active:scale-95 duration-100", 
        state === "idle" ? "bg-primary" : state === "waiting" ? "bg-rose-500" : state === "ready" ? "bg-emerald-500" : "bg-blue-600"
      )}>
        {state === "idle" ? "Tap to Start" : state === "waiting" ? "Wait for Green, ..." : state === "ready" ? "TAP NOW!" : `${time}ms!`}
      </div>
      {state === "result" && <Button variant="outline" className="h-12 px-4 rounded-xl font-bold" onClick={start}>Try Again</Button>}
    </div>
  )
}

// --- 14. SPEED CLICKER ---
function SpeedClicker() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [clicks, setClicks] = React.useState(0)
  const [timeLeft, setTimeLeft] = React.useState(10)
  const [active, setActive] = React.useState(false)

  React.useEffect(() => {
    if (active && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && active) {
      setActive(false);
      saveGameScore(supabase, profile, "Clicker", clicks);
    }
  }, [active, timeLeft, clicks, supabase, profile])

  return (
    <div className="flex flex-col items-center space-y-10 py-5 px-4">
      <div className="text-center space-y-1">
        <h3 className="text-5xl font-black text-primary tracking-tighter">{clicks} Clicks</h3>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">{timeLeft}s Remaining</p>
      </div>
      <button 
        disabled={timeLeft === 0 && clicks > 0} 
        onClick={() => { if (!active && timeLeft === 10) setActive(true); if (active) setClicks(c => c + 1) }} 
        className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-accent text-white font-black text-3xl shadow-2xl active:scale-90 transition-transform shadow-accent/20 border-8 border-white"
      >
        {timeLeft === 10 && clicks === 0 ? "START" : "CLICK!"}
      </button>
      {timeLeft === 0 && <Button className="h-12 px-4 rounded-xl font-bold" onClick={() => { setClicks(0); setTimeLeft(10) }}>Reset</Button>}
    </div>
  )
}

// --- 15. COLOR FINDER ---
function ColorFinder() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [target, setTarget] = React.useState(0)
  const [colors, setColors] = React.useState<string[]>([])
  const [score, setScore] = React.useState(0)

  const generate = React.useCallback(() => {
    const r = Math.floor(Math.random() * 200); const g = Math.floor(Math.random() * 200); const b = Math.floor(Math.random() * 200)
    const base = `rgb(${r},${g},${b})`; const diff = `rgb(${r+20},${g+20},${b+20})`
    const nextTarget = Math.floor(Math.random() * 4)
    const nextColors = [base, base, base, base]; nextColors[nextTarget] = diff
    setColors(nextColors); setTarget(nextTarget)
  }, [])

  React.useEffect(() => { generate() }, [generate])

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <h3 className="text-2xl font-bold text-primary">Find the Odd Color</h3>
      <div className="grid grid-cols-2 gap-4">
        {colors.map((c, i) => (
          <button key={i} onClick={() => { if (i === target) { setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Colors", ns); return ns; }); generate() } else { setScore(0); generate() } }} className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="text-lg font-black uppercase text-primary tracking-widest">Score: {score}</div>
    </div>
  )
}

// --- 16. DICE ROLLER ---
function DiceRoller() {
  const [val, setVal] = React.useState(1)
  const [rolling, setRolling] = React.useState(false)
  const diceRef = React.useRef<HTMLDivElement>(null)

  const roll = () => {
    setRolling(true)
    const xRand = Math.floor(Math.random() * 4) + 1
    const yRand = Math.floor(Math.random() * 4) + 1
    const result = Math.floor(Math.random() * 6) + 1
    
    setVal(result)
    
    if (diceRef.current) {
      const rotations: Record<number, string> = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateY(-90deg)',
        3: 'rotateY(180deg)',
        4: 'rotateY(90deg)',
        5: 'rotateX(-90deg)',
        6: 'rotateX(90deg)'
      }
      
      const spinX = xRand * 360
      const spinY = yRand * 360
      const targetRotation = rotations[result]
      
      const matchX = targetRotation.match(/rotateX\(([-]?\d+)deg\)/)
      const matchY = targetRotation.match(/rotateY\(([-]?\d+)deg\)/)
      
      let finalX = spinX + (matchX ? parseInt(matchX[1]) : 0)
      let finalY = spinY + (matchY ? parseInt(matchY[1]) : 0)

      diceRef.current.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`
    }

    setTimeout(() => setRolling(false), 1000)
  }

  return (
    <div className="flex flex-col items-center space-y-16 py-12 px-4" style={{ perspective: '1000px' }}>
      <div 
        ref={diceRef}
        className="relative w-32 h-32 transition-transform duration-1000 ease-out"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(0deg) rotateY(0deg)' }}
      >
         {/* 1 (Front) */}
         <div className="absolute w-full h-full bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-lg" style={{ transform: 'translateZ(64px)' }}>
           <div className="w-6 h-6 bg-primary rounded-full"></div>
         </div>
         {/* 3 (Back) */}
         <div className="absolute w-full h-full bg-white border border-slate-200 rounded-2xl flex justify-between p-5 shadow-lg" style={{ transform: 'rotateY(180deg) translateZ(64px)' }}>
           <div className="w-6 h-6 bg-primary rounded-full self-start"></div>
           <div className="w-6 h-6 bg-primary rounded-full self-center"></div>
           <div className="w-6 h-6 bg-primary rounded-full self-end"></div>
         </div>
         {/* 4 (Right) -> 4 dots */}
         <div className="absolute w-full h-full bg-white border border-slate-200 rounded-2xl flex justify-between p-5 shadow-lg" style={{ transform: 'rotateY(90deg) translateZ(64px)' }}>
           <div className="flex flex-col justify-between"><div className="w-6 h-6 bg-primary rounded-full"></div><div className="w-6 h-6 bg-primary rounded-full"></div></div>
           <div className="flex flex-col justify-between"><div className="w-6 h-6 bg-primary rounded-full"></div><div className="w-6 h-6 bg-primary rounded-full"></div></div>
         </div>
         {/* 2 (Left) -> 2 dots */}
         <div className="absolute w-full h-full bg-white border border-slate-200 rounded-2xl flex justify-between p-5 shadow-lg" style={{ transform: 'rotateY(-90deg) translateZ(64px)' }}>
           <div className="w-6 h-6 bg-primary rounded-full self-start"></div>
           <div className="w-6 h-6 bg-primary rounded-full self-end"></div>
         </div>
         {/* 5 (Top) */}
         <div className="absolute w-full h-full bg-white border border-slate-200 rounded-2xl flex justify-between p-5 shadow-lg" style={{ transform: 'rotateX(90deg) translateZ(64px)' }}>
           <div className="flex flex-col justify-between"><div className="w-6 h-6 bg-primary rounded-full"></div><div className="w-6 h-6 bg-primary rounded-full"></div></div>
           <div className="w-6 h-6 bg-primary rounded-full self-center"></div>
           <div className="flex flex-col justify-between"><div className="w-6 h-6 bg-primary rounded-full"></div><div className="w-6 h-6 bg-primary rounded-full"></div></div>
         </div>
         {/* 6 (Bottom) */}
         <div className="absolute w-full h-full bg-white border border-slate-200 rounded-2xl flex justify-between p-5 shadow-lg" style={{ transform: 'rotateX(-90deg) translateZ(64px)' }}>
           <div className="flex flex-col justify-between"><div className="w-6 h-6 bg-primary rounded-full"></div><div className="w-6 h-6 bg-primary rounded-full"></div><div className="w-6 h-6 bg-primary rounded-full"></div></div>
           <div className="flex flex-col justify-between"><div className="w-6 h-6 bg-primary rounded-full"></div><div className="w-6 h-6 bg-primary rounded-full"></div><div className="w-6 h-6 bg-primary rounded-full"></div></div>
         </div>
      </div>
      <Button onClick={roll} disabled={rolling} className="rounded-2xl h-16 w-48 text-xl font-black shadow-xl shadow-primary/20">ROLL DICE</Button>
    </div>
  )
}

// --- 17. NUMBER GUESS ---
function NumberGuess() {
  const [num, setTarget] = React.useState(Math.floor(Math.random() * 100) + 1)
  const [guess, setGuess] = React.useState("")
  const [msg, setMsg] = React.useState("Guess between 1-100")

  const check = () => {
    const val = parseInt(guess)
    if (val === num) { setMsg("CORRECT! 🎉"); setTarget(Math.floor(Math.random() * 100) + 1) }
    else if (val < num) setMsg("HIGHER ⬆️")
    else setMsg("LOWER ⬇️")
    setGuess("")
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-5 px-4">
      <h3 className="text-3xl md:text-4xl font-black text-primary uppercase text-center leading-tight">{msg}</h3>
      <div className="flex gap-2 w-full max-w-xs">
        <Input type="number" inputMode="numeric" value={guess} onChange={(e) => setGuess(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="?" className="h-16 text-3xl font-black text-center rounded-2xl" />
        <Button onClick={check} className="h-16 px-4 bg-accent rounded-2xl font-black text-lg">CHECK</Button>
      </div>
    </div>
  )
}

// --- 18. KID TYPER ---
function TypingGame() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const words = ["HUB", "FAMILY", "JOY", "STAR", "BRAVE", "KIND", "HAPPY"]
  const [word, setWord] = React.useState(words[0])
  const [input, setInput] = React.useState("")
  const [score, setScore] = React.useState(0)

  const handleChange = (val: string) => {
    if (val.toUpperCase().trim() === word.toUpperCase().trim()) {
      setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Typing", ns); return ns; }); setInput(""); setWord(words[Math.floor(Math.random() * words.length)])
    } else setInput(val)
  }

  return (
    <div className="flex flex-col items-center space-y-10 py-5 px-4">
      <div className="text-center space-y-2">
        <div className="text-4xl sm:text-6xl font-black text-primary tracking-widest uppercase italic">{word}</div>
        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Type the word above!</p>
      </div>
      <Input autoFocus value={input} onChange={(e) => handleChange(e.target.value)} className="h-16 text-center text-3xl font-black rounded-2xl w-full max-w-xs bg-muted/20 border-none shadow-inner" />
      <div className="text-sm font-black uppercase text-primary tracking-widest bg-primary/10 px-4 py-1 rounded-full">Words: {score}</div>
    </div>
  )
}

// --- 19. SLOT MACHINE ---
function SlotMachine() {
  const items = ["⭐", "❤️", "💎", "🌈", "🔥"]
  const [reels, setReels] = React.useState(["⭐", "⭐", "⭐"])
  const [spinning, setSpinning] = React.useState(false)

  const spin = () => {
    setSpinning(true)
    let count = 0
    const interval = setInterval(() => {
      setReels([items[Math.floor(Math.random() * 5)], items[Math.floor(Math.random() * 5)], items[Math.floor(Math.random() * 5)]])
      count++
      if (count > 15) { clearInterval(interval); setSpinning(false) }
    }, 80)
  }

  const win = !spinning && reels[0] === reels[1] && reels[1] === reels[2]

  return (
    <div className="flex flex-col items-center space-y-10 py-5 px-4">
      <div className="flex gap-3 md:gap-4 p-6 sm:p-10 bg-muted/20 rounded-[3rem] shadow-inner">
        {reels.map((r, i) => (
          <div key={i} className="w-20 h-24 sm:w-24 sm:h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl sm:text-5xl border-b-8 border-muted active:translate-y-1 transition-transform">
            {r}
          </div>
        ))}
      </div>
      {win && <div className="text-3xl font-black text-primary animate-bounce">JACKPOT! 🏆</div>}
      <Button onClick={spin} disabled={spinning} className="h-16 px-16 rounded-[2rem] font-black text-xl bg-accent shadow-2xl shadow-accent/20 active:scale-95 transition-all">SPIN</Button>
    </div>
  )
}

// --- 20. FLAPPY BLOCK ---
function FlappyBlock({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [playing, setPlaying] = React.useState(false);
  const [gameOver, setGameOver] = React.useState(false);
  const [score, setScore] = React.useState(0);
  
  const birdY = React.useRef(50);
  const velocity = React.useRef(0);
  const pipes = React.useRef<{x: number, topHeight: number, passed: boolean}[]>([]);
  const frameRef = React.useRef<number | null>(null);
  const scoreRef = React.useRef(0);
  
  const [renderObj, setRenderObj] = React.useState({ y: 50, pipes: [] as any[] });

  const GRAVITY = 0.6;
  const JUMP = -8;
  const PIPE_SPEED = 3;
  const PIPE_SPAWN_RATE = 100;
  const GAP_SIZE = 35;
  
  const reset = () => {
    birdY.current = 50;
    velocity.current = 0;
    pipes.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setPlaying(true);
    setRenderObj({ y: 50, pipes: [] });
  };

  const jump = () => {
    audio.playBlip(600, "square");
    if (!playing && !gameOver) reset();
    if (gameOver) reset();
    velocity.current = JUMP;
  };

  React.useEffect(() => {
    let frameCount = 0;
    const loop = () => {
      if (!playing || gameOver) return;
      
      velocity.current += GRAVITY;
      birdY.current += velocity.current;
      
      if (frameCount % PIPE_SPAWN_RATE === 0) {
        const topHeight = Math.random() * 40 + 10;
        pipes.current.push({ x: 100, topHeight, passed: false });
      }
      
      let collided = false;
      pipes.current.forEach(p => {
        
        // Difficulty increase: pipes move slightly faster as score goes up
        p.x -= (PIPE_SPEED + Math.min(2, scoreRef.current * 0.1)) * 0.2; 
        
        if (p.x < 15 && p.x > 5) {
          if (birdY.current < p.topHeight || birdY.current > p.topHeight + GAP_SIZE) {
            audio.playCrash(); collided = true;
          }
        }
        
        if (p.x < 10 && !p.passed) {
          p.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      });
      
      pipes.current = pipes.current.filter(p => p.x > -20);
      
      if (birdY.current > 100 || birdY.current < 0) collided = true;
      
      if (collided) {
        setGameOver(true);
        setPlaying(false);
        saveGameScore(supabase, profile, 'Flappy Block', scoreRef.current, 'score');
      } else {
        setRenderObj({ y: birdY.current, pipes: [...pipes.current] });
        frameRef.current = requestAnimationFrame(loop);
      }
      frameCount++;
    };
    
    if (playing) frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, gameOver, profile, supabase]);

  return (
    <div className="flex flex-col items-center p-4 space-y-4 select-none" onClick={jump}>
      <h3 className="text-2xl font-bold text-primary">Flappy Block</h3>
      <p className="text-muted-foreground text-sm">Tap or Click to fly!</p>
      
      <div className="relative w-full max-w-sm h-96 bg-sky-200 overflow-hidden rounded-2xl border-4 border-primary/20 shadow-inner cursor-pointer">
        {!playing && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
            <Button className="rounded-xl font-bold text-lg px-8 py-6">PLAY</Button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 space-y-4">
            <div className="text-4xl font-black text-white drop-shadow-md">CRASH!</div>
            <div className="text-xl font-bold text-white bg-black/50 px-4 py-2 rounded-xl">Score: {score}</div>
            <Button className="rounded-xl font-bold">Play Again</Button>
          </div>
        )}
        
        <div className="absolute font-black text-4xl text-white/50 top-4 right-4 z-0">{score}</div>
        
        <div 
          className="absolute w-8 h-8 bg-yellow-400 border-2 border-black rounded-lg shadow-sm z-20 transition-transform duration-75"
          style={{ top: `${renderObj.y}%`, left: '10%', transform: `translateY(-50%) rotate(${Math.min(Math.max(velocity.current * 3, -45), 90)}deg)` }}
        >
           <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"><div className="w-1 h-1 bg-black rounded-full" /></div>
        </div>
        
        {renderObj.pipes.map((p, i) => (
          <React.Fragment key={i}>
            <div className="absolute bg-emerald-500 border-2 border-green-800" style={{ left: `${p.x}%`, top: 0, width: '15%', height: `${p.topHeight}%` }} />
            <div className="absolute bg-emerald-500 border-2 border-green-800" style={{ left: `${p.x}%`, top: `${p.topHeight + GAP_SIZE}%`, width: '15%', bottom: 0 }} />
          </React.Fragment>
        ))}
        
        <div className="absolute bottom-0 w-full h-4 bg-green-600 border-t-4 border-green-800" />
      </div>
    </div>
  );
}

// --- 21. 2048 CLONE ---
function Game2048({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase();
  const { profile } = useUser();
  
  const [grid, setGrid] = React.useState<number[][]>(Array(4).fill(0).map(() => Array(4).fill(0)));
  const [score, setScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);

  const addRandomTile = React.useCallback((currentGrid: number[][]) => {
    const emptyCells = [];
    for(let r=0; r<4; r++) {
      for(let c=0; c<4; c++) {
        if (currentGrid[r][c] === 0) emptyCells.push({r, c});
      }
    }
    if (emptyCells.length > 0) {
      const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }, []);

  const initGame = React.useCallback(() => {
    const newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  }, [addRandomTile]);

  React.useEffect(() => {
    initGame();
  }, [initGame]);

  const handleKeyDown = React.useCallback((e: KeyboardEvent | { key: string }) => {
    if (gameOver) return;
    let newGrid = JSON.parse(JSON.stringify(grid));
    let newScore = score;

    const slide = (row: number[]) => {
      let arr = row.filter(val => val);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] !== 0 && arr[i] === arr[i+1]) {
          arr[i] *= 2;
          newScore += arr[i];
          arr[i+1] = 0;
        }
      }
      arr = arr.filter(val => val);
      while(arr.length < 4) arr.push(0);
      return arr;
    };

    if (e.key === 'ArrowLeft') {
      newGrid = newGrid.map((row: number[]) => slide(row));
    } else if (e.key === 'ArrowRight') {
      newGrid = newGrid.map((row: number[]) => slide(row.reverse()).reverse());
    } else if (e.key === 'ArrowUp') {
      for(let c=0; c<4; c++) {
        let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        col = slide(col);
        for(let r=0; r<4; r++) newGrid[r][c] = col[r];
      }
    } else if (e.key === 'ArrowDown') {
      for(let c=0; c<4; c++) {
        let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]].reverse();
        col = slide(col).reverse();
        for(let r=0; r<4; r++) newGrid[r][c] = col[r];
      }
    } else {
      return;
    }

    if (JSON.stringify(grid) !== JSON.stringify(newGrid)) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      
      let canMove = false;
      for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
          if (newGrid[r][c] === 0) canMove = true;
          if (r < 3 && newGrid[r][c] === newGrid[r+1][c]) canMove = true;
          if (c < 3 && newGrid[r][c] === newGrid[r][c+1]) canMove = true;
        }
      }
      if (!canMove) {
        setGameOver(true);
        saveGameScore(supabase, profile, '2048', newScore, 'score');
      }
    }
  }, [grid, score, gameOver, addRandomTile, profile, supabase]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
       if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
         e.preventDefault();
       }
       handleKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown]);

  const [touchStart, setTouchStart] = React.useState<{x: number, y: number} | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) handleKeyDown({ key: 'ArrowRight' });
      else if (dx < -30) handleKeyDown({ key: 'ArrowLeft' });
    } else {
      if (dy > 30) handleKeyDown({ key: 'ArrowDown' });
      else if (dy < -30) handleKeyDown({ key: 'ArrowUp' });
    }
    setTouchStart(null);
  };

  const colors: Record<number, string> = {
    0: 'bg-muted/30', 2: 'bg-amber-100 text-amber-900', 4: 'bg-amber-200 text-amber-900',  
    8: 'bg-orange-300 text-white', 16: 'bg-orange-400 text-white', 32: 'bg-orange-500 text-white',
    64: 'bg-red-500 text-white', 128: 'bg-yellow-400 text-white shadow-lg', 
    256: 'bg-yellow-500 text-white shadow-lg', 512: 'bg-yellow-600 text-white shadow-xl',
    1024: 'bg-emerald-500 text-white shadow-xl', 2048: 'bg-purple-500 text-white shadow-2xl'
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4 select-none outline-none" tabIndex={0}>
      <h3 className="text-2xl font-bold text-primary">2048</h3>
      <div className="flex justify-between w-full max-w-xs items-end">
        <p className="text-muted-foreground text-sm">Join the numbers!</p>
        <div className="bg-primary/10 px-4 py-2 rounded-xl font-bold text-primary">Score: {score}</div>
      </div>
      
      <div 
        className="w-full max-w-xs bg-muted p-2 rounded-2xl relative touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {gameOver && (
          <div className="absolute inset-0 bg-white/80 z-10 rounded-2xl flex flex-col items-center justify-center space-y-4 backdrop-blur-sm">
            <div className="text-3xl font-black text-primary">Game Over!</div>
            <Button onClick={initGame} className="rounded-xl font-bold">Try Again</Button>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          {grid.map((row, r) => row.map((val, c) => (
            <div key={`${r}-${c}`} className={`aspect-square flex items-center justify-center rounded-xl font-black text-2xl transition-all duration-100 ${colors[val > 2048 ? 2048 : val] || 'bg-black text-white'}`}>
              {val > 0 ? val : ''}
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}

// --- 22. MINESWEEPER ---
function Minesweeper({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [grid, setGrid] = React.useState<any[]>([]);
  const [gameOver, setGameOver] = React.useState(false);
  const [won, setWon] = React.useState(false);
  const [minesCount] = React.useState(10);
  const ROWS = 9;
  const COLS = 9;

  const initGame = () => {
    let newGrid = Array(ROWS).fill(0).map(() => Array(COLS).fill(0).map(() => ({ isMine: false, isRevealed: false, isFlagged: false, neighbors: 0 })));
    let minesPlaced = 0;
    while(minesPlaced < minesCount) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if(!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }
    for(let r=0; r<ROWS; r++){
      for(let c=0; c<COLS; c++){
        if(!newGrid[r][c].isMine) {
          let count = 0;
          for(let i=-1; i<=1; i++) {
            for(let j=-1; j<=1; j++) {
              if(r+i>=0 && r+i<ROWS && c+j>=0 && c+j<COLS && newGrid[r+i][c+j].isMine) count++;
            }
          }
          newGrid[r][c].neighbors = count;
        }
      }
    }
    setGrid(newGrid);
    setGameOver(false);
    setWon(false);
  };

  React.useEffect(() => { initGame(); }, []);

  const reveal = (r: number, c: number) => {
    if (gameOver || won || grid[r][c].isRevealed || grid[r][c].isFlagged) return;
    const newGrid = [...grid.map(row => [...row])];
    
    if (newGrid[r][c].isMine) {
      audio.playBoom();
      newGrid.forEach(row => row.forEach(cell => { if (cell.isMine) cell.isRevealed = true; }));
      setGrid(newGrid);
      setGameOver(true);
      return;
    }

    const floodFill = (row: number, col: number) => {
      if (row<0 || row>=ROWS || col<0 || col>=COLS || newGrid[row][col].isRevealed || newGrid[row][col].isFlagged) return;
      newGrid[row][col].isRevealed = true;
      if (newGrid[row][col].neighbors === 0) {
        for(let i=-1; i<=1; i++) {
          for(let j=-1; j<=1; j++) {
            floodFill(row+i, col+j);
          }
        }
      }
    };
    
    audio.playBlip(600);
    floodFill(r, c);
    setGrid(newGrid);
    
    let unrevealedSafe = 0;
    newGrid.forEach(row => row.forEach(cell => { if (!cell.isMine && !cell.isRevealed) unrevealedSafe++; }));
    if (unrevealedSafe === 0) {
      audio.playWin();
      setWon(true);
      saveGameScore(supabase, profile, 'Minesweeper', 1, 'win');
    }
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || grid[r][c].isRevealed) return;
    const newGrid = [...grid.map(row => [...row])];
    audio.playBlip(800, 'triangle');
    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
    setGrid(newGrid);
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4 select-none">
      <h3 className="text-2xl font-bold text-primary">Minesweeper</h3>
      <div className="flex gap-4 items-center">
        <p className="text-muted-foreground text-sm">Long press or Right click to flag</p>
        <Button size="sm" variant="outline" onClick={initGame}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      
      <div className="bg-muted p-2 rounded-xl border-4 border-muted/50 shadow-inner max-w-full overflow-x-auto">
        {(gameOver || won) && (
          <div className="text-center font-black text-xl p-2 animate-bounce">
            {won ? '🏆 YOU WON!' : '💥 BOOM!'}
          </div>
        )}
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {grid.map((row, r) => row.map((cell: any, c: number) => (
            <button
              key={`${r}-${c}`}
              onClick={() => reveal(r, c)}
              onContextMenu={(e) => toggleFlag(e, r, c)}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold rounded shadow-sm ${
                cell.isRevealed 
                  ? (cell.isMine ? 'bg-red-500' : 'bg-white text-primary') 
                  : 'bg-primary/20 hover:bg-primary/30 active:scale-95 border-b-2 border-primary/20'
              }`}
            >
              {cell.isRevealed ? (cell.isMine ? '💣' : (cell.neighbors > 0 ? cell.neighbors : '')) : (cell.isFlagged ? '🚩' : '')}
            </button>
          )))}
        </div>
      </div>
    </div>
  );
}

// --- 24. WORD GUESS ---
const WORDS = ["APPLE", "TRAIN", "HOUSE", "SMILE", "BRAVE", "SMART", "FUNNY", "HAPPY", "GHOST", "PUPPY", "DREAM", "WATER", "LIGHT", "MAGIC", "WORLD"];
function WordGuess() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [target, setTarget] = React.useState("");
  const [guesses, setGuesses] = React.useState<string[]>([]);
  const [current, setCurrent] = React.useState("");
  const [gameOver, setGameOver] = React.useState(false);

  React.useEffect(() => { init(); }, []);

  const init = () => {
    setTarget(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrent("");
    setGameOver(false);
  };

  const onKey = React.useCallback((key: string) => {
    if (gameOver) return;
    if (key === 'Enter') {
      if (current.length !== 5) return;
      const newGuesses = [...guesses, current];
      setGuesses(newGuesses);
      setCurrent("");
      if (current === target) {
        setGameOver(true);
        saveGameScore(supabase, profile, 'Word Guess', 6 - guesses.length, 'score');
      } else if (newGuesses.length >= 6) {
        setGameOver(true);
      }
    } else if (key === 'Backspace') {
      setCurrent(current.slice(0, -1));
    } else if (current.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrent(current + key);
    }
  }, [current, gameOver, guesses, target, profile, supabase]);

  React.useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
       if (e.key === 'Backspace' || e.key === 'Enter' || /^[a-zA-Z]$/.test(e.key)) {
         onKey(e.key.toUpperCase());
       }
    };
    window.addEventListener('keydown', handleDown);
    return () => window.removeEventListener('keydown', handleDown);
  }, [onKey]);

  const rows = [...guesses, current, ...Array(Math.max(0, 5 - guesses.length)).fill("")];

  return (
    <div className="flex flex-col items-center p-4 space-y-4 select-none outline-none" tabIndex={0}>
      <h3 className="text-2xl font-bold text-primary">Word Guess</h3>
      <p className="text-muted-foreground text-sm">Guess the 5-letter word!</p>
      
      {gameOver && (
        <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-xl">
          <div className="font-bold">{guesses[guesses.length-1] === target ? '🎉 You got it!' : `❌ Word was ${target}`}</div>
          <Button size="sm" onClick={init}>Play Again</Button>
        </div>
      )}

      <div className="grid gap-2">
        {rows.slice(0,6).map((word, r) => (
          <div key={r} className="flex gap-2">
            {Array(5).fill("").map((_, c) => {
              const letter = word[c] || "";
              let bg = "bg-muted";
              let text = "text-foreground";
              if (r < guesses.length) {
                text = "text-white";
                if (target[c] === letter) bg = "bg-emerald-500";
                else if (target.includes(letter)) bg = "bg-yellow-500";
                else bg = "bg-gray-400";
              } else if (r === guesses.length && letter) {
                bg = "bg-background border-2 border-primary/50";
              }
              return (
                <div key={c} className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl font-black rounded-xl ${bg} ${text} transition-colors uppercase`}>
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="grid gap-1 mt-4 max-w-sm w-full px-2">
         {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, i) => (
           <div key={i} className="flex justify-center gap-1">
             {i === 2 && <Button variant="secondary" className="px-1 md:px-2" onClick={() => onKey('Enter')}>ENT</Button>}
             {row.split('').map(k => (
               <Button key={k} variant="outline" className="px-2 md:px-3 h-10 font-bold" onClick={() => onKey(k)}>{k}</Button>
             ))}
             {i === 2 && <Button variant="secondary" className="px-1 md:px-2" onClick={() => onKey('Backspace')}>DEL</Button>}
           </div>
         ))}
      </div>
    </div>
  );
}

// --- 25. TOWER STACKER ---
function TowerStacker({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [playing, setPlaying] = React.useState(false);
  const [gameOver, setGameOver] = React.useState(false);
  
  const widthRef = React.useRef(100);
  const posRef = React.useRef(0);
  const dirRef = React.useRef(1);
  const stackRef = React.useRef<{w: number, x: number, color: string}[]>([]);
  const frameRef = React.useRef<number | null>(null);
  
  const [renderStack, setRenderStack] = React.useState<{w: number, x: number, color: string}[]>([]);
  const [currentBlock, setCurrentBlock] = React.useState({ w: 100, x: 0 });

  const SPEED = 4;

  const reset = () => {
    widthRef.current = 100;
    posRef.current = -120;
    dirRef.current = 1;
    stackRef.current = [{ w: 100, x: 0, color: '#10b981' }];
    setRenderStack([{ w: 100, x: 0, color: '#10b981' }]);
    setCurrentBlock({ w: 100, x: -120 });
    setGameOver(false);
    setPlaying(true);
  };

  React.useEffect(() => {
    const loop = () => {
      if (!playing || gameOver) return;
      const speed = 2 + (stackRef.current.length * 0.2); // dynamic difficulty
      posRef.current += dirRef.current * speed;
      if (posRef.current > 120) dirRef.current = -1;
      if (posRef.current < -120) dirRef.current = 1;
      
      setCurrentBlock({ w: widthRef.current, x: posRef.current });
      frameRef.current = requestAnimationFrame(loop);
    };
    if (playing) frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    }
  }, [playing, gameOver]);

  const place = () => {
    if (!playing && !gameOver) { reset(); return; }
    if (gameOver) { reset(); return; }

    const top = stackRef.current[stackRef.current.length - 1];
    const diff = posRef.current - top.x;
    
    if (Math.abs(diff) > widthRef.current) {
      audio.playCrash();
      setGameOver(true);
      setPlaying(false);
      saveGameScore(supabase, profile, 'Tower Stacker', stackRef.current.length - 1, 'score');
      return;
    }
    
    audio.playBlip(700, "square");
    const newWidth = widthRef.current - Math.abs(diff);
    widthRef.current = newWidth;
    
    const newX = top.x + (diff / 2);
    
    const hue = (stackRef.current.length * 20) % 360;
    stackRef.current.push({ w: newWidth, x: newX, color: `hsl(${hue}, 70%, 50%)` });
    setRenderStack([...stackRef.current]);
    
    posRef.current = dirRef.current === 1 ? -120 : 120;
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4 select-none" onClick={place}>
      <h3 className="text-2xl font-bold text-primary">Tower Stacker</h3>
      <p className="text-muted-foreground text-sm">Click to stack perfectly!</p>
      
      <div className="relative w-full max-w-sm h-96 bg-slate-900 rounded-3xl overflow-hidden border-4 border-primary/20 shadow-inner flex flex-col justify-end pb-4 cursor-pointer">
        {!playing && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
            <Button className="px-8 py-6 rounded-xl font-bold text-lg">START</Button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 space-y-4">
            <div className="text-3xl font-black text-white">GAME OVER</div>
            <div className="text-xl font-bold text-emerald-400">Score: {renderStack.length - 1}</div>
            <Button className="rounded-xl font-bold">Try Again</Button>
          </div>
        )}
        
        <div className="absolute font-black text-4xl text-white/20 top-4 right-4">{renderStack.length > 0 ? renderStack.length - 1 : 0}</div>

        <div className="relative w-full h-8 flex justify-center">
          {playing && !gameOver && (
             <div className="absolute h-8 transition-none bg-yellow-400 rounded border border-yellow-200" style={{ width: `${currentBlock.w}%`, transform: `translateX(${currentBlock.x}px)` }} />
          )}
        </div>
        
        <div className="flex flex-col-reverse items-center w-full">
          {renderStack.map((b, i) => (
             <div key={i} className="h-8 rounded border border-white/20 transition-all duration-300" style={{ width: `${b.w}%`, transform: `translateX(${b.x}px)`, backgroundColor: b.color }} />
          )).reverse()}
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

function Leaderboard() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const tournamentQuery = React.useMemo(() => {
    if (!supabase || !profile?.family_id) return null
    return supabase.from("arcade_tournaments")
      .select("*")
      .eq("family_id", profile.family_id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
  }, [supabase, profile?.family_id])
  const { data: tournaments } = useCollection(tournamentQuery)
  const activeTournament = tournaments?.[0] || null
  const [scores, setScores] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!supabase || !profile?.family_id) return;
    
    const now = new Date();
    // Get start of week (Sunday midnight)
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0).toISOString();

    const fetchScores = async () => {
      const { data: scoresData, error: scoresError } = await supabase
        .from('arcade_scores')
        .select('*')
        .eq('family_id', profile.family_id)
        .gte('updated_at', startOfWeek);

      if (scoresError) {
        console.error("Supabase Error:", scoresError);
      }

      if (scoresData && scoresData.length > 0) {
        // Sort in memory to avoid column name issues
        const sortedScores = scoresData.sort((a, b) => {
           const valA = a.best_score ?? a.score ?? a.wins ?? 0;
           const valB = b.best_score ?? b.score ?? b.wins ?? 0;
           return valB - valA;
        });

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('family_id', profile.family_id);

        const profileMap: Record<string, any> = {};
        if (profilesData) {
          profilesData.forEach(p => {
             profileMap[p.id] = p;
          });
        }

        const enrichedScores = sortedScores.map(s => ({
          ...s,
          profiles: profileMap[s.member_id] || { display_name: "Family Member" }
        }));
        
        setScores(enrichedScores);
      } else {
        setScores([]);
      }
    };

    fetchScores();

    // Real-time sync for leaderboard
    const channel = supabase.channel('arcade_scores_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arcade_scores', filter: `family_id=eq.${profile.family_id}` },
        () => {
          fetchScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile]);

  const grouped = scores.reduce((acc: any, curr: any) => {
    if (!acc[curr.game]) acc[curr.game] = [];
    acc[curr.game].push(curr);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
        <Trophy className="h-6 w-6 text-yellow-500" /> Weekly Leaderboard
      </h2>
      {Object.keys(grouped).length === 0 ? (
        <p className="text-muted-foreground">No scores yet this week! Start playing!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(grouped).map(([game, gameScores]: [string, any]) => (
            <Card key={game} className="rounded-3xl border-none shadow-md overflow-hidden bg-white/50">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg font-bold">{game}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {gameScores.slice(0, 3).map((s: any, i: number) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`font-black text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>#{i + 1}</div>
                      <div className="flex items-center gap-2">
                        <img src={s.profiles?.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${s.member_id}`} className="w-8 h-8 rounded-full bg-white shadow-sm" alt="avatar" />
                        
                        <span className="font-bold text-sm">{s.profiles?.display_name || "Family Member"}</span>
                        {i === 0 && activeTournament?.game_name === game && (
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ml-1 shadow-sm border border-yellow-300">
                            <Trophy className="h-3 w-3" /> Champ
                          </div>
                        )}

                      </div>
                    </div>
                    <div className="font-bold text-primary">
                      {s.best_score ? `${s.best_score} pts` : (s.wins ? `${s.wins} Wins` : 'Played')}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ArcadePage() {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [isMuted, setIsMuted] = React.useState(false);
  
  // Lobby State
  const [onlineUsers, setOnlineUsers] = React.useState<any[]>([]);
  const [lobbyChannel, setLobbyChannel] = React.useState<any>(null);
  const [incomingChallenge, setIncomingChallenge] = React.useState<any>(null);
  const [activeMatch, setActiveMatch] = React.useState<{ id: string, game: string, role: string, opponentName?: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState('leaderboard');
  const [myStatus, setMyStatus] = React.useState('Ready to play!');

  React.useEffect(() => {
    if (!supabase || !profile) return;

    // 1. Join Global Lobby Presence
    const channel = supabase.channel('arcade_lobby');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: any[] = [];
        for (const id in state) {
          users.push(state[id][0]);
        }
        setOnlineUsers(users.filter(u => u.id !== profile.id));
      })
      .on('broadcast', { event: 'challenge' }, (payload) => {
        if (payload.payload.targetId === profile.id) {
          setIncomingChallenge(payload.payload);
        }
      })
      .on('broadcast', { event: 'accept_challenge' }, (payload) => {
        if (payload.payload.targetId === profile.id) {
          setActiveMatch({ 
            id: payload.payload.matchId, 
            game: payload.payload.game, 
            role: 'X',
            opponentName: payload.payload.targetName
          });
          setActiveTab(payload.payload.game);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: profile.id,
            name: profile.first_name,
            avatar: profile.avatar_url,
            status: myStatus,
            online_at: new Date().toISOString(),
          });
        }
      });

    setLobbyChannel(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile, myStatus]);

  const updateStatus = async (newStatus: string) => {
    setMyStatus(newStatus);
    if (lobbyChannel) {
      await lobbyChannel.track({
        id: profile.id,
        name: profile.first_name,
        avatar: profile.avatar_url,
        status: newStatus,
        online_at: new Date().toISOString(),
      });
    }
  };

  const sendChallenge = (targetUser: any, game: string) => {
    if (!lobbyChannel) return;
    lobbyChannel.send({
      type: 'broadcast',
      event: 'challenge',
      payload: {
        targetId: targetUser.id,
        targetName: targetUser.name,
        challengerId: profile?.id,
        challengerName: profile?.first_name || profile?.username || 'Someone',
        game: game,
        matchId: crypto.randomUUID()
      }
    });
    alert(`Challenge sent to ${targetUser.name}!`);
  };

  const acceptChallenge = () => {
    if (!lobbyChannel || !incomingChallenge) return;
    lobbyChannel.send({
      type: 'broadcast',
      event: 'accept_challenge',
      payload: {
        targetId: incomingChallenge.challengerId,
        targetName: profile?.first_name,
        matchId: incomingChallenge.matchId,
        game: incomingChallenge.game
      }
    });
    setActiveMatch({ 
      id: incomingChallenge.matchId, 
      game: incomingChallenge.game, 
      role: 'O',
      opponentName: incomingChallenge.challengerName
    });
    setActiveTab(incomingChallenge.game);
    setIncomingChallenge(null);
  };

  
  React.useEffect(() => {
    setIsMuted(audio.getMuted());
  }, []);

  const pbQuery = React.useMemo(() => {
    if (!supabase || !profile?.id) return null
    return supabase.from("arcade_scores").select("*").eq("member_id", profile.id)
  }, [supabase, profile?.id])
  const { data: pbs } = useCollection(pbQuery)
  const personalBests = React.useMemo(() => {
    const map: Record<string, number> = {}
    if (pbs) pbs.forEach((s: any) => map[s.game] = s.best_score || s.score || 0)
    return map
  }, [pbs])
  
  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    audio.setMuted(newMute);
  };

  const tournamentQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("arcade_tournaments")
      .select("*")
      .eq("family_id", profile.familyId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
  }, [supabase, profile?.familyId])
  const { data: tournaments } = useCollection(tournamentQuery)
  const activeTournament = tournaments?.[0] || null


  const toggleLandscape = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape')
        }
      } else {
        document.exitFullscreen()
      }
    } catch (e) {
      console.warn("Fullscreen/Orientation lock failed:", e)
    }
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-4 max-w-7xl mx-auto pb-20 overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-14 md:pr-0">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-primary uppercase italic">Universe Arcade</h1>
          <p className="text-muted-foreground font-medium text-xs md:text-sm uppercase tracking-widest">25 Games Live for the Hub</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleLandscape}
            className="rounded-xl font-bold border-primary/20 text-primary h-11 px-4 shadow-sm"
          >
            <Maximize className="h-4 w-4 mr-2" /> 
            <span className="hidden sm:inline">Landscape Mode</span>
            <span className="sm:hidden">Rotate</span>
          </Button>
          <Badge className="bg-accent text-white border-none font-bold uppercase px-3 py-1 w-fit text-[9px] md:text-xs tracking-widest hidden md:flex">Premium Fun</Badge>
        </div>
      </header>

      {/* Lobby Challenge UI */}
      <Card className="rounded-[2rem] border-none shadow-md bg-white/50 mb-4">
        <CardHeader className="py-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Online Family Members</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">My Status:</span>
            <input 
              type="text" 
              className="text-xs px-2 py-1 rounded-md border bg-white max-w-[150px]"
              value={myStatus}
              onChange={(e) => setMyStatus(e.target.value)}
              onBlur={(e) => updateStatus(e.target.value)}
              placeholder="What's up?"
            />
          </div>
        </CardHeader>
        {onlineUsers.length > 0 ? (
          <CardContent className="px-4 pb-4 pt-0 flex gap-4 overflow-x-auto">
            {onlineUsers.map(u => (
              <div key={u.id} className="flex flex-col items-center gap-1 min-w-[80px]">
                <img src={u.avatar || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${u.id}`} className="w-12 h-12 rounded-full border-2 border-green-500 shadow-sm" />
                <span className="text-xs font-black truncate w-20 text-center text-slate-800">{u.name || 'Anonymous'}</span>
                {u.status && <span className="text-[10px] font-medium truncate w-24 text-center text-muted-foreground italic px-1">"{u.status}"</span>}
                <select 
                  className="text-[10px] p-1 rounded border bg-white mt-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      sendChallenge(u, e.target.value);
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Challenge</option>
                  <option value="Tic-Tac-Toe">Tic-Tac-Toe</option>
                  <option value="Connect 4">Connect 4</option>
                  <option value="multi_rps">RPS</option>
                  <option value="multi_math">Math Race</option>
                  <option value="multi_react">Reaction</option>
                  <option value="multi_dots">Dots & Boxes</option>
                  <option value="multi_guess">Number Race</option>
                  <option value="multi_word">Word Race</option>
                </select>
              </div>
            ))}
          </CardContent>
        ) : (
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-sm font-bold text-muted-foreground">No one else is online right now. Practice solo!</p>
          </CardContent>
        )}
      </Card>

      {incomingChallenge && (
        <Card className="rounded-[2rem] border-none shadow-md bg-primary text-white mb-4 animate-in slide-in-from-top">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-300 animate-pulse" />
              <CardTitle className="text-sm font-bold uppercase tracking-widest">
                {incomingChallenge.challengerName} challenged you to {
                  incomingChallenge.game === 'multi_rps' ? 'RPS' :
                  incomingChallenge.game === 'multi_math' ? 'Math Race' :
                  incomingChallenge.game === 'multi_react' ? 'Reaction' :
                  incomingChallenge.game === 'multi_dots' ? 'Dots & Boxes' :
                  incomingChallenge.game === 'multi_guess' ? 'Number Race' :
                  incomingChallenge.game === 'multi_word' ? 'Word Race' :
                  incomingChallenge.game
                }!
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={acceptChallenge} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold">Accept</Button>
              <Button size="sm" variant="outline" onClick={() => setIncomingChallenge(null)} className="text-white border-white/20">Decline</Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {activeTournament && (
        <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-r from-yellow-400 to-amber-600 text-white overflow-hidden mb-2">
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><Flame className="h-6 w-6 text-white animate-pulse" /> Weekend Tournament</CardTitle>
              <CardDescription className="text-white/80 font-bold">Play {activeTournament.game_name} to win the Gold Badge!</CardDescription>
            </div>
            <div className="hidden md:flex h-12 w-12 bg-white/20 rounded-xl items-center justify-center">
              <Trophy className="h-6 w-6 text-yellow-100" />
            </div>
          </CardHeader>
        </Card>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent w-full flex flex-wrap h-auto mb-4 justify-center gap-2">
          <TabsTrigger value="leaderboard" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Trophy className="h-4 w-4" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="piano" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Music className="h-4 w-4" /> Piano</TabsTrigger>
          <TabsTrigger value="simon" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Activity className="h-4 w-4" /> Tinashe</TabsTrigger>
          <TabsTrigger value="pop" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Circle className="h-4 w-4" /> Pop</TabsTrigger>
          <TabsTrigger value="rps" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Hand className="h-4 w-4" /> RPS</TabsTrigger>
          <TabsTrigger value="react" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Zap className="h-4 w-4" /> Reaction</TabsTrigger>
          <TabsTrigger value="click" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><MousePointer2 className="h-4 w-4" /> Clicker</TabsTrigger>
          <TabsTrigger value="colors" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Palette className="h-4 w-4" /> Colors</TabsTrigger>
          <TabsTrigger value="dice" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Dices className="h-4 w-4" /> Dice</TabsTrigger>
          <TabsTrigger value="guess" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><HelpCircle className="h-4 w-4" /> Guess</TabsTrigger>
          <TabsTrigger value="slots" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Sparkles className="h-4 w-4" /> Slots</TabsTrigger>
          <TabsTrigger value="words" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Search className="h-4 w-4" /> Words</TabsTrigger>
          <TabsTrigger value="tic" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><X className="h-4 w-4" /> Tic-Tac-Toe <Badge className="bg-primary text-white ml-1 text-[9px] h-4 px-1 hidden md:flex">PVP</Badge></TabsTrigger>
          <TabsTrigger value="memory" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Brain className="h-4 w-4" /> Memory</TabsTrigger>
          <TabsTrigger value="snake" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Gamepad2 className="h-4 w-4" /> Snake</TabsTrigger>
          <TabsTrigger value="math" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Calculator className="h-4 w-4" /> Math</TabsTrigger>
          <TabsTrigger value="french" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Languages className="h-4 w-4" /> French</TabsTrigger>
          <TabsTrigger value="typer" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Keyboard className="h-4 w-4" /> Typer</TabsTrigger>
          <TabsTrigger value="doodle" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><PenTool className="h-4 w-4" /> Doodle</TabsTrigger>
          <TabsTrigger value="whack" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Hammer className="h-4 w-4" /> Whack</TabsTrigger>
          <TabsTrigger value="tetris" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Grid3x3 className="h-4 w-4" /> Tetris</TabsTrigger>
          <TabsTrigger value="flappy" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Cloud className="h-4 w-4" /> Flappy</TabsTrigger>
          <TabsTrigger value="2048" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Grid2x2 className="h-4 w-4" /> 2048</TabsTrigger>
          <TabsTrigger value="minesweeper" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Bomb className="h-4 w-4" /> Minesweeper</TabsTrigger>
          <TabsTrigger value="connect4" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Layout className="h-4 w-4" /> Connect 4 <Badge className="bg-primary text-white ml-1 text-[9px] h-4 px-1 hidden md:flex">PVP</Badge></TabsTrigger>
          <TabsTrigger value="wordguess" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Type className="h-4 w-4" /> Word Guess</TabsTrigger>
                    <TabsTrigger value="stacker" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><ArrowUp className="h-4 w-4" /> Stacker</TabsTrigger>
          <TabsTrigger value="judge" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Mic2 className="h-4 w-4 text-yellow-500" /> Judge</TabsTrigger>
          <TabsTrigger value="multi_rps" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Hand className="h-4 w-4" /> Multi RPS <Badge className="bg-primary text-white ml-1 text-[9px] h-4 px-1 hidden md:flex">PVP</Badge></TabsTrigger>
          <TabsTrigger value="multi_math" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Calculator className="h-4 w-4" /> Math Race <Badge className="bg-primary text-white ml-1 text-[9px] h-4 px-1 hidden md:flex">PVP</Badge></TabsTrigger>
          <TabsTrigger value="multi_react" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Zap className="h-4 w-4" /> Reaction <Badge className="bg-primary text-white ml-1 text-[9px] h-4 px-1 hidden md:flex">PVP</Badge></TabsTrigger>
          <TabsTrigger value="multi_dots" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Grid3x3 className="h-4 w-4" /> Dots <Badge className="bg-primary text-white ml-1 text-[9px] h-4 px-1 hidden md:flex">PVP</Badge></TabsTrigger>
          <TabsTrigger value="multi_guess" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><HelpCircle className="h-4 w-4" /> Number Race <Badge className="bg-primary text-white ml-1 text-[9px] h-4 px-1 hidden md:flex">PVP</Badge></TabsTrigger>
          <TabsTrigger value="multi_word" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg bg-white/50 data-[state=active]:bg-white"><Search className="h-4 w-4" /> Word Race <Badge className="bg-primary text-white ml-1 text-[9px] h-4 px-1 hidden md:flex">PVP</Badge></TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-col items-center justify-center">
          <TabsContent value="leaderboard"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl min-h-[60vh]"><Leaderboard /></Card></TabsContent>
          <TabsContent value="piano"><Card className="rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-white shadow-xl"><PianoGame /></Card></TabsContent>
          <TabsContent value="simon"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><TinashePattern /></Card></TabsContent>
          <TabsContent value="pop"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><BalloonPop /></Card></TabsContent>
          <TabsContent value="rps"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><RockPaperScissors /></Card></TabsContent>
          <TabsContent value="react"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><ReactionTest /></Card></TabsContent>
          <TabsContent value="click"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><SpeedClicker /></Card></TabsContent>
          <TabsContent value="colors"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><ColorFinder /></Card></TabsContent>
          <TabsContent value="dice"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><DiceRoller /></Card></TabsContent>
          <TabsContent value="guess"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><NumberGuess /></Card></TabsContent>
          <TabsContent value="slots"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><SlotMachine /></Card></TabsContent>
          <TabsContent value="words"><Card className="rounded-[2.5rem] md:rounded-[3rem] p-4 bg-white shadow-xl"><WordSearchGame /></Card></TabsContent>
          <TabsContent value="tic"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><TicTacToe matchId={activeMatch?.game === "Tic-Tac-Toe" ? activeMatch.id : undefined} role={activeMatch?.role as "X" | "O"} onLeave={() => setActiveMatch(null)} /></Card></TabsContent>
          <TabsContent value="memory"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><MemoryMatch /></Card></TabsContent>
          <TabsContent value="snake"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><SnakeGame personalBest={personalBests["Snake"] || 0} /></Card></TabsContent>
          <TabsContent value="math"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><MathMaster /></Card></TabsContent>
          <TabsContent value="french"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><FrenchMaster /></Card></TabsContent>
          <TabsContent value="typer"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><TypingGame /></Card></TabsContent>
          <TabsContent value="doodle"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><DoodleBoard /></Card></TabsContent>
          <TabsContent value="whack"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><WhackATask /></Card></TabsContent>
          <TabsContent value="tetris"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><TetrisGame personalBest={personalBests["Tetris"] || 0} /></Card></TabsContent>
          <TabsContent value="flappy"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><FlappyBlock personalBest={personalBests["Flappy"] || 0} /></Card></TabsContent>
          <TabsContent value="2048"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><Game2048 personalBest={personalBests["2048"] || 0} /></Card></TabsContent>
          <TabsContent value="minesweeper"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><Minesweeper personalBest={personalBests["Minesweeper"] || 0} /></Card></TabsContent>
          <TabsContent value="connect4"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><ConnectFour personalBest={personalBests["Connect 4"] || 0} /></Card></TabsContent>
          <TabsContent value="wordguess"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><WordGuess /></Card></TabsContent>
                    <TabsContent value="stacker"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><TowerStacker personalBest={personalBests["Stacker"] || 0} /></Card></TabsContent>
          <TabsContent value="judge"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-slate-950 shadow-xl overflow-hidden border-0"><JudgingPanel /></Card></TabsContent>
          <TabsContent value="multi_rps"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><RockPaperScissorsMultiplayer matchId={activeMatch?.game === "multi_rps" ? activeMatch.id : undefined} role={activeMatch?.role as "X" | "O"} opponentName={activeMatch?.opponentName} onLeave={() => setActiveMatch(null)} /></Card></TabsContent>
          <TabsContent value="multi_math"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><MathRaceMultiplayer matchId={activeMatch?.game === "multi_math" ? activeMatch.id : undefined} role={activeMatch?.role as "X" | "O"} opponentName={activeMatch?.opponentName} onLeave={() => setActiveMatch(null)} /></Card></TabsContent>
          <TabsContent value="multi_react"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><ReactionRaceMultiplayer matchId={activeMatch?.game === "multi_react" ? activeMatch.id : undefined} role={activeMatch?.role as "X" | "O"} opponentName={activeMatch?.opponentName} onLeave={() => setActiveMatch(null)} /></Card></TabsContent>
          <TabsContent value="multi_dots"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><DotsAndBoxesMultiplayer matchId={activeMatch?.game === "multi_dots" ? activeMatch.id : undefined} role={activeMatch?.role as "X" | "O"} opponentName={activeMatch?.opponentName} onLeave={() => setActiveMatch(null)} /></Card></TabsContent>
          <TabsContent value="multi_guess"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><NumberGuessMultiplayer matchId={activeMatch?.game === "multi_guess" ? activeMatch.id : undefined} role={activeMatch?.role as "X" | "O"} opponentName={activeMatch?.opponentName} onLeave={() => setActiveMatch(null)} /></Card></TabsContent>
          <TabsContent value="multi_word"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl overflow-hidden border-0"><WordRaceMultiplayer matchId={activeMatch?.game === "multi_word" ? activeMatch.id : undefined} role={activeMatch?.role as "X" | "O"} opponentName={activeMatch?.opponentName} onLeave={() => setActiveMatch(null)} /></Card></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
