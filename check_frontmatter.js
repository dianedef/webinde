const fs = require('fs').promises;
const path = require('path');

async function findMarkdownFiles(dir) {
    const files = await fs.readdir(dir);
    let mdFiles = [];

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            mdFiles = mdFiles.concat(await findMarkdownFiles(filePath));
        } else if (file.endsWith('.md')) {
            mdFiles.push(filePath);
        }
    }

    return mdFiles;
}

async function fixFrontmatter(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        let modified = false;

        // Vérifier si le fichier commence par ---
        if (!content.trimStart().startsWith('---')) {
            content = '---\n' + content;
            modified = true;
        }

        // Extraire le frontmatter
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
            console.log(`❌ Pas de frontmatter valide dans ${filePath}`);
            return;
        }

        const frontmatter = frontmatterMatch[1];
        let newFrontmatter = frontmatter;

        // Vérifier et corriger le format du title
        const titleMatch = frontmatter.match(/^title:\s*(.*)$/m);
        if (titleMatch) {
            const title = titleMatch[1].trim();
            if (!title.startsWith('"') || !title.endsWith('"')) {
                newFrontmatter = newFrontmatter.replace(
                    /^title:\s*(.*)$/m,
                    `title: "${title.replace(/^"|"$/g, '')}"`
                );
                modified = true;
            }
        } else {
            console.log(`❌ Pas de title dans ${filePath}`);
            return;
        }

        // Vérifier et corriger le format de la description
        const descMatch = frontmatter.match(/^description:\s*(.*)$/m);
        if (descMatch) {
            const desc = descMatch[1].trim();
            if (!desc.startsWith('"') || !desc.endsWith('"')) {
                newFrontmatter = newFrontmatter.replace(
                    /^description:\s*(.*)$/m,
                    `description: "${desc.replace(/^"|"$/g, '')}"`
                );
                modified = true;
            }
        } else {
            console.log(`❌ Pas de description dans ${filePath}`);
            return;
        }

        // Si des modifications sont nécessaires, mettre à jour le fichier
        if (modified) {
            const newContent = content.replace(
                /^---\s*\n[\s\S]*?\n---/,
                `---\n${newFrontmatter}\n---`
            );
            await fs.writeFile(filePath, newContent, 'utf8');
            console.log(`✅ Frontmatter corrigé dans ${filePath}`);
        } else {
            console.log(`✅ Frontmatter déjà correct dans ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Erreur avec le fichier ${filePath}:`, error);
    }
}

async function main() {
    try {
        const contentDir = path.join(__dirname, 'src', 'content', 'docs');
        const mdFiles = await findMarkdownFiles(contentDir);
        console.log(`🔍 ${mdFiles.length} fichiers Markdown trouvés`);

        for (const file of mdFiles) {
            await fixFrontmatter(file);
        }
        
        console.log('✨ Traitement terminé');
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

main(); 