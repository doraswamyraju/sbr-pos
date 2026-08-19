const fs = require('fs');
const path = require('path');

const configImport = "import { API_BASE_URL } from '../config';\n";
const configImportDeep = "import { API_BASE_URL } from '../../config';\n";

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir(path.join(__dirname, 'src'));

files.forEach(filepath => {
    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;

    // determine correct import path based on depth
    let depth = filepath.split(path.sep).length - path.join(__dirname, 'src').split(path.sep).length;
    let imp = depth > 1 ? configImportDeep : configImport;

    // Match any axios call with /sbr-pos/server/
    const axiosRegex = /(axios\.(get|post|put|delete)\()(["'`])\/sbr-pos\/server\/api\/([^\3]+?)\3/g;
    if (axiosRegex.test(content)) {
        content = content.replace(axiosRegex, (match, prefix, method, quote, route) => {
            return prefix + '`' + '${API_BASE_URL}/server/api/' + route + '`';
        });
        modified = true;
    }

    // Match explicit apiConvertUrl="/sbr-pos/server/..."
    if (content.includes('="/sbr-pos/server/api/')) {
        content = content.replace(/="\/sbr-pos\/server\/api\/([^"]+)"/g, '={`\\${API_BASE_URL}/server/api/$1`}');
        modified = true;
    }

    // fallback for /sbr-pos/server/api in components/ExcelImport.jsx
    if (content.includes("'/sbr-pos/server/api'")) {
        content = content.replace(/'\/sbr-pos\/server\/api'/g, 'API_BASE_URL + "/server/api"');
        modified = true;
    }

    if (modified) {
        // Only inject if not already present
        if (!content.includes('const API_BASE_URL') && !content.includes('{ API_BASE_URL }')) {
            content = imp + content;
        }
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Fixed', filepath);
    }
});
