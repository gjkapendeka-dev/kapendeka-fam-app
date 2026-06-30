'use client'

import React, { useState, useCallback } from 'react'
import { Trophy, Apple, Cherry, Grape, Citrus, Banana } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { audio } from '@/lib/audio'
import { useSupabase } from '@/supabase/provider'
import { useUser } from '@/supabase/auth/use-user'
import { saveGameScore } from '@/lib/arcade-utils'

const FRUITS = [
  { id: 1, name: 'Cherry', color: 'text-red-500', icon: Cherry, score: 2 },
  { id: 2, name: 'Apple', color: 'text-red-400', icon: Apple, score: 5 },
  { id: 3, name: 'Grape', color: 'text-purple-500', icon: Grape, score: 10 },
  { id: 4, name: 'Citrus', color: 'text-orange-500', icon: Citrus, score: 20 },
  { id: 5, name: 'Banana', color: 'text-yellow-500', icon: Banana, score: 50 },
]

export function FruitMerge({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [grid, setGrid] = useState<number[][]>(Array(6).fill(null).map(() => Array(5).fill(0)))
  const [activeFruit, setActiveFruit] = useState<{ id: number, col: number }>({ id: 1, col: 2 })
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const dropFruit = useCallback(() => {
    if (gameOver) return
    
    const col = activeFruit.col
    let rowToPlace = -1
    
    for (let r = 5; r >= 0; r--) {
      if (grid[r][col] === 0) {
        rowToPlace = r
        break
      }
    }
    
    if (rowToPlace === -1) {
      setGameOver(true)
      audio.playCrash()
      saveGameScore(supabase, profile, 'Fruit Merge', score)
      return
    }

    const newGrid = [...grid.map(row => [...row])]
    newGrid[rowToPlace][col] = activeFruit.id
    
    // Check merge (only checks underneath for simplicity in MVP)
    if (rowToPlace < 5 && newGrid[rowToPlace + 1][col] === activeFruit.id) {
       newGrid[rowToPlace + 1][col] = activeFruit.id + 1
       newGrid[rowToPlace][col] = 0
       const mergedFruit = FRUITS.find(f => f.id === activeFruit.id + 1)
       if (mergedFruit) setScore(s => s + mergedFruit.score)
       // Dramatic 3D sound based on column position (-1 left, 1 right)
       const pan = (col / 4) * 2 - 1
       audio.playDramatic3D(pan, 1 + activeFruit.id * 0.2)
    } else {
       audio.playBlip(300)
    }

    setGrid(newGrid)
    setActiveFruit({ id: Math.floor(Math.random() * 3) + 1, col: 2 })
  }, [activeFruit, grid, gameOver, supabase, profile, score])

  const moveLeft = () => {
    if (activeFruit.col > 0) {
      setActiveFruit(prev => ({ ...prev, col: prev.col - 1 }))
      audio.playBlip(500)
    }
  }

  const moveRight = () => {
    if (activeFruit.col < 4) {
      setActiveFruit(prev => ({ ...prev, col: prev.col + 1 }))
      audio.playBlip(500)
    }
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex justify-between w-full mb-4 px-2">
        <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">PB: {personalBest}</div>
        <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Score: {score}</div>
      </div>
      
      <div className="relative bg-slate-100 rounded-xl p-2 shadow-inner w-full max-w-[300px]">
        {/* Active Fruit */}
        <div className="flex w-full mb-2 h-12">
           {Array(5).fill(0).map((_, i) => (
             <div key={i} className="flex-1 flex justify-center items-center">
               {i === activeFruit.col && !gameOver && (
                 <div className="animate-bounce">
                   {FRUITS[activeFruit.id - 1] && React.createElement(FRUITS[activeFruit.id - 1].icon, { className: `w-8 h-8 ${FRUITS[activeFruit.id - 1].color}` })}
                 </div>
               )}
             </div>
           ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-1 bg-white p-1 rounded-lg border-2 border-slate-200">
           {grid.map((row, r) => row.map((cell, c) => (
             <div key={`${r}-${c}`} className="aspect-square bg-slate-50 rounded-md flex items-center justify-center">
                {cell > 0 && FRUITS[cell - 1] && (
                  React.createElement(FRUITS[cell - 1].icon, { className: `w-8 h-8 ${FRUITS[cell - 1].color}` })
                )}
             </div>
           )))}
        </div>
        
        {gameOver && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 text-center z-10 space-y-4">
            <Trophy className="h-12 w-12 text-yellow-500 mb-2" />
            <h4 className="font-bold text-xl uppercase tracking-widest">Game Over</h4>
            <Button onClick={() => { setGrid(Array(6).fill(null).map(() => Array(5).fill(0))); setGameOver(false); setScore(0); setActiveFruit({ id: 1, col: 2 }) }} className="rounded-xl">Try Again</Button>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <Button onClick={moveLeft} variant="outline" className="rounded-xl px-6">Left</Button>
        <Button onClick={dropFruit} className="rounded-xl px-8 bg-emerald-500 hover:bg-emerald-600 text-white border-0">Drop</Button>
        <Button onClick={moveRight} variant="outline" className="rounded-xl px-6">Right</Button>
      </div>
    </div>
  )
}
