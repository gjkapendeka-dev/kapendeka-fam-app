# Kahoot-Style Quiz System - Setup & Usage Guide

## 🎯 What's Been Added

Your Kapendeka Fam App now has a complete **Kahoot-style quiz system** for the homework/school section! This allows parents to create engaging quizzes with multiple question types and students to take them.

### Features:
- ✅ **Multiple Question Types**: Multiple Choice, True/False, Short Answer, Essay
- ✅ **Question Management**: Add, edit, duplicate, delete questions
- ✅ **Point System**: Assign points to each question
- ✅ **Explanations**: Add learning hints/explanations for each question
- ✅ **Auto-Scoring**: Automatic scoring for MC and T/F questions
- ✅ **Manual Grading**: Teachers can grade short answer & essay responses
- ✅ **Progress Tracking**: See student quiz attempts and scores
- ✅ **Quiz Statistics**: View average scores, high/low scores, total attempts

---

## 📋 Database Setup (CRITICAL)

**You MUST run this migration to create the database tables:**

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Select your project: **Kapendeka_Fam_App**
3. Navigate to **SQL Editor**
4. Create a new query with the content from: `supabase/migrations/20260709000001_add_quiz_tables.sql`
5. Click **Run**

This creates:
- `quizzes` - Quiz metadata
- `quiz_questions` - Individual questions with options
- `quiz_responses` - Student answers
- `quiz_attempts` - Overall quiz tracking

---

## 🚀 How to Use

### For Parents/Teachers - Creating a Quiz:

1. **Go to School Tab** → Find or create an assignment
2. **Click the Quiz Button** (⚡ icon) on the assignment card
3. **Click "Create Quiz"** button
4. **Fill in Quiz Details**:
   - Quiz Title: e.g., "Chapter 3 Vocabulary Test"
   - Description: Add instructions
5. **Click "Add Question"** to start adding questions
6. **For Each Question**:
   - Select question type (Multiple Choice, True/False, etc.)
   - Write the question
   - Add options/answers
   - **CHECK the checkbox next to the correct answer**
   - Set point value
   - Add optional explanation
   - Click "Save Question"
7. **Publish Quiz** when ready

### For Students - Taking a Quiz:

1. **Go to School Tab** → Find your assignment
2. **Click the Quiz Button** (⚡ icon)
3. **Click "Take Quiz"**
4. **Answer each question**:
   - Click to select answer (MC/T/F)
   - Type response (Short Answer/Essay)
   - See hints if available
5. **Navigate with Previous/Next** or click question numbers
6. **Submit When Complete**
7. ✅ See your score immediately for auto-scored questions

### For Parents/Teachers - Reviewing Results:

1. **Go to School Tab** → Find assignment with quiz
2. **Click Quiz Button** → Quizzes Tab
3. **See Quiz Statistics**:
   - Total attempts
   - Average score
   - Highest/Lowest scores
4. **Click "Review"** on any student attempt
5. **View Their Answers**:
   - Green checkmark = Correct
   - Red X = Incorrect
   - Amber box = Needs manual grading
6. **Grade Short Answer/Essay**:
   - Click "Mark Correct" or "Mark Incorrect"
   - Student's score updates automatically

---

## 📁 Files Added/Modified

### New Components Created:
- `src/components/quiz-creator.tsx` - Parent interface for creating quizzes
- `src/components/quiz-display.tsx` - Student interface for taking quizzes
- `src/components/quiz-results.tsx` - Results & grading interface
- `src/components/assignment-quiz.tsx` - Integration component

### Modified Files:
- `src/app/school/page.tsx` - Added quiz button to assignment cards
- `supabase/migrations/20260709000001_add_quiz_tables.sql` - Database schema

---

## 🎮 Question Type Guide

### Multiple Choice
- Great for testing knowledge
- Supports 2-6 options
- Auto-scores based on correct answer
- ✅ Example: "What is the capital of France?" → Paris, London, Berlin, Madrid

### True/False
- Quick assessment questions
- Only 2 options (True/False)
- Auto-scores
- ✅ Example: "The Earth is flat." → True/False

### Short Answer
- Tests specific knowledge
- 1-word or few-word answers
- **Requires manual grading**
- ✅ Example: "What is the chemical symbol for gold?"

### Essay
- For longer written responses
- Full paragraph answers
- **Requires manual grading**
- ✅ Example: "Explain the causes of World War II"

---

## ⚙️ Technical Details

### Database Tables:

**quizzes**
- id, family_id, assignment_id, title, description, created_by, created_at, updated_at

**quiz_questions**
- id, quiz_id, question_number, question_text, question_type, options (JSON array), correct_answer, explanation, points, created_at

**quiz_responses**
- id, quiz_id, question_id, student_id, student_name, answer_text, is_correct, points_earned, submitted_at

**quiz_attempts**
- id, quiz_id, student_id, student_name, total_points, max_points, percentage_score, started_at, completed_at, is_completed

### Security:
- Row-Level Security (RLS) enabled on all tables
- Students can only see quizzes in their family
- Teachers can grade responses
- Data is properly scoped to family_id

---

## 🐛 Troubleshooting

### Quiz button not showing?
- ✅ Make sure you created the assignment first
- ✅ Check that the database migration ran successfully
- ✅ Verify Supabase connection is working

### Can't see student responses?
- ✅ Make sure student completed the quiz
- ✅ Check if they're in the same family
- ✅ Verify RLS policies allow access

### Scores not calculating?
- ✅ For MC/T/F: Make sure you checked the correct answer checkbox
- ✅ For Short Answer: Manually grade by clicking "Mark Correct"
- ✅ Check that points are assigned to each question

### Display issues?
- ✅ Try refreshing the page
- ✅ Clear browser cache
- ✅ Make sure all UI components are imported

---

## 📊 Next Steps & Enhancements

### Possible Future Features:
- 📱 Timer/time limit for quizzes
- 🎯 Question randomization/shuffle
- 📈 Detailed performance analytics
- 🏆 Quiz leaderboards
- 📧 Email notifications when quiz is ready
- 🎨 Quiz theme customization
- 📋 Question banking/reusable questions
- 🔀 Randomized test versions
- 💾 Export quiz results to PDF
- 🎤 Audio response support

---

## ❓ FAQ

**Q: Can I edit a quiz after publishing?**
A: Currently, once published, you create a new quiz for edits. You can delete and recreate if needed.

**Q: What if a student doesn't complete all questions?**
A: The quiz won't submit until all questions are answered. They can leave and return to complete it.

**Q: Can multiple children take the same quiz?**
A: Yes! Each student gets their own attempt tracked separately.

**Q: How long are quiz responses saved?**
A: Indefinitely, as part of your family data in Supabase.

**Q: Can I give partial credit?**
A: For auto-scored questions (MC/T/F), it's either right or wrong. For Short Answer/Essay, you manually set points earned.

---

## 📞 Need Help?

Check your browser console (F12) for any error messages. They'll help diagnose issues!

Good luck with your quizzes! 🎉
