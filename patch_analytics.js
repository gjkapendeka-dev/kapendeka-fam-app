const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const rechartsImport = `import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"`;

const analyticsJSX = `
        {/* Parent Analytics */}
        {profile?.role === 'parent' && (
          <div className="md:col-span-12 lg:col-span-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="p-4 md:p-6 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-xl font-bold">Universe Analytics</CardTitle>
                </div>
                <CardDescription>Weekly XP Generation across all Kids</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Mon', xp: 400 },
                      { name: 'Tue', xp: 300 },
                      { name: 'Wed', xp: 550 },
                      { name: 'Thu', xp: 450 },
                      { name: 'Fri', xp: 700 },
                      { name: 'Sat', xp: 900 },
                      { name: 'Sun', xp: 600 }
                    ]}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="xp" fill="#4f46e5" radius={[4, 4, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
`;

if (!content.includes('BarChart')) {
  content = content.replace('import { format, formatDistanceToNow } from "date-fns"', rechartsImport + '\nimport { format, formatDistanceToNow } from "date-fns"');
  content = content.replace('{/* Quick Actions */}', analyticsJSX + '\n        {/* Quick Actions */}');
}

fs.writeFileSync('src/app/page.tsx', content);
console.log('Dashboard analytics added');
