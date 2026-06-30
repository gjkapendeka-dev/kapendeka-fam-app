'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, RotateCcw, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { audio } from '@/lib/audio'
import { useSupabase } from '@/supabase/provider'
import { useUser } from '@/supabase/auth/use-user'
import { saveGameScore } from '@/lib/arcade-utils'

type Bolt = { id: number, active: boolean, color: string }
type Plate = { id: number, bolts: number[], color: string }

export function NutAndBolts({ personalBest = 0 }: { personalBest?: number }) {
  const supabase = useSupabase();
  const { profile } = useUser();
  const [bolts, setBolts] = useState<Bolt[]>([])
  const [plates, setPlates] = useState<Plate[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [moves, setMoves] = useState(20)

  const generateLevel = () => {
    const newBolts: Bolt[] = Array(9).fill(null).map((_, i) => ({ 
      id: i, 
      active: Math.random() > 0.3,
      color: 'bg-slate-300'
    }))
    
    const newPlates: Plate[] = [
      { id: 1, bolts: [0, 1, 3, 4].filter(i => newBolts[i].active), color: 'bg-amber-600' },
      { id: 2, bolts: [4, 5, 7, 8].filter(i => newBolts[i].active), color: 'bg-blue-600' },
      { id: 3, bolts: [1, 2, 4, 5].filter(i => newBolts[i].active), color: 'bg-emerald-600' },
    ].filter(p => p.bolts.length > 0)

    setBolts(newBolts)
    setPlates(newPlates)
  }

  useEffect(() => {
    generateLevel()
  }, [])

  const unscrew = (id: number) => {
    if (gameOver || moves <= 0) return
    
    if (!bolts[id].active) {
      audio.playBlip(200)
      return // Already unscrewed
    }

    audio.playBlip(600)
    
    const newBolts = [...bolts]
    newBolts[id].active = false
    setBolts(newBolts)
    setMoves(m => m - 1)

    // Check for falling plates
    const remainingPlates = plates.filter(plate => {
      const stillAttached = plate.bolts.some(b => newBolts[b].active)
      if (!stillAttached) {
        setScore(s => s + 50)
        audio.playDramatic3D(0, 1.2) // Drop sound
        return false // Plate falls
      }
      return true
    })

    setPlates(remainingPlates)

    if (remainingPlates.length === 0) {
      setTimeout(() => {
        setMoves(m => m + 5)
        generateLevel()
      }, 500)
    } else if (moves - 1 <= 0) {
      setGameOver(true)
      audio.playCrash()
      saveGameScore(supabase, profile, 'Nuts and Bolts', score)
    }
  }

  const resetGame = () => {
    setScore(0)
    setMoves(20)
    setGameOver(false)
    generateLevel()
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex justify-between w-full mb-4 px-2">
        <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Moves: {moves}</div>
        <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Score: {score}</div>
      </div>
      
      <div className="relative bg-slate-200 rounded-[2rem] p-6 shadow-inner border-4 border-slate-300 w-[280px] h-[280px] flex items-center justify-center">
        
        {/* Plates background rendering */}
        <div className="absolute inset-0 m-6 grid grid-cols-2 grid-rows-2 gap-2 opacity-50">
          <div className={`${plates.some(p => p.id === 1) ? 'bg-amber-600' : 'bg-transparent'} rounded-xl transition-colors`}></div>
          <div className={`${plates.some(p => p.id === 3) ? 'bg-emerald-600' : 'bg-transparent'} rounded-xl transition-colors`}></div>
          <div className="bg-transparent"></div>
          <div className={`${plates.some(p => p.id === 2) ? 'bg-blue-600' : 'bg-transparent'} rounded-xl transition-colors`}></div>
        </div>

        {/* Bolts Grid */}
        <div className="grid grid-cols-3 gap-8 z-10">
           {bolts.map((bolt) => (
             <div 
               key={bolt.id} 
               onClick={() => unscrew(bolt.id)}
               className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${bolt.active ? 'bg-slate-700 shadow-xl border-t-2 border-slate-500 scale-100 hover:scale-110' : 'bg-slate-300 shadow-inner scale-90'}`}
             >
               {bolt.active && <Wrench className="w-5 h-5 text-slate-400" />}
             </div>
           ))}
        </div>
        
        {gameOver && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 rounded-[2rem]">
            <Trophy className="h-12 w-12 text-yellow-500 mb-2" />
            <h4 className="font-bold text-2xl uppercase tracking-widest text-slate-900">Out of Moves!</h4>
            <Button onClick={resetGame} className="rounded-xl font-bold bg-primary px-6 mt-4"><RotateCcw className="w-4 h-4 mr-2" /> Try Again</Button>
          </div>
        )}
      </div>
    </div>
  )
}
