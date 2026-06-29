import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DPadProps extends React.HTMLAttributes<HTMLDivElement> {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onAction?: () => void; // Optional center button action (e.g. drop/pause)
}

export function DPad({ onUp, onDown, onLeft, onRight, onAction, className, ...props }: DPadProps) {
  return (
    <div className={cn("grid grid-cols-3 grid-rows-3 gap-2 p-2 bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/30", className)} {...props}>
      <div />
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-12 w-12 rounded-t-2xl rounded-b-sm bg-white/50 active:bg-white/80 active:scale-95 shadow-sm hover:bg-white/60" 
        onPointerDown={(e) => { e.preventDefault(); onUp(); }}
      >
        <ChevronUp className="h-8 w-8 text-slate-800" />
      </Button>
      <div />

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-12 w-12 rounded-l-2xl rounded-r-sm bg-white/50 active:bg-white/80 active:scale-95 shadow-sm hover:bg-white/60" 
        onPointerDown={(e) => { e.preventDefault(); onLeft(); }}
      >
        <ChevronLeft className="h-8 w-8 text-slate-800" />
      </Button>
      
      {onAction ? (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-full bg-primary/80 active:bg-primary active:scale-95 shadow-md hover:bg-primary/90" 
          onPointerDown={(e) => { e.preventDefault(); onAction(); }}
        >
          <div className="w-4 h-4 rounded-full bg-white/80" />
        </Button>
      ) : (
        <div className="h-12 w-12 rounded-md bg-white/10" />
      )}

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-12 w-12 rounded-r-2xl rounded-l-sm bg-white/50 active:bg-white/80 active:scale-95 shadow-sm hover:bg-white/60" 
        onPointerDown={(e) => { e.preventDefault(); onRight(); }}
      >
        <ChevronRight className="h-8 w-8 text-slate-800" />
      </Button>

      <div />
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-12 w-12 rounded-b-2xl rounded-t-sm bg-white/50 active:bg-white/80 active:scale-95 shadow-sm hover:bg-white/60" 
        onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      >
        <ChevronDown className="h-8 w-8 text-slate-800" />
      </Button>
      <div />
    </div>
  )
}
