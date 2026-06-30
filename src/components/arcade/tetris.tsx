"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Play, RotateCcw, ArrowLeft, ArrowRight, ArrowDown, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSupabase, useUser } from "@/supabase"
import { saveGameScore } from "@/lib/arcade-utils"

// --- TETRIS CONSTANTS ---
const ROWS = 20
const COLS = 10
const EMPTY_CELL = null

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'

interface Block {
  color: string
}

type Grid = (Block | null)[][]

const TETROMINOES: Record<TetrominoType, { shape: number[][], color: string }> = {
  I: { shape: [[1, 1, 1, 1]], color: "bg-cyan-400" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "bg-blue-500" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "bg-orange-500" },
  O: { shape: [[1, 1], [1, 1]], color: "bg-yellow-400" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "bg-green-500" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "bg-purple-500" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "bg-red-500" },
}

const randomTetromino = () => {
  const keys = Object.keys(TETROMINOES) as TetrominoType[]
  const randKey = keys[Math.floor(Math.random() * keys.length)]
  return TETROMINOES[randKey]
}

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_CELL))

export function TetrisGame({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase()
  const { profile } = useUser()

  const [grid, setGrid] = useState<Grid>(createEmptyGrid())
  const [activePiece, setActivePiece] = useState<any>(null)
  const [playing, setPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)

  const dropTime = Math.max(100, 1000 - (level - 1) * 100)
  
  // Audio Context refs (silent integration for retro feel later if needed)
  const playSound = useCallback((freq: number, type: OscillatorType = 'square', dur: number = 0.1) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + dur);
      osc.stop(ctx.currentTime + dur);
    } catch(e) {}
  }, []);

  const resetGame = () => {
    setGrid(createEmptyGrid())
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    spawnPiece()
    setPlaying(true)
  }

  const spawnPiece = useCallback(() => {
    const tetromino = randomTetromino()
    setActivePiece({
      pos: { x: Math.floor(COLS / 2) - Math.floor(tetromino.shape[0].length / 2), y: 0 },
      tetromino,
    })
  }, [])

  const checkCollision = useCallback((piece: any, newPos: { x: number, y: number }, g: Grid = grid) => {
    for (let y = 0; y < piece.tetromino.shape.length; y++) {
      for (let x = 0; x < piece.tetromino.shape[y].length; x++) {
        if (piece.tetromino.shape[y][x] !== 0) {
          const moveY = y + newPos.y
          const moveX = x + newPos.x
          
          if (
            moveX < 0 || moveX >= COLS || 
            moveY >= ROWS || 
            (moveY >= 0 && g[moveY][moveX] !== EMPTY_CELL)
          ) {
            return true
          }
        }
      }
    }
    return false
  }, [grid])

  const mergePiece = useCallback(() => {
    const newGrid = grid.map(row => [...row])
    activePiece.tetromino.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0) {
          const py = activePiece.pos.y + y
          const px = activePiece.pos.x + x
          if (py >= 0 && py < ROWS) {
            newGrid[py][px] = { color: activePiece.tetromino.color }
          }
        }
      })
    })

    // Check for cleared lines
    let linesCleared = 0
    const filteredGrid = newGrid.filter(row => {
      const isComplete = row.every(cell => cell !== EMPTY_CELL)
      if (isComplete) linesCleared++
      return !isComplete
    })

    if (linesCleared > 0) {
      playSound(600, 'sine', 0.2)
      const newEmptyRows = Array.from({ length: linesCleared }, () => Array(COLS).fill(EMPTY_CELL))
      setGrid([...newEmptyRows, ...filteredGrid])
      setLines(prev => prev + linesCleared)
      
      const scoreMultipliers = [40, 100, 300, 1200]
      const addedScore = scoreMultipliers[linesCleared - 1] * level
      setScore(prev => prev + addedScore)
      setLevel(prev => Math.floor((lines + linesCleared) / 10) + 1)
    } else {
      playSound(200, 'triangle', 0.1) // drop sound
      setGrid(newGrid)
    }

    // Spawn next
    const nextTetromino = randomTetromino()
    const startPos = { x: Math.floor(COLS / 2) - Math.floor(nextTetromino.shape[0].length / 2), y: 0 }
    
    if (checkCollision({ pos: startPos, tetromino: nextTetromino }, startPos, newGrid)) {
      setGameOver(true)
      setPlaying(false)
      playSound(150, 'sawtooth', 0.8)
      saveGameScore(supabase, profile, 'Tetris', score, 'score')
    } else {
      setActivePiece({
        pos: startPos,
        tetromino: nextTetromino,
      })
    }
  }, [grid, activePiece, checkCollision, lines, level, score, playSound, supabase, profile])

  const movePiece = useCallback((dir: number) => {
    if (!activePiece || gameOver || !playing) return
    const newPos = { x: activePiece.pos.x + dir, y: activePiece.pos.y }
    if (!checkCollision(activePiece, newPos)) {
      setActivePiece({ ...activePiece, pos: newPos })
    }
  }, [activePiece, checkCollision, gameOver, playing])

  const dropPiece = useCallback(() => {
    if (!activePiece || gameOver || !playing) return
    const newPos = { x: activePiece.pos.x, y: activePiece.pos.y + 1 }
    if (!checkCollision(activePiece, newPos)) {
      setActivePiece({ ...activePiece, pos: newPos })
    } else {
      mergePiece()
    }
  }, [activePiece, checkCollision, gameOver, playing, mergePiece])

  const rotatePiece = useCallback(() => {
    if (!activePiece || gameOver || !playing) return
    const shape = activePiece.tetromino.shape
    const newShape = shape[0].map((_: any, i: number) => shape.map((row: any) => row[i]).reverse())
    const rotatedPiece = { ...activePiece, tetromino: { ...activePiece.tetromino, shape: newShape } }
    
    // Wall kick simple implementation
    let newPos = { ...activePiece.pos }
    if (checkCollision(rotatedPiece, newPos)) {
       newPos.x -= 1
       if (checkCollision(rotatedPiece, newPos)) {
           newPos.x += 2
           if (checkCollision(rotatedPiece, newPos)) return // Cannot rotate
       }
    }
    setActivePiece({ ...rotatedPiece, pos: newPos })
    playSound(400, 'square', 0.05)
  }, [activePiece, checkCollision, gameOver, playing, playSound])

  // Game Loop
  useEffect(() => {
    if (!playing || gameOver) return
    const interval = setInterval(dropPiece, dropTime)
    return () => clearInterval(interval)
  }, [playing, gameOver, dropPiece, dropTime])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playing || gameOver) return
      
      switch (e.key) {
        case 'ArrowLeft': movePiece(-1); break;
        case 'ArrowRight': movePiece(1); break;
        case 'ArrowDown': dropPiece(); break;
        case 'ArrowUp': rotatePiece(); break;
        case ' ': // Hard drop
          let p = { ...activePiece }
          let dropPos = { ...p.pos }
          while (!checkCollision(p, { x: dropPos.x, y: dropPos.y + 1 })) {
            dropPos.y += 1
          }
          setActivePiece({ ...p, pos: dropPos })
          setTimeout(mergePiece, 10)
          break;
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [playing, gameOver, movePiece, dropPiece, rotatePiece, activePiece, checkCollision, mergePiece])

  // Combine grid with active piece for rendering
  const renderGrid = grid.map(row => [...row])
  if (activePiece && playing) {
    activePiece.tetromino.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0) {
          const py = activePiece.pos.y + y
          const px = activePiece.pos.x + x
          if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
            renderGrid[py][px] = { color: activePiece.tetromino.color }
          }
        }
      })
    })
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex w-full max-w-sm justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-widest text-primary italic">Tetris</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Level {level} &bull; Lines {lines}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-muted-foreground uppercase">Score</div>
          <div className="text-2xl font-black text-amber-500">{score}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase">Best: {Math.max(score, personalBest)}</div>
        </div>
      </div>

      <div className="relative bg-slate-900 border-4 border-slate-800 rounded-lg p-1 shadow-xl">
        <div 
          className="grid gap-[1px] bg-slate-800" 
          style={{ 
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            width: 'min(80vw, 250px)',
            height: 'min(160vw, 500px)'
          }}
        >
          {renderGrid.map((row, y) => (
            row.map((cell, x) => (
              <div 
                key={`${y}-${x}`} 
                className={`w-full h-full rounded-[1px] ${cell ? cell.color + ' shadow-[inset_0_0_8px_rgba(0,0,0,0.3)]' : 'bg-slate-900'}`}
              />
            ))
          ))}
        </div>

        {!playing && !gameOver && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <Button onClick={resetGame} size="lg" className="rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Play className="mr-2 h-6 w-6" /> Play Now
            </Button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg backdrop-blur-md p-6 text-center space-y-4">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Game Over</h2>
            <div className="text-amber-400 font-bold text-xl uppercase tracking-widest">Score: {score}</div>
            <Button onClick={resetGame} className="rounded-2xl font-black uppercase tracking-widest bg-white text-black hover:bg-slate-200">
              <RotateCcw className="mr-2 h-5 w-5" /> Try Again
            </Button>
          </div>
        )}
      </div>
      
      {/* Mobile Controls */}
      {playing && !gameOver && (
        <div className="grid grid-cols-3 gap-2 mt-6 w-full max-w-xs md:hidden">
            <Button variant="secondary" className="h-16 rounded-2xl bg-slate-100 active:bg-slate-200" onClick={(e) => { e.preventDefault(); movePiece(-1); }}><ArrowLeft className="h-6 w-6" /></Button>
            <Button variant="secondary" className="h-16 rounded-2xl bg-slate-100 active:bg-slate-200" onClick={(e) => { e.preventDefault(); rotatePiece(); }}><RotateCw className="h-6 w-6" /></Button>
            <Button variant="secondary" className="h-16 rounded-2xl bg-slate-100 active:bg-slate-200" onClick={(e) => { e.preventDefault(); movePiece(1); }}><ArrowRight className="h-6 w-6" /></Button>
            <div className="col-span-3">
                <Button variant="secondary" className="w-full h-16 rounded-2xl bg-slate-200 active:bg-slate-300 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all" onPointerDown={(e) => { e.preventDefault(); dropPiece(); }}><ArrowDown className="h-6 w-6" /></Button>
            </div>
        </div>
      )}
    </div>
  )
}
