
"use client"

import * as React from "react"
import { 
  Gamepad, 
  Music, 
  Search, 
  Grid3X3, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  ArrowDown, 
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
  Heart
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Kids' Magic Piano</h3>
        <p className="text-muted-foreground font-medium">Tap the keys to make music!</p>
      </div>
      <div className="flex gap-1 md:gap-2 p-4 bg-muted/30 rounded-[2rem] shadow-inner overflow-x-auto w-full max-w-2xl justify-center">
        {PIANO_KEYS.map((k) => (
          <button
            key={k.note}
            onClick={() => playNote(k.freq, k.note)}
            className={`
              relative w-12 md:w-16 h-40 md:h-64 rounded-xl transition-all active:scale-95 active:bg-primary/10 border-b-8 border-muted shadow-lg
              ${activeNote === k.note ? "bg-primary/20 -translate-y-2 border-b-0" : "bg-white"}
            `}
          >
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-black text-xs md:text-sm text-muted-foreground/50">{k.text}</span>
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${activeNote === k.note ? 'bg-primary' : 'bg-muted'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

// --- 2. WORD SEARCH GAME ---
function WordSearchGame() {
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
    <div className="flex flex-col lg:flex-row gap-8 py-8 items-start">
      <Card className="w-full lg:w-80 rounded-3xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            Word List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="NEW WORD" 
              value={newWord} 
              onChange={(e) => setNewWord(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addWord()}
            />
            <Button size="icon" onClick={addWord}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map(w => (
              <Badge key={w} className="bg-primary/10 text-primary border-none font-bold uppercase">
                {w}
              </Badge>
            ))}
          </div>
          <Button variant="outline" className="w-full rounded-xl font-bold" onClick={generateGrid}>
            <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
          </Button>
        </CardContent>
      </Card>

      <div className="flex-1 flex justify-center">
        <div className="grid grid-cols-10 gap-1 p-2 bg-muted/20 rounded-2xl border border-muted/50">
          {grid.map((row, ri) => row.map((char, ci) => (
            <div 
              key={`${ri}-${ci}`} 
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white rounded-lg font-black text-sm md:text-lg text-primary shadow-sm hover:bg-primary/5 cursor-pointer transition-colors"
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
    if (winner || board[i]) return
    const newBoard = board.slice()
    newBoard[i] = xIsNext ? 'X' : 'O'
    setBoard(newBoard)
    setXIsNext(!xIsNext)
  }

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Tic-Tac-Toe</h3>
        <p className="text-muted-foreground font-medium">
          {winner ? `Winner: ${winner}!` : isDraw ? "It's a Draw!" : `Next Player: ${xIsNext ? 'X' : 'O'}`}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 bg-muted/20 p-4 rounded-3xl shadow-inner">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm active:scale-95 transition-all"
          >
            {cell === 'X' && <X className="h-10 w-10 text-primary" />}
            {cell === 'O' && <Circle className="h-10 w-10 text-accent" />}
          </button>
        ))}
      </div>
      <Button onClick={() => setBoard(Array(9).fill(null))} variant="outline" className="rounded-xl font-bold">
        <RefreshCw className="h-4 w-4 mr-2" /> Reset Game
      </Button>
    </div>
  )
}

// --- 4. MEMORY MATCH ---
const MEMORY_ICONS = [Heart, Star, Sun, Moon, Cloud, Zap, Flame, Smile]

function MemoryMatch() {
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
    <div className="flex flex-col items-center space-y-8 py-8 px-4">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Brain Boost Memory</h3>
        <p className="text-muted-foreground font-medium">Find all matching pairs!</p>
      </div>
      <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-md w-full">
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || solved.includes(i)
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={cn(
                "aspect-square rounded-2xl flex items-center justify-center transition-all duration-500 preserve-3d shadow-sm",
                isFlipped ? "bg-white rotate-y-180" : "bg-primary text-white"
              )}
            >
              {isFlipped ? (
                <card.Icon className="h-8 w-8 text-primary animate-in zoom-in" />
              ) : (
                <Shapes className="h-6 w-6 opacity-20" />
              )}
            </button>
          )
        })}
      </div>
      <Button onClick={initialize} variant="outline" className="rounded-xl font-bold">
        <RefreshCw className="h-4 w-4 mr-2" /> New Game
      </Button>
    </div>
  )
}

// --- 5. SNAKE GAME ---
function SnakeGame() {
  const [snake, setSnake] = React.useState([{ x: 10, y: 10 }])
  const [food, setFood] = React.useState({ x: 5, y: 5 })
  const [dir, setDir] = React.useState({ x: 0, y: -1 })
  const [gameOver, setGameOver] = React.useState(false)
  const [score, setScore] = React.useState(0)
  const gridSize = 20

  const moveSnake = React.useCallback(() => {
    if (gameOver) return

    const newHead = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

    // Hit walls or self
    if (
      newHead.x < 0 || newHead.x >= gridSize || 
      newHead.y < 0 || newHead.y >= gridSize ||
      snake.some(s => s.x === newHead.x && s.y === newHead.y)
    ) {
      setGameOver(true)
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
    const interval = setInterval(moveSnake, 150)
    return () => clearInterval(interval)
  }, [moveSnake])

  const handleKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': if (dir.y !== 1) setDir({ x: 0, y: -1 }); break
      case 'ArrowDown': if (dir.y !== -1) setDir({ x: 0, y: 1 }); break
      case 'ArrowLeft': if (dir.x !== 1) setDir({ x: -1, y: 0 }); break
      case 'ArrowRight': if (dir.x !== -1) setDir({ x: 1, y: 0 }); break
    }
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-8" onKeyDown={handleKey} tabIndex={0}>
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">Points</p>
          <p className="text-3xl font-black text-primary">{score}</p>
        </div>
      </div>
      <div className="relative w-full max-w-[300px] aspect-square bg-slate-900 rounded-2xl border-4 border-slate-800 grid grid-cols-20 grid-rows-20 overflow-hidden">
        {snake.map((s, i) => (
          <div key={i} className="bg-emerald-400 rounded-sm" style={{ gridColumnStart: s.x + 1, gridRowStart: s.y + 1 }} />
        ))}
        <div className="bg-rose-500 rounded-full animate-pulse" style={{ gridColumnStart: food.x + 1, gridRowStart: food.y + 1 }} />
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Trophy className="h-12 w-12 text-yellow-500" />
            <h4 className="text-2xl font-bold text-white uppercase tracking-widest">Game Over</h4>
            <Button onClick={() => { setSnake([{ x: 10, y: 10 }]); setGameOver(false); setScore(0); }} className="bg-primary text-white rounded-xl font-bold">Try Again</Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div />
        <Button variant="secondary" size="icon" onClick={() => dir.y !== 1 && setDir({ x: 0, y: -1 })} className="rounded-xl"><ArrowUp className="h-5 w-5" /></Button>
        <div />
        <Button variant="secondary" size="icon" onClick={() => dir.x !== 1 && setDir({ x: -1, y: 0 })} className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        <Button variant="secondary" size="icon" onClick={() => dir.y !== -1 && setDir({ x: 0, y: 1 })} className="rounded-xl"><ArrowDown className="h-5 w-5" /></Button>
        <Button variant="secondary" size="icon" onClick={() => dir.x !== -1 && setDir({ x: 1, y: 0 })} className="rounded-xl"><ArrowRight className="h-5 w-5" /></Button>
      </div>
    </div>
  )
}

// --- 6. MATH MASTER ---
function MathMaster() {
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
      setScore(s => s + 1)
      setFeedback("Correct! ✨")
      setTimeout(generate, 1000)
    } else {
      setFeedback("Try again! ❌")
    }
  }

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Math Master</h3>
        <p className="text-muted-foreground font-medium">Test your brain speed!</p>
      </div>
      <div className="bg-primary/5 p-8 rounded-[3rem] text-center space-y-6 w-full max-w-sm border-2 border-primary/10">
        <div className="text-5xl font-black text-primary flex items-center justify-center gap-4">
          <span>{q.n1}</span>
          <span className="text-accent">{q.op === '*' ? '×' : q.op}</span>
          <span>{q.n2}</span>
          <span className="text-accent">=</span>
          <span className="text-muted-foreground/30">?</span>
        </div>
        <div className="flex gap-2">
          <Input 
            className="h-14 text-center text-2xl font-bold rounded-2xl" 
            placeholder="?" 
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
          />
          <Button className="h-14 px-6 rounded-2xl bg-accent" onClick={check}>GO</Button>
        </div>
        {feedback && <div className="font-bold text-lg animate-bounce">{feedback}</div>}
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Score: {score}</div>
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
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    
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
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Doodle Board</h3>
        <p className="text-muted-foreground font-medium">Draw something for the family universe!</p>
      </div>
      <div className="relative w-full max-w-2xl aspect-video bg-white rounded-3xl border-4 border-muted/50 shadow-inner overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl">
        <div className="flex gap-2">
          {["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"].map(c => (
            <button 
              key={c} 
              onClick={() => setColor(c)}
              className={cn("h-8 w-8 rounded-full border-2 border-white shadow-sm", color === c ? "scale-125 border-primary" : "opacity-70")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={clear} className="rounded-xl"><Eraser className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

// --- 8. WHACK-A-TASK ---
function WhackATask() {
  const [moles, setMoles] = React.useState(Array(9).fill(false))
  const [score, setScore] = React.useState(0)
  const [active, setActive] = React.useState(false)

  const whack = (i: number) => {
    if (moles[i]) {
      setScore(s => s + 1)
      const next = [...moles]
      next[i] = false
      setMoles(next)
    }
  }

  React.useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      const next = Array(9).fill(false)
      const random = Math.floor(Math.random() * 9)
      next[random] = true
      setMoles(next)
    }, 800)
    return () => clearInterval(interval)
  }, [active])

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Whack-a-Task!</h3>
        <p className="text-muted-foreground font-medium">Whack the chores as they pop up!</p>
      </div>
      <div className="grid grid-cols-3 gap-4 bg-amber-100 p-6 rounded-[2.5rem] shadow-inner border-b-8 border-amber-200">
        {moles.map((isUp, i) => (
          <div key={i} className="relative w-20 h-20 md:w-24 md:h-24 bg-amber-900/20 rounded-full overflow-hidden">
            <button
              onClick={() => whack(i)}
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-200 translate-y-full",
                isUp ? "translate-y-0" : "translate-y-full"
              )}
            >
              <div className="bg-primary p-4 rounded-2xl shadow-lg border-b-4 border-black/20">
                <Smile className="h-10 w-10 text-white" />
              </div>
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <div className="text-2xl font-black text-primary">Score: {score}</div>
        <Button onClick={() => setActive(!active)} className="rounded-xl font-bold">
          {active ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {active ? 'Stop Game' : 'Start Game'}
        </Button>
      </div>
    </div>
  )
}

// --- TETRIS (Minimal Implementation) ---
function TetrisGame() {
  const [grid] = React.useState(Array(20).fill(null).map(() => Array(10).fill(0)))
  const [score] = React.useState(0)

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">Score</p>
          <p className="text-3xl font-black text-primary">{score}</p>
        </div>
      </div>
      <div className="relative w-full max-w-[300px] aspect-[1/2] bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden grid grid-cols-10 gap-px p-px">
        {grid.map((row, ri) => row.map((cell, ci) => (
          <div key={`${ri}-${ci}`} className={`w-full h-full rounded-sm ${cell ? 'bg-primary' : 'bg-slate-800/50'}`} />
        )))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div />
        <Button variant="secondary" className="h-14 w-14 rounded-2xl"><RotateCw className="h-6 w-6" /></Button>
        <div />
        <Button variant="secondary" className="h-14 w-14 rounded-2xl"><ArrowLeft className="h-6 w-6" /></Button>
        <Button variant="secondary" className="h-14 w-14 rounded-2xl"><ArrowDown className="h-6 w-6" /></Button>
        <Button variant="secondary" className="h-14 w-14 rounded-2xl"><ArrowRight className="h-6 w-6" /></Button>
      </div>
    </div>
  )
}

// --- MAIN PAGE ---
export default function ArcadePage() {
  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Universe Arcade</h1>
          <p className="text-muted-foreground font-medium">Fun and learning for the Kapendeka Universe</p>
        </div>
        <Badge className="bg-accent text-white border-none font-bold uppercase px-3 py-1 w-fit">9 Games Live</Badge>
      </header>

      <Tabs defaultValue="piano" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl w-full flex flex-wrap h-auto mb-8 justify-start">
          <TabsTrigger value="piano" className="rounded-xl font-bold py-2 px-4 gap-2"><Music className="h-4 w-4" /> Piano</TabsTrigger>
          <TabsTrigger value="words" className="rounded-xl font-bold py-2 px-4 gap-2"><Search className="h-4 w-4" /> Words</TabsTrigger>
          <TabsTrigger value="tic" className="rounded-xl font-bold py-2 px-4 gap-2"><X className="h-4 w-4" /> Tic-Tac-Toe</TabsTrigger>
          <TabsTrigger value="memory" className="rounded-xl font-bold py-2 px-4 gap-2"><Brain className="h-4 w-4" /> Memory</TabsTrigger>
          <TabsTrigger value="snake" className="rounded-xl font-bold py-2 px-4 gap-2"><Gamepad2 className="h-4 w-4" /> Snake</TabsTrigger>
          <TabsTrigger value="math" className="rounded-xl font-bold py-2 px-4 gap-2"><Calculator className="h-4 w-4" /> Math</TabsTrigger>
          <TabsTrigger value="doodle" className="rounded-xl font-bold py-2 px-4 gap-2"><PenTool className="h-4 w-4" /> Doodle</TabsTrigger>
          <TabsTrigger value="whack" className="rounded-xl font-bold py-2 px-4 gap-2"><Hammer className="h-4 w-4" /> Whack-a-Task</TabsTrigger>
          <TabsTrigger value="tetris" className="rounded-xl font-bold py-2 px-4 gap-2"><Grid3X3 className="h-4 w-4" /> Tetris</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="piano"><Card className="rounded-[3rem] overflow-hidden bg-white shadow-xl"><PianoGame /></Card></TabsContent>
          <TabsContent value="words"><Card className="rounded-[3rem] p-6 bg-white shadow-xl"><WordSearchGame /></Card></TabsContent>
          <TabsContent value="tic"><Card className="rounded-[3rem] bg-white shadow-xl"><TicTacToe /></Card></TabsContent>
          <TabsContent value="memory"><Card className="rounded-[3rem] bg-white shadow-xl"><MemoryMatch /></Card></TabsContent>
          <TabsContent value="snake"><Card className="rounded-[3rem] bg-white shadow-xl"><SnakeGame /></Card></TabsContent>
          <TabsContent value="math"><Card className="rounded-[3rem] bg-white shadow-xl"><MathMaster /></Card></TabsContent>
          <TabsContent value="doodle"><Card className="rounded-[3rem] bg-white shadow-xl"><DoodleBoard /></Card></TabsContent>
          <TabsContent value="whack"><Card className="rounded-[3rem] bg-white shadow-xl"><WhackATask /></Card></TabsContent>
          <TabsContent value="tetris"><Card className="rounded-[3rem] bg-white shadow-xl"><TetrisGame /></Card></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
const ArrowUp = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m18 15-6-6-6 6"/></svg>
