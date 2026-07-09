import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Loader2 } from "lucide-react"
import { QuizCreator } from "./quiz-creator"

interface QuizEditorProps {
  quizId: string
  quizTitle: string
  supabase: any
  profile: any
  familyId: string
  onUpdated?: () => void
}

export function QuizEditor({
  quizId,
  quizTitle,
  supabase,
  profile,
  familyId,
  onUpdated,
}: QuizEditorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          title="Edit Quiz"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Quiz: {quizTitle}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <QuizCreator
            quizId={quizId}
            supabase={supabase}
            profile={profile}
            familyId={familyId}
            onQuizUpdated={() => {
              setOpen(false)
              onUpdated?.()
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
