import fs from 'fs';
import path from 'path';

// Files that have desktop nav with "Kurslarım" -> "Chef Sosyal" pattern
// We need to insert Culi link between them

const srcDir = 'c:/Users/Kayaa/OneDrive/Masaüstü/gastrofolly/src';

function findTsxFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            results = results.concat(findTsxFiles(filePath));
        } else if (file.endsWith('.tsx')) {
            results.push(filePath);
        }
    }
    return results;
}

const culiLink = `                    <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">
                      Culi
                    </Link>`;

const culiLinkSmallIndent = `                <Link href="/culi" className="text-gray-300 hover:text-white transition-colors">
                  Culi
                </Link>`;

let modifiedCount = 0;
const files = findTsxFiles(srcDir);

for (const file of files) {
    // Skip the culi page itself
    if (file.includes('culi' + path.sep + 'page.tsx')) continue;

    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Pattern: After "Kurslarım</Link>" or after Panelim link, before "Chef Sosyal"
    // We need to find the Chef Sosyal link and add Culi before it if not already present

    if (content.includes('Culi</Link>') || content.includes('>Culi<')) continue; // Already has Culi
    if (!content.includes('Chef Sosyal')) continue; // No Chef Sosyal nav

    // Find all lines
    const lines = content.split('\n');
    const newLines = [];
    let inserted = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Look for Chef Sosyal link in nav
        if (line.includes('href="/chef-sosyal"') && line.includes('text-gray-300') && !inserted) {
            // Determine indentation from the Chef Sosyal line
            const indent = line.match(/^(\s*)/)[1];
            const culiLine = `${indent}<Link href="/culi" className="text-gray-300 hover:text-white transition-colors">`;

            // Find the full Chef Sosyal link (may span multiple lines)
            // Insert Culi link before it with same indentation pattern

            // Look at the line to determine if it's a single line or multi-line link
            if (line.includes('Chef Sosyal</Link>')) {
                // Single line
                newLines.push(`${indent}<Link href="/culi" className="text-gray-300 hover:text-white transition-colors">Culi</Link>`);
                newLines.push(line);
            } else {
                // Multi-line: insert complete Culi block
                // Find inner indent (next line)
                const innerIndent = indent + '  ';
                newLines.push(`${indent}<Link href="/culi" className="text-gray-300 hover:text-white transition-colors">`);
                newLines.push(`${innerIndent}Culi`);
                newLines.push(`${indent}</Link>`);
                newLines.push(line);
            }
            inserted = true;
        } else {
            newLines.push(line);
        }
    }

    if (inserted) {
        const newContent = newLines.join('\n');
        fs.writeFileSync(file, newContent, 'utf8');
        modifiedCount++;
        console.log(`Modified: ${file}`);
    }
}

console.log(`\nTotal files modified: ${modifiedCount}`);
