import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = './src/data';
const tagsSet = new Set();

async function findMarkdownFiles(dir) {
  const files = await fs.readdir(dir);
  const markdownFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      const nestedFiles = await findMarkdownFiles(filePath);
      markdownFiles.push(...nestedFiles);
    } else if (file.endsWith('.md')) {
      markdownFiles.push(filePath);
    }
  }

  return markdownFiles;
}

function extractFrontmatterTags(content) {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return [];

  const frontmatter = frontmatterMatch[1];
  let tags = [];
  
  const patterns = [
    {
      pattern: /tags:\s*\n(\s+-\s+[^\n]+\n)+/,
      extract: (match) => match[0]
        .split('\n')
        .map(line => line.replace(/^\s*-\s*/, '').trim())
        .filter(line => line && !line.startsWith('tags:'))
    },
    {
      pattern: /tags:\s*\[(.*?)\]/,
      extract: (match) => match[1]
        .split(',')
        .map(tag => tag.trim().replace(/['"]/g, ''))
        .filter(Boolean)
    },
    {
      pattern: /tags:\s*([^\n\[]+)\n/,
      extract: (match) => [match[1].trim()]
    }
  ];

  for (const { pattern, extract } of patterns) {
    const match = frontmatter.match(pattern);
    if (match) {
      tags = extract(match);
      break;
    }
  }

  return tags.map(tag => tag.replace(/['"]/g, '').trim());
}

async function extractTags() {
  try {
    const files = await findMarkdownFiles(DATA_DIR);
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const tags = extractFrontmatterTags(content);
      tags.filter(tag => tag.trim()).forEach(tag => tagsSet.add(tag));
    }

    const sortedTags = Array.from(tagsSet).sort();
    await fs.writeFile('scripts/tags.json', JSON.stringify(sortedTags, null, 2));

  } catch (error) {
    console.error('Erreur:', error);
  }
}

extractTags(); 