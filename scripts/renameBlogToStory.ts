import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content
    .replace(/@\/models\/Blog/g, '@/models/Story')
    .replace(/import Blog from/g, 'import Story from')
    .replace(/\bBlog\b/g, 'Story')
    .replace(/\bblogs\b/g, 'stories')
    .replace(/\bblog\b/g, 'story')
    .replace(/\bBlogs\b/g, 'Stories')
    .replace(/\/api\/blog/g, '/api/stories')
    .replace(/\/blog\//g, '/stories/')
    .replace(/BlogSchema/g, 'StorySchema')
    .replace(/Blog\.find/g, 'Story.find')
    .replace(/Blog\.findOne/g, 'Story.findOne')
    .replace(/Blog\.create/g, 'Story.create')
    .replace(/newBlog/g, 'newStory');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.md')) {
      replaceInFile(fullPath);
    }
  }
}

// Rename specific directories and files first if they exist
const renames = [
  { from: 'src/app/blogs', to: 'src/app/stories' },
  { from: 'src/app/blog', to: 'src/app/stories' },
];

for (const { from, to } of renames) {
  const fromPath = path.join(process.cwd(), from);
  const toPath = path.join(process.cwd(), to);
  // We only rename src/app/blog and src/app/blogs if they exist
  if (fs.existsSync(fromPath)) {
    // Note: if 'stories' already exists, merging is required, but here we assume it doesn't
    if (fs.existsSync(toPath)) {
       // if from is src/app/blog and to is src/app/stories (which already exists from src/app/blogs)
       // move [slug] into stories
       const slugDir = path.join(fromPath, '[slug]');
       if (fs.existsSync(slugDir)) {
          fs.renameSync(slugDir, path.join(toPath, '[slug]'));
          fs.rmdirSync(fromPath);
       }
    } else {
      fs.renameSync(fromPath, toPath);
    }
    console.log(`Renamed ${fromPath} to ${toPath}`);
  }
}

// Now replace in all src/ files
walk(path.join(process.cwd(), 'src'));
