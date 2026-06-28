const fs = require('fs');
let content = fs.readFileSync('src/app/social/page.tsx', 'utf8');

// Patch handleCreatePost to use snake_case
content = content.replace(/familyId: profile\.familyId,/g, 'family_id: profile.familyId,');
content = content.replace(/authorId: profile\.id,/g, 'author_id: profile.id,');
content = content.replace(/authorName: profile\.displayName,/g, 'author_name: profile.displayName,');
content = content.replace(/authorAvatar: profile\.avatarUrl \|\| "",/g, 'author_avatar: profile.avatarUrl || "",');
content = content.replace(/mediaUrls: \[\],/g, 'media_urls: [],');
content = content.replace(/createdAt: new Date\(\)\.toISOString\(\),/g, 'created_at: new Date().toISOString(),');

// The UI maps over posts: `posts?.map((post) => (`
// The UI expects camelCase for likes, e.g. `handleLike(post.id, post.likes)`
// But in DB, likes is an integer, so we should change it to JSONB array in DB to support the UI's `string[]`.

fs.writeFileSync('src/app/social/page.tsx', content);
console.log('Social patched');
