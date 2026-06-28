const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Update format import
content = content.replace('import { format } from "date-fns"', 'import { format, formatDistanceToNow } from "date-fns"');

const mockBlock = `
  // Mock Notifications
  const notifications = [
    { title: "Junior completed: Laundry", time: "2h ago", type: "task" },
    { title: "New Memory posted by Sarah", time: "5h ago", type: "social" },
    { title: "Reminder: Dentist Appointment", time: "Tomorrow", type: "calendar" },
  ]
`;

const newBlock = `
  const notificationsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null;
    return supabase.from("broadcasts").select("*").eq("family_id", profile.familyId).order("created_at", { ascending: false }).limit(6);
  }, [supabase, profile?.familyId]);
  const { data: broadcasts } = useCollection(notificationsQuery);

  const notifications = broadcasts?.map(b => ({
    title: b.message,
    time: formatDistanceToNow(new Date(b.created_at), { addSuffix: true }),
    type: b.type
  })) || []
`;

if (content.includes('// Mock Notifications')) {
    content = content.replace(mockBlock, newBlock);
}

fs.writeFileSync('src/app/page.tsx', content);
console.log('Dashboard notifications updated');
