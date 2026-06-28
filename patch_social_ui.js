const fs = require('fs');
let content = fs.readFileSync('src/app/social/page.tsx', 'utf8');

// Replace mock POSTS array with the query mapping
const supabaseQuery = `
  const postsQuery = React.useMemo(() => {
    if (!supabase || !profile?.familyId) return null
    return supabase.from("posts")
      .select("*")
      .eq("family_id", profile.familyId).order("created_at", { ascending: false }).limit(20)
  }, [supabase, profile?.familyId])

  const { data: posts, loading } = useCollection(postsQuery)
`;

// It seems postsQuery is already in the file, but let's make sure the UI uses `posts` and not `POSTS`
if (content.includes('POSTS.map')) {
    content = content.replace(/POSTS\.map/g, 'posts?.map');
}

// Replace UI usage
content = content.replace(/post\.authorName/g, 'post.author_name');
content = content.replace(/post\.authorAvatar/g, 'post.author_avatar');
content = content.replace(/post\.createdAt/g, 'post.created_at');
content = content.replace(/post\.mediaUrls/g, 'post.media_urls');

fs.writeFileSync('src/app/social/page.tsx', content);
console.log('Social UI patched for snake_case');
