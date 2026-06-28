const fs = require('fs');
let content = fs.readFileSync('src/app/finances/page.tsx', 'utf8');

const allowanceJSX = `
          {profile?.role === 'parent' && (
            <Button onClick={handleDistributeAllowance} disabled={isDistributing} className="rounded-xl h-11 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
              {isDistributing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />} Distribute Allowances
            </Button>
          )}
`;

if (!content.includes('Distribute Allowances')) {
    content = content.replace('{profile?.role === \'parent\' && (', allowanceJSX + '\n          {profile?.role === \'parent\' && (');
}

const hookInsert = `
  const [isDistributing, setIsDistributing] = React.useState(false)

  const handleDistributeAllowance = async () => {
    if (!supabase || !profile?.familyId) return
    setIsDistributing(true)

    // Fetch all kids
    const { data: kids } = await supabase.from('profiles').select('*').eq('family_id', profile.familyId).neq('role', 'parent')
    
    if (!kids || kids.length === 0) {
      toast({ title: "No kids found" })
      setIsDistributing(false)
      return
    }

    let distributed = 0;
    for (const kid of kids) {
      if ((kid.streak_days || 0) >= 7) {
        // Distribute R 50
        const txData = {
          familyId: profile.familyId,
          userId: kid.id,
          userName: kid.display_name,
          amount: 50.00,
          type: 'allowance',
          category: 'Pocket Money',
          description: 'Weekly Allowance for maintaining a 7-day chore streak!',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }
        await supabase.from("transactions").insert([txData])
        
        // Broadcast
        await supabase.from("broadcasts").insert([{
          family_id: profile.familyId,
          type: 'celebration',
          message: \`\${kid.display_name} just earned their Weekly Allowance! 💸\`
        }])
        
        distributed++;
      }
    }

    setIsDistributing(false)
    if (distributed > 0) {
      toast({ title: "Allowances Distributed!", description: \`\${distributed} kid(s) received their weekly allowance.\` })
    } else {
      toast({ title: "No Qualifiers", description: "None of the kids have a 7-day chore streak right now." })
    }
  }
`;

if (!content.includes('handleDistributeAllowance')) {
    content = content.replace('const handleAddTransaction', hookInsert + '\n  const handleAddTransaction');
}

fs.writeFileSync('src/app/finances/page.tsx', content);
console.log('Finances updated with Automated Allowance');
