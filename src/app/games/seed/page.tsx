"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSupabase, useUser } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function SeedPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const { profile } = useUser()
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState("")

  const handleSeed = async () => {
    if (!profile) {
      setMsg("You must be logged in.")
      return
    }
    setLoading(true)
    setMsg("Seeding quiz...")

    try {
      // 1. Create Quiz
      const quizPayload = {
        family_id: profile.family_id,
        title: 'Kids Ultimate Fun Quiz!',
        description: 'A super fun 25-question quiz for 9-year-olds! Flags, fruits, colors, everyday items and more!',
        category: 'Fun',
        difficulty: 'easy',
        question_timer: 20,
        show_leaderboard: true,
        time_bonus_enabled: true,
        shuffle_questions: false,
        shuffle_options: true,
        show_correct_answer: true,
        show_explanation: true,
        created_by: profile.display_name,
        theme: 'sunset',
        is_draft: false,
        updated_at: new Date().toISOString()
      }

      const { data: quizData, error: qErr } = await supabase.from("quizzes").insert(quizPayload).select().single()
      if (qErr) throw qErr

      // 2. Insert Questions
      const questions = [
        { num: 1, text: 'Which country does this flag belong to?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg', diff: 'easy', opts: ['United Kingdom', 'United States', 'Canada', 'Australia'], correct: '1', expl: 'This is the flag of the United States of America, with 50 stars and 13 stripes.' },
        { num: 2, text: 'Which country has a maple leaf on its flag?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Flag_of_Canada_%28Pantone%29.svg', diff: 'easy', opts: ['Canada', 'France', 'Japan', 'Brazil'], correct: '0', expl: 'The Canadian flag features a distinctive red maple leaf in the center.' },
        { num: 3, text: 'What is the name of this yellow fruit that monkeys love?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg', diff: 'easy', opts: ['Apple', 'Banana', 'Orange', 'Grapes'], correct: '1', expl: 'Bananas are yellow, curved fruits that are a great source of potassium.' },
        { num: 4, text: 'What color do you get when you mix red and blue?', type: 'multiple_choice', img: '', diff: 'easy', opts: ['Green', 'Purple', 'Orange', 'Yellow'], correct: '1', expl: 'Mixing red and blue paint makes purple!' },
        { num: 5, text: 'Which kitchen utensil is best for eating soup?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Soup_Spoon.jpg', diff: 'easy', opts: ['Fork', 'Knife', 'Spoon', 'Spatula'], correct: '2', expl: 'A spoon has a small bowl at the end, perfect for scooping up liquid like soup!' },
        { num: 6, text: 'Which animal is known as the King of the Jungle?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg', diff: 'easy', opts: ['Tiger', 'Elephant', 'Lion', 'Bear'], correct: '2', expl: 'Lions are often called the kings of the jungle because of their strength and majestic manes.' },
        { num: 7, text: 'What is 8 + 7?', type: 'multiple_choice', img: '', diff: 'medium', opts: ['14', '15', '16', '17'], correct: '1', expl: '8 plus 7 equals 15!' },
        { num: 8, text: 'Which planet is known as the Red Planet?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg', diff: 'medium', opts: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: '1', expl: 'Mars appears red because its surface is covered in iron oxide, which is like rust!' },
        { num: 9, text: 'What do you use an umbrella for?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Red_umbrella_in_the_rain.jpg', diff: 'easy', opts: ['To sleep', 'To stay dry in the rain', 'To cook food', 'To drive'], correct: '1', expl: 'Umbrellas protect you from getting wet when it rains.' },
        { num: 10, text: 'Which of these is a red fruit with seeds on the outside?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/2/29/PerfectStrawberry.jpg', diff: 'easy', opts: ['Apple', 'Cherry', 'Strawberry', 'Watermelon'], correct: '2', expl: 'Strawberries are the only fruit that wear their seeds on the outside!' },
        { num: 11, text: 'The sun rises in the West.', type: 'true_false', img: '', diff: 'easy', opts: ['True', 'False'], correct: 'false', expl: 'The sun rises in the East and sets in the West.' },
        { num: 12, text: 'Which is the largest ocean on Earth?', type: 'multiple_choice', img: '', diff: 'medium', opts: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'], correct: '2', expl: 'The Pacific Ocean is the largest and deepest ocean on Earth.' },
        { num: 13, text: 'How many sides does a triangle have?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Equilateral_Triangle.svg', diff: 'easy', opts: ['2', '3', '4', '5'], correct: '1', expl: 'A triangle has exactly three sides.' },
        { num: 14, text: 'What color are emeralds?', type: 'multiple_choice', img: '', diff: 'easy', opts: ['Red', 'Blue', 'Green', 'Yellow'], correct: '2', expl: 'Emeralds are beautiful green gemstones.' },
        { num: 15, text: 'What do caterpillars turn into?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Monarch_Butterfly_Danaus_plexippus.jpg', diff: 'easy', opts: ['Bees', 'Spiders', 'Butterflies', 'Ladybugs'], correct: '2', expl: 'Caterpillars build a chrysalis and emerge as beautiful butterflies!' },
        { num: 16, text: 'Fish breathe air through their noses.', type: 'true_false', img: '', diff: 'easy', opts: ['True', 'False'], correct: 'false', expl: 'Fish breathe oxygen from the water using their gills, not noses!', double: true },
        { num: 17, text: 'What food do mice famously love in cartoons?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Swiss_cheese_cube.jpg', diff: 'easy', opts: ['Bread', 'Cheese', 'Carrots', 'Fish'], correct: '1', expl: 'Cartoons always show mice eating cheese, especially Swiss cheese with holes!' },
        { num: 18, text: 'How many fingers are on a typical human hand?', type: 'multiple_choice', img: '', diff: 'easy', opts: ['4', '5', '6', '10'], correct: '1', expl: 'Most humans have 5 fingers on each hand (including the thumb).' },
        { num: 19, text: 'How many months are in a year?', type: 'multiple_choice', img: '', diff: 'easy', opts: ['10', '12', '14', '24'], correct: '1', expl: 'There are 12 months in a year, starting with January and ending with December.' },
        { num: 20, text: 'Which country has a big red circle in the middle of its white flag?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Flag_of_Japan.svg', diff: 'medium', opts: ['South Korea', 'China', 'Japan', 'Vietnam'], correct: '2', expl: 'The flag of Japan has a red circle which represents the sun.' },
        { num: 21, text: 'What do you use to brush your teeth?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Toothbrush_-_red.jpg', diff: 'easy', opts: ['Hairbrush', 'Toothbrush', 'Paintbrush', 'Broom'], correct: '1', expl: 'You use a toothbrush to keep your teeth clean and healthy.' },
        { num: 22, text: 'Which bird can swim but cannot fly?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Emperor_Penguin_Manchot_empereur.jpg', diff: 'medium', opts: ['Eagle', 'Parrot', 'Penguin', 'Ostrich'], correct: '2', expl: 'Penguins use their wings as flippers to swim fast in the ocean!' },
        { num: 23, text: 'Where do you go to borrow a book without buying it?', type: 'multiple_choice', img: '', diff: 'easy', opts: ['Supermarket', 'Library', 'Toy Store', 'Park'], correct: '1', expl: 'A library is a place where you can borrow books for free.' },
        { num: 24, text: 'What color is the sky on a clear day?', type: 'multiple_choice', img: '', diff: 'easy', opts: ['Green', 'Red', 'Blue', 'Yellow'], correct: '2', expl: 'The sky is blue on a clear day!' },
        { num: 25, text: 'What are the colorful plastic bricks you can build things with?', type: 'multiple_choice', img: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Lego_bricks.jpg', diff: 'easy', opts: ['Play-Doh', 'LEGO', 'Marbles', 'Jigsaw'], correct: '1', expl: 'LEGO bricks are famous for snapping together to build almost anything!', double: true },
      ]

      const toInsert = questions.map(q => ({
        quiz_id: quizData.id,
        question_number: q.num,
        question_text: q.text,
        question_type: q.type,
        question_image_url: q.img,
        difficulty: q.diff,
        time_limit: q.type === 'true_false' ? 15 : (q.diff === 'medium' ? 25 : 20),
        options: q.type === 'multiple_choice' || q.type === 'true_false' ? q.opts : [],
        correct_answer: q.correct,
        explanation: q.expl,
        points: q.double ? 200 : 100,
        is_double_points: q.double ? true : false,
      }))

      const { error: qsErr } = await supabase.from("quiz_questions").insert(toInsert)
      if (qsErr) throw qsErr

      // 3. Create Session to host it directly
      const pin = Math.floor(1000 + Math.random() * 9000).toString()
      const { data: sessionData, error: sErr } = await supabase.from("quiz_sessions").insert({
        quiz_id: quizData.id,
        family_id: profile.family_id,
        host_id: profile.id,
        status: "waiting",
        join_pin: pin,
        require_pin: true,
        show_questions_on_devices: true
      }).select().single()
      if (sErr) throw sErr

      setMsg("Done! Redirecting to host screen...")
      router.push(`/games/host/${sessionData.id}`)
      
    } catch (e: any) {
      setMsg(`Error: ${e.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-8">
      <div className="bg-white p-12 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-6">
        <h1 className="text-3xl font-black text-slate-800">Ready to Host?</h1>
        <p className="text-slate-600">Click the button below to instantly generate the 25-question Kids Ultimate Fun Quiz and start hosting it!</p>
        
        <Button onClick={handleSeed} disabled={loading} size="lg" className="w-full h-16 text-xl rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg">
          {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
          Create & Host Quiz
        </Button>
        {msg && <p className="text-sm font-bold text-slate-500 mt-4">{msg}</p>}
      </div>
    </div>
  )
}
