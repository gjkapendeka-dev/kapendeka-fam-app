'use client'

import React, { useState, useCallback } from 'react'
import { Trophy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { audio } from '@/lib/audio'
import { useSupabase } from '@/supabase/provider'
import { useUser } from '@/supabase/auth/use-user'
import { saveGameScore } from '@/lib/arcade-utils'

const COLORS = [
  'bg-slate-100', // Empty
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500'
]

export function ColourBlocks({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [grid, setGrid] = useState<number[][]>(Array(8).fill(null).map(() => Array(8).fill(0)))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [nextBlockColor, setNextBlockColor] = useState(Math.floor(Math.random() * 5) + 1)

  const checkLines = useCallback((currentGrid: number[][]) => {
    let linesCleared = 0
    const newGrid = [...currentGrid.map(row => [...row])]

    // Check rows
    for (let r = 0; r < 8; r++) {
      if (newGrid[r].every(cell => cell !== 0)) {
        linesCleared++
        for (let c = 0; c < 8; c++) newGrid[r][c] = 0
      }
    }

    // Check columns
    for (let c = 0; c < 8; c++) {
      let isFull = true
      for (let r = 0; r < 8; r++) {
        if (newGrid[r][c] === 0) {
          isFull = false
          break
        }
      }
      if (isFull) {
        linesCleared++
        for (let r = 0; r < 8; r++) newGrid[r][c] = 0
      }
    }

    if (linesCleared > 0) {
      setScore(s => s + (linesCleared * 10) * linesCleared) // combo multiplier
      audio.playDramatic3D(0, 1 + linesCleared * 0.5)
    }

    return { clearedGrid: newGrid, cleared: linesCleared > 0 }
  }, [])

  const placeBlock = (r: number, c: number) => {
    if (gameOver || grid[r][c] !== 0) return

    audio.playBlip(400)
    
    const newGrid = [...grid.map(row => [...row])]
    newGrid[r][c] = nextBlockColor
    
    const { clearedGrid, cleared } = checkLines(newGrid)
    
    setGrid(clearedGrid)
    setNextBlockColor(Math.floor(Math.random() * 5) + 1)
    
    // Simple game over check: if grid is full
    if (!clearedGrid.some(row => row.some(cell => cell === 0))) {
      setGameOver(true)
      audio.playCrash()
      saveGameScore(supabase, profile, 'Colour Blocks', score)
    }
  }

  const resetGame = () => {
    setGrid(Array(8).fill(null).map(() => Array(8).fill(0)))
    setScore(0)
    setGameOver(false)
    setNextBlockColor(Math.floor(Math.random() * 5) + 1)
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex justify-between w-full mb-4 px-2">
        <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">PB: {personalBest}</div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Next:</span>
           <div className={`w-4 h-4 rounded-sm ${COLORS[nextBlockColor]}`}></div>
        </div>
        <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Score: {score}</div>
      </div>
      
      <div className="relative bg-slate-900 rounded-[2rem] p-4 shadow-inner border-4 border-slate-800">
        <div className="grid grid-cols-8 gap-1">
           {grid.map((row, r) => row.map((cell, c) => (
             <div 
               key={`${r}-${c}`} 
               onClick={() => placeBlock(r, c)}
               className={`w-8 h-8 sm:w-10 sm:h-10 rounded-sm cursor-pointer transition-colors ${COLORS[cell]} ${cell === 0 ? 'hover:bg-slate-800' : ''}`}
             />
           )))}
        </div>
        
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-10 space-y-4 rounded-[2rem]">
            <Trophy className="h-12 w-12 text-yellow-500 mb-2" />
            <h4 className="font-bold text-2xl uppercase tracking-widest text-white">Game Over</h4>
            <Button onClick={resetGame} className="rounded-xl font-bold bg-primary px-6 mt-4"><RotateCcw className="w-4 h-4 mr-2" /> Try Again</Button>
          </div>
        )}
      </div>
    </div>
  )
}
