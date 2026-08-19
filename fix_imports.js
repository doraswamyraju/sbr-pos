const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walkDir(rootDir);

files.forEach(filepath => {
    if (filepath === path.join(rootDir, 'config.js')) return;

    let content = fs.readFileSync(filepath, 'utf8');
    let relativeFromSrc = path.relative(rootDir, filepath);
    let parts = relativeFromSrc.split(path.sep);
    
    // Calculate depth to src/config.js
    // parts: ['pages', 'Leads.jsx'] -> depth 1 -> '../config'
    // parts: ['components', 'common', 'Sidebar.jsx'] -> depth 2 -> '../../config'
    // parts: ['App.js'] -> depth 0 -> './config'
    
    let depth = parts.length - 1;
    let correctImport;
    if (depth === 0) {
        correctImport = "from './config'";
    } else {
        correctImport = "from '" + "../".repeat(depth) + "config'";
    }

    // Replace any variation of import { API_BASE_URL } from ...
    const importRegex = /import\s*{\s*API_BASE_URL\s*}\s*from\s*['"][^'"]+['"]/g;
    
    if (importRegex.test(content)) {
        let newContent = content.replace(importRegex, `import { API_BASE_URL } ${correctImport}`);
        if (newContent !== content) {
            fs.writeFileSync(filepath, newContent, 'utf8');
            console.log(`Fixed import in ${relativeFromSrc}: ${correctImport}`);
        }
    }
});
