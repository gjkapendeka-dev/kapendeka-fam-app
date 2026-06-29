"use client"

import * as React from "react"
import { ArrowLeft, PlayCircle, Loader2, Volume2, Trophy, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser, useSupabase } from "@/supabase"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

const LESSONS: Record<string, { word: string, translation: string, emoji: string }[]> = {
  "french": [
    { word: "Bonjour", translation: "Hello", emoji: "👋" },
    { word: "Merci", translation: "Thank you", emoji: "🙏" },
    { word: "Oui", translation: "Yes", emoji: "✅" },
    { word: "Non", translation: "No", emoji: "❌" },
    { word: "Chat", translation: "Cat", emoji: "🐈" },
    { word: "Chien", translation: "Dog", emoji: "🐕" },
  ],
  "shona": [
    { word: "Mhoro", translation: "Hello", emoji: "👋" },
    { word: "Ndatenda", translation: "Thank you", emoji: "🙏" },
    { word: "Ehe", translation: "Yes", emoji: "✅" },
    { word: "Kwete", translation: "No", emoji: "❌" },
    { word: "Imbwa", translation: "Dog", emoji: "🐕" },
    { word: "Katsi", translation: "Cat", emoji: "🐈" },
  ],
  "isizulu": [
    { word: "Sawubona", translation: "Hello", emoji: "👋" },
    { word: "Ngiyabonga", translation: "Thank you", emoji: "🙏" },
    { word: "Yebo", translation: "Yes", emoji: "✅" },
    { word: "Cha", translation: "No", emoji: "❌" },
    { word: "Inja", translation: "Dog", emoji: "🐕" },
    { word: "Ikati", translation: "Cat", emoji: "🐈" },
  ],
  "afrikaans": [
    { word: "Hallo", translation: "Hello", emoji: "👋" },
    { word: "Dankie", translation: "Thank you", emoji: "🙏" },
    { word: "Ja", translation: "Yes", emoji: "✅" },
    { word: "Nee", translation: "No", emoji: "❌" },
    { word: "Hond", translation: "Dog", emoji: "🐕" },
    { word: "Kat", translation: "Cat", emoji: "🐈" },
  ]
}

export default function LanguageLessonPage() {
  const { lang } = useParams()
  const language = (lang as string).toLowerCase()
  const words = LESSONS[language] || LESSONS["french"]

  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [finished, setFinished] = React.useState(false)
  const { toast } = useToast()

  const speak = (text: string) => {
     if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to set appropriate language
        if (language === 'french') utterance.lang = 'fr-FR';
        else if (language === 'afrikaans') utterance.lang = 'af-ZA';
        // Zulu/Shona might not be supported natively by all browsers, but it will try its best
        
        window.speechSynthesis.speak(utterance);
     } else {
        toast({ title: "Speech not supported", description: "Your browser doesn't support text-to-speech.", variant: "destructive" })
     }
  }

  const nextWord = () => {
    if (currentIndex + 1 < words.length) {
       setFlipped(false)
       setTimeout(() => setCurrentIndex(currentIndex + 1), 150)
    } else {
       setFinished(true)
    }
  }

  if (finished) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
           <Trophy className="w-32 h-32 text-amber-500 mb-6 animate-bounce" />
           <h1 className="text-4xl font-black text-primary uppercase tracking-tighter mb-4">Lesson Complete!</h1>
           <p className="text-xl font-bold text-muted-foreground mb-8">You learned {words.length} words in {language.charAt(0).toUpperCase() + language.slice(1)}!</p>
           <Link href="/languages">
              <Button className="h-16 px-12 rounded-[2rem] font-black text-lg bg-emerald-500 hover:bg-emerald-600 shadow-xl text-white transition-all active:scale-95">
                 <Star className="w-6 h-6 mr-3" /> Finish Lesson
              </Button>
           </Link>
        </div>
     )
  }

  return (
    <div className="flex flex-col p-3 md:p-5 space-y-6 max-w-2xl mx-auto pb-20">
      <header className="flex items-center gap-4">
        <Link href="/languages">
           <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
           <h1 className="text-3xl font-black uppercase tracking-tight text-primary capitalize">{language} Lesson</h1>
           <p className="text-muted-foreground font-bold text-sm">Word {currentIndex + 1} of {words.length}</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center mt-10">
         <Card 
            className={`w-full max-w-sm aspect-square rounded-[3rem] border-none shadow-2xl cursor-pointer transition-all duration-500 transform ${flipped ? 'bg-primary text-white rotate-y-180' : 'bg-white'}`}
            onClick={() => setFlipped(!flipped)}
            style={{ perspective: "1000px" }}
         >
            <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
               <div className="text-8xl mb-6">{words[currentIndex].emoji}</div>
               {!flipped ? (
                  <h2 className="text-5xl font-black tracking-tighter">{words[currentIndex].word}</h2>
               ) : (
                  <h2 className="text-5xl font-black tracking-tighter" style={{ transform: 'rotateY(180deg)' }}>{words[currentIndex].translation}</h2>
               )}
            </CardContent>
         </Card>

         <div className="flex gap-4 mt-12 w-full max-w-sm">
            <Button 
               onClick={() => speak(words[currentIndex].word)} 
               variant="outline" 
               className="flex-1 h-16 rounded-2xl font-black text-lg shadow-md border-2"
            >
               <Volume2 className="w-6 h-6 mr-2" /> Listen
            </Button>
            <Button 
               onClick={nextWord}
               className="flex-1 h-16 rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
            >
               Next <PlayCircle className="w-6 h-6 ml-2" />
            </Button>
         </div>
      </div>
    </div>
  )
}
