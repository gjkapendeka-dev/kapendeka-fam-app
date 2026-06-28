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
  Maximize
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSupabase, useUser } from "@/supabase"
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

function PianoGame() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [activeNote, setActiveNote] = React.useState<string | null>(null)
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
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-2 overflow-x-hidden">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Kids' Magic Piano</h3>
        <p className="text-muted-foreground font-medium text-sm">Tap the keys to make music!</p>
      </div>
      <div className="flex gap-1 p-2 md:p-4 bg-muted/30 rounded-3xl shadow-inner overflow-x-auto w-full max-w-2xl justify-start md:justify-center no-scrollbar">
        {PIANO_KEYS.map((k) => (
          <button
            key={k.note}
            onClick={() => playNote(k.freq, k.note)}
            className={`
              relative w-12 md:w-16 h-40 md:h-64 rounded-xl transition-all active:scale-95 active:bg-primary/10 border-b-8 border-muted shadow-lg shrink-0
              ${activeNote === k.note ? "bg-primary/20 -translate-y-2 border-b-0" : "bg-white"}
            `}
          >
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-black text-[10px] md:text-sm text-muted-foreground/50">{k.text}</span>
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 md:w-3 md:h-3 rounded-full ${activeNote === k.note ? 'bg-primary' : 'bg-muted'}`} />
          </button>
        ))}
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

// --- 3. TIC TAC TOE ---
function TicTacToe() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [board, setBoard] = React.useState(Array(9).fill(null))
  const [xIsNext, setXIsNext] = React.useState(true)

  const calculateWinner = (squares: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ]
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  const winner = calculateWinner(board)
  const isDraw = !winner && board.every(s => s !== null)

  const handleClick = (i: number) => {
    if (board[i] || winner) return
    const newBoard = board.slice()
    newBoard[i] = xIsNext ? 'X' : 'O'
    setBoard(newBoard)
    setXIsNext(!xIsNext)
  }
  
  const resetLocal = () => {
    setBoard(Array(9).fill(null))
    setXIsNext(true)
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4 relative">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Tic-Tac-Toe</h3>
        <p className="text-muted-foreground font-medium text-sm mt-2">
          {winner ? `Winner: ${winner}!` : isDraw ? "It's a Draw!" : `Next Player: ${xIsNext ? 'X' : 'O'}`}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 bg-muted/20 p-4 rounded-[2rem] shadow-inner">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm active:scale-95 transition-all disabled:opacity-80"
          >
            {cell === 'X' && <X className="h-10 w-10 text-primary" />}
            {cell === 'O' && <Circle className="h-10 w-10 text-accent" />}
          </button>
        ))}
      </div>
      <Button onClick={resetLocal} variant="outline" className="h-12 px-4 rounded-full font-bold border-primary text-primary">
        Reset Game
      </Button>
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
function SnakeGame() {
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
      setGameOver(true); saveGameScore(supabase, profile, "Simon Says", sequence.length - 1);; saveGameScore(supabase, profile, "Snake", score);
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
  }, [snake, dir, food, gameOver])

  React.useEffect(() => {
    const interval = setInterval(moveSnake, 180)
    return () => clearInterval(interval)
  }, [moveSnake])

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <div className="text-center">
        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Snake Score: {score}</p>
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
      <div className="grid grid-cols-3 gap-3">
        <div />
        <Button variant="secondary" className="h-12 w-12 rounded-xl" onClick={() => dir.y !== 1 && setDir({ x: 0, y: -1 })}><ArrowUp className="h-5 w-5" /></Button>
        <div />
        <Button variant="secondary" className="h-12 w-12 rounded-xl" onClick={() => dir.x !== 1 && setDir({ x: -1, y: 0 })}><ArrowLeft className="h-5 w-5" /></Button>
        <Button variant="secondary" className="h-12 w-12 rounded-xl" onClick={() => dir.y !== -1 && setDir({ x: 0, y: 1 })}><ArrowDown className="h-5 w-5" /></Button>
        <Button variant="secondary" className="h-12 w-12 rounded-xl" onClick={() => dir.x !== -1 && setDir({ x: 1, y: 0 })}><ArrowRight className="h-5 w-5" /></Button>
      </div>
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
    generate()
  }, [generate])

  const check = () => {
    if (parseInt(guess) === q.ans) {
      setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Piano", ns); return ns; })
      setFeedback("Correct! ✨")
      setTimeout(generate, 1000)
    } else {
      setFeedback("Try again! ❌")
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <h3 className="text-2xl font-bold text-primary">Math Master</h3>
      <div className="bg-primary/5 p-4 md:p-5 rounded-[2.5rem] md:rounded-[3rem] text-center space-y-4 w-full max-w-sm border-2 border-primary/10 shadow-inner">
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

// --- 7. DOODLE BOARD ---
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
      setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Math Master", ns); return ns; })
      const next = [...moles]; next[i] = false; setMoles(next)
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
        <Button className="rounded-xl px-4 h-12 font-bold bg-accent" onClick={() => setActive(!active)}>{active ? 'Stop' : 'Start'}</Button>
      </div>
    </div>
  )
}

// --- 9. TETRIS ---
function TetrisGame() {
  const [grid] = React.useState(Array(20).fill(null).map(() => Array(10).fill(0)))
  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <h3 className="text-2xl font-bold text-primary">Tetris (Coming Soon)</h3>
      <div className="relative w-[180px] md:w-[200px] aspect-[1/2] bg-slate-900 rounded-[2rem] border-4 border-slate-800 grid grid-cols-10 grid-rows-20 gap-px p-px shadow-2xl">
        {grid.map((row, ri) => row.map((_, ci) => <div key={`${ri}-${ci}`} className="bg-slate-800/30 rounded-sm" />))}
        <div className="absolute inset-0 flex items-center justify-center">
            <Badge className="bg-white/10 text-white border-none font-black text-[9px] uppercase tracking-widest">Level 1 Incoming</Badge>
        </div>
      </div>
    </div>
  )
}

// --- 10. SIMON SAYS ---
function SimonSays() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [sequence, setSequence] = React.useState<number[]>([])
  const [userSequence, setUserSequence] = React.useState<number[]>([])
  const [activeColor, setActiveColor] = React.useState<number | null>(null)
  const [playing, setPlaying] = React.useState(false)
  const colors = ["bg-rose-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500"]

  const nextRound = (currentSeq: number[]) => {
    const next = [...currentSeq, Math.floor(Math.random() * 4)]
    setSequence(next)
    playSequence(next)
  }

  const playSequence = async (seq: number[]) => {
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(() => { setActiveColor(seq[i]); resolve(null) }, 600))
      await new Promise(resolve => setTimeout(() => { setActiveColor(null); resolve(null) }, 200))
    }
  }

  const handlePress = (i: number) => {
    if (!playing) return
    setActiveColor(i)
    setTimeout(() => setActiveColor(null), 200)
    const nextUserSeq = [...userSequence, i]
    if (nextUserSeq[nextUserSeq.length - 1] !== sequence[nextUserSeq.length - 1]) {
      alert("Oops! Game Over")
      setPlaying(false); setSequence([]); setUserSequence([])
      return
    }
    if (nextUserSeq.length === sequence.length) {
      setUserSequence([])
      setTimeout(() => nextRound(sequence), 1000)
    } else {
      setUserSequence(nextUserSeq)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4 px-4">
      <h3 className="text-2xl font-bold text-primary">Simon Pattern</h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {colors.map((c, i) => (
          <button key={i} onClick={() => handlePress(i)} className={cn("w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] shadow-lg transition-all active:scale-90", c, activeColor === i ? "scale-110 brightness-150" : "opacity-80")} />
        ))}
      </div>
      <Button className="h-12 px-4 rounded-xl font-bold" onClick={() => { setSequence([]); setUserSequence([]); setPlaying(true); nextRound([]) }}>{playing ? "Restart" : "Start Game"}</Button>
    </div>
  )
}

// --- 11. BALLOON POP ---
function BalloonPop() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [balloons, setBalloons] = React.useState<{id: number, x: number, y: number, color: string}[]>([])
  const [score, setScore] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBalloons(prev => [...prev, { id: Date.now(), x: Math.random() * 80 + 10, y: 100, color: ["bg-rose-400", "bg-blue-400", "bg-emerald-400", "bg-amber-400"][Math.floor(Math.random() * 4)] }])
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    const move = setInterval(() => {
      setBalloons(prev => prev.map(b => ({ ...b, y: b.y - 2 })).filter(b => b.y > -10))
    }, 50)
    return () => clearInterval(move)
  }, [])

  return (
    <div className="relative w-full h-[380px] sm:h-[450px] bg-sky-100 rounded-[2.5rem] overflow-hidden border-4 border-sky-200">
      <div className="absolute top-6 left-6 z-10 font-black text-primary text-xl md:text-2xl tracking-tighter">Pop Score: {score}</div>
      {balloons.map(b => (
        <button key={b.id} onClick={() => { setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Color Finder", ns); return ns; }); setBalloons(prev => prev.filter(p => p.id !== b.id)) }} className={cn("absolute w-12 h-16 sm:w-14 sm:h-18 rounded-full shadow-lg transition-transform active:scale-150 active:opacity-0", b.color)} style={{ left: `${b.x}%`, top: `${b.y}%` }} />
      ))}
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
  const moves = ["Rock", "Paper", "Scissors"]

  const play = (move: string) => {
    const aiMove = moves[Math.floor(Math.random() * 3)]
    setUser(move); setAi(aiMove)
    if (move === aiMove) setResult("It's a Tie!")
    else if ((move === "Rock" && aiMove === "Scissors") || (move === "Paper" && aiMove === "Rock") || (move === "Scissors" && aiMove === "Paper")) setResult("You Win! 🎉")
    else setResult("AI Wins! 🤖")
  }

  return (
    <div className="flex flex-col items-center space-y-10 py-5 px-4">
      <h3 className="text-2xl font-bold text-primary">Rock Paper Scissors</h3>
      <div className="flex gap-2 sm:gap-4 flex-wrap justify-center">
        {moves.map(m => <Button key={m} onClick={() => play(m)} className="rounded-2xl h-16 w-24 sm:w-28 font-black text-base shadow-lg shadow-primary/5">{m}</Button>)}
      </div>
      {user && (
        <div className="text-center space-y-4 animate-in zoom-in slide-in-from-bottom-2 duration-300">
          <div className="text-sm md:text-lg font-bold text-muted-foreground uppercase tracking-widest">You <span className="text-primary">{user}</span> vs AI <span className="text-accent">{ai}</span></div>
          <div className="text-4xl md:text-5xl font-black text-primary uppercase italic tracking-tighter">{result}</div>
        </div>
      )}
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
      setTime(Date.now() - startTime); setState("result"); saveGameScore(supabase, profile, "Reaction", Date.now() - startTime);
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
    } else if (timeLeft === 0) {
      setActive(false)
    }
  }, [active, timeLeft])

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
          <button key={i} onClick={() => { if (i === target) { setScore(s => { const ns = s + 1; saveGameScore(supabase, profile, "Typing", ns); return ns; }); generate() } else { setScore(0); generate() } }} className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="text-lg font-black uppercase text-primary tracking-widest">Score: {score}</div>
    </div>
  )
}

// --- 16. DICE ROLLER ---
function DiceRoller() {
  const supabase = useSupabase();
  const { profile } = useUser();

  const [val, setVal] = React.useState(1)
  const [rolling, setRolling] = React.useState(false)

  const roll = () => {
    setRolling(true)
    let count = 0
    const interval = setInterval(() => {
      setVal(Math.floor(Math.random() * 6) + 1)
      count++
      if (count > 10) { clearInterval(interval); setRolling(false) }
    }, 50)
  }

  return (
    <div className="flex flex-col items-center space-y-10 py-5 px-4">
      <div className={cn("w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-6xl md:text-7xl font-black border-4 border-muted/20 text-primary", rolling && "animate-bounce")}>
        {val}
      </div>
      <Button onClick={roll} disabled={rolling} className="rounded-2xl h-16 w-48 text-xl font-black shadow-xl shadow-primary/10">ROLL DICE</Button>
    </div>
  )
}

// --- 17. NUMBER GUESS ---
function NumberGuess() {
  const supabase = useSupabase();
  const { profile } = useUser();

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

  const words = ["HUB", "FAMILY", "JOY", "STAR", "BRAVE", "KIND", "HAPPY", " Kapendeka"]
  const [word, setWord] = React.useState(words[0])
  const [input, setInput] = React.useState("")
  const [score, setScore] = React.useState(0)

  const handleChange = (val: string) => {
    if (val.toUpperCase().trim() === word.toUpperCase().trim()) {
      setScore(s => s + 1); setInput(""); setWord(words[Math.floor(Math.random() * words.length)])
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

// --- MAIN PAGE ---

function Leaderboard() {
  const supabase = useSupabase();
  const { profile } = useUser();
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
  const [scores, setScores] = React.useState([]);

  React.useEffect(() => {
    if (!supabase || !profile?.family_id) return;
    
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

    const fetchScores = async () => {
      const { data } = await supabase
        .from('arcade_scores')
        .select('*, profiles!arcade_scores_member_id_fkey(display_name, avatar_url, id)')
        .eq('family_id', profile.family_id)
        .gte('updated_at', startOfWeek)
        .order('best_score', { ascending: false });

      if (data) setScores(data);
    };

    fetchScores();
  }, [supabase, profile]);

  // Group by game
  const grouped = scores.reduce((acc, curr) => {
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
          {Object.entries(grouped).map(([game, gameScores]) => (
            <Card key={game} className="rounded-3xl border-none shadow-md overflow-hidden bg-white/50">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg font-bold">{game}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {gameScores.slice(0, 3).map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`font-black text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>#{i + 1}</div>
                      <div className="flex items-center gap-2">
                        <img src={s.profiles?.avatar_url || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${s.profiles?.id}`} className="w-8 h-8 rounded-full bg-white shadow-sm" alt="avatar" />
                        
                        <span className="font-bold text-sm">{s.profiles?.display_name}</span>
                        {i === 0 && activeTournament?.game_name === game && (
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ml-1 shadow-sm border border-yellow-300">
                            <Crown className="h-3 w-3" /> Champ
                          </div>
                        )}

                      </div>
                    </div>
                    <div className="font-bold text-primary">
                      {s.best_score ? `${s.best_score} pts` : (s.wins ? 'Won' : 'Played')}
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
          <p className="text-muted-foreground font-medium text-xs md:text-sm uppercase tracking-widest">19 Games Live for the Hub</p>
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
      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl w-full flex flex-nowrap overflow-x-auto h-auto mb-4 justify-start no-scrollbar touch-pan-x">
          <TabsTrigger value="leaderboard" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Trophy className="h-4 w-4" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="piano" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Music className="h-4 w-4" /> Piano</TabsTrigger>
          <TabsTrigger value="simon" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Activity className="h-4 w-4" /> Simon</TabsTrigger>
          <TabsTrigger value="pop" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Circle className="h-4 w-4" /> Pop</TabsTrigger>
          <TabsTrigger value="rps" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Hand className="h-4 w-4" /> RPS</TabsTrigger>
          <TabsTrigger value="react" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Zap className="h-4 w-4" /> Reaction</TabsTrigger>
          <TabsTrigger value="click" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><MousePointer2 className="h-4 w-4" /> Clicker</TabsTrigger>
          <TabsTrigger value="colors" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Palette className="h-4 w-4" /> Colors</TabsTrigger>
          <TabsTrigger value="dice" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Dices className="h-4 w-4" /> Dice</TabsTrigger>
          <TabsTrigger value="guess" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><HelpCircle className="h-4 w-4" /> Guess</TabsTrigger>
          <TabsTrigger value="slots" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Sparkles className="h-4 w-4" /> Slots</TabsTrigger>
          <TabsTrigger value="words" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Search className="h-4 w-4" /> Words</TabsTrigger>
          <TabsTrigger value="tic" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><X className="h-4 w-4" /> Tic-Tac-Toe</TabsTrigger>
          <TabsTrigger value="memory" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Brain className="h-4 w-4" /> Memory</TabsTrigger>
          <TabsTrigger value="snake" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Gamepad2 className="h-4 w-4" /> Snake</TabsTrigger>
          <TabsTrigger value="math" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Calculator className="h-4 w-4" /> Math</TabsTrigger>
          <TabsTrigger value="typer" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Keyboard className="h-4 w-4" /> Typer</TabsTrigger>
          <TabsTrigger value="doodle" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><PenTool className="h-4 w-4" /> Doodle</TabsTrigger>
          <TabsTrigger value="whack" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Hammer className="h-4 w-4" /> Whack</TabsTrigger>
          <TabsTrigger value="tetris" className="rounded-xl font-bold py-2 px-4 gap-2 shrink-0 data-[state=active]:shadow-lg"><Grid3x3 className="h-4 w-4" /> Tetris</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="leaderboard"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl min-h-[60vh]"><Leaderboard /></Card></TabsContent>
          <TabsContent value="piano"><Card className="rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-white shadow-xl"><PianoGame /></Card></TabsContent>
          <TabsContent value="simon"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><SimonSays /></Card></TabsContent>
          <TabsContent value="pop"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><BalloonPop /></Card></TabsContent>
          <TabsContent value="rps"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><RockPaperScissors /></Card></TabsContent>
          <TabsContent value="react"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><ReactionTest /></Card></TabsContent>
          <TabsContent value="click"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><SpeedClicker /></Card></TabsContent>
          <TabsContent value="colors"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><ColorFinder /></Card></TabsContent>
          <TabsContent value="dice"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><DiceRoller /></Card></TabsContent>
          <TabsContent value="guess"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><NumberGuess /></Card></TabsContent>
          <TabsContent value="slots"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><SlotMachine /></Card></TabsContent>
          <TabsContent value="words"><Card className="rounded-[2.5rem] md:rounded-[3rem] p-4 bg-white shadow-xl"><WordSearchGame /></Card></TabsContent>
          <TabsContent value="tic"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><TicTacToe /></Card></TabsContent>
          <TabsContent value="memory"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><MemoryMatch /></Card></TabsContent>
          <TabsContent value="snake"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><SnakeGame /></Card></TabsContent>
          <TabsContent value="math"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><MathMaster /></Card></TabsContent>
          <TabsContent value="typer"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><TypingGame /></Card></TabsContent>
          <TabsContent value="doodle"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><DoodleBoard /></Card></TabsContent>
          <TabsContent value="whack"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><WhackATask /></Card></TabsContent>
          <TabsContent value="tetris"><Card className="rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl"><TetrisGame /></Card></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
