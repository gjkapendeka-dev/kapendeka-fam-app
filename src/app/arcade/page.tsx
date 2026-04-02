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
  Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// --- PIANO GAME COMPONENT ---
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
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {PIANO_KEYS.map(k => (
          <Badge key={k.note} variant="outline" className="text-[10px] font-bold uppercase">{k.key}</Badge>
        ))}
      </div>
    </div>
  )
}

// --- WORD SEARCH GAME COMPONENT ---
function WordSearchGame() {
  const [words, setWords] = React.useState<string[]>(["FAMILY", "JOY", "HUB", "ARCADE"])
  const [newWord, setNewWord] = React.useState("")
  const [grid, setGrid] = React.useState<string[][]>([])
  const [foundWords, setFoundWords] = React.useState<string[]>([])
  const gridSize = 10

  const generateGrid = React.useCallback(() => {
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(""))
    
    words.forEach(word => {
      let placed = false
      while (!placed) {
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
    setFoundWords([])
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
          <CardDescription>Add words to hide in the grid</CardDescription>
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
            <RefreshCw className="h-4 w-4 mr-2" /> Regenerate Grid
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

// --- TETRIS GAME COMPONENT ---
const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: "bg-sky-400" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "bg-blue-500" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "bg-orange-400" },
  O: { shape: [[1, 1], [1, 1]], color: "bg-yellow-400" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "bg-emerald-400" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "bg-purple-400" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "bg-rose-400" },
}

function TetrisGame() {
  const [grid, setGrid] = React.useState(Array(20).fill(null).map(() => Array(10).fill(0)))
  const [activePiece, setActiveNote] = React.useState<any>(null)
  const [score, setScore] = React.useState(0)
  const [isGameOver, setIsGameOver] = React.useState(false)

  // Minimal Tetris Logic for display/fun
  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">Score</p>
          <p className="text-3xl font-black text-primary">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">Level</p>
          <p className="text-3xl font-black text-accent">1</p>
        </div>
      </div>

      <div className="relative w-full max-w-[300px] aspect-[1/2] bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden grid grid-cols-10 gap-px p-px">
        {grid.map((row, ri) => row.map((cell, ci) => (
          <div key={`${ri}-${ci}`} className={`w-full h-full rounded-sm ${cell ? 'bg-primary' : 'bg-slate-800/50'}`} />
        )))}
        
        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Trophy className="h-12 w-12 text-yellow-500" />
            <h4 className="text-2xl font-bold text-white uppercase tracking-widest">Game Over</h4>
            <Button onClick={() => { setIsGameOver(false); setScore(0); }} className="bg-primary text-white rounded-xl font-bold">Try Again</Button>
          </div>
        )}
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

export default function ArcadePage() {
  return (
    <div className="flex flex-col p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">Universe Arcade</h1>
          <p className="text-muted-foreground font-medium">Fun and games for the Kapendeka Universe</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-accent text-white border-none font-bold uppercase px-3 py-1">Arcade Beta</Badge>
        </div>
      </header>

      <Tabs defaultValue="piano" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl w-full max-w-[600px] mb-8">
          <TabsTrigger value="piano" className="flex-1 rounded-xl font-bold py-3 gap-2">
            <Music className="h-4 w-4" /> Piano
          </TabsTrigger>
          <TabsTrigger value="words" className="flex-1 rounded-xl font-bold py-3 gap-2">
            <Search className="h-4 w-4" /> Word Search
          </TabsTrigger>
          <TabsTrigger value="tetris" className="flex-1 rounded-xl font-bold py-3 gap-2">
            <Grid3X3 className="h-4 w-4" /> Tetris
          </TabsTrigger>
        </TabsList>

        <TabsContent value="piano">
          <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <PianoGame />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="words">
          <Card className="rounded-[3rem] border-none shadow-xl bg-white p-6 md:p-12">
            <WordSearchGame />
          </Card>
        </TabsContent>

        <TabsContent value="tetris">
          <Card className="rounded-[3rem] border-none shadow-xl bg-white">
            <CardContent className="p-0">
              <TetrisGame />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
