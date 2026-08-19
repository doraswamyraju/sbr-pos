const fs = require('fs');
const path = require('path');

const configImport = "import { API_BASE_URL } from '../config';\n";
const rootDir = path.join(__dirname, 'src');

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

const files = walkDir(rootDir);

files.forEach(filepath => {
    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;

    // 1. Remove hardcoded const API_BASE_URL
    const constRegex = /const\s+API_BASE_URL\s*=\s*'https:\/\/rajugariventures\.com\/sbr-pos';\r?\n?/g;
    if (constRegex.test(content)) {
        content = content.replace(constRegex, '');
        if (!content.includes(configImport)) {
            content = configImport + content;
        }
        modified = true;
    }

    // 2. Replace hardcoded http://localhost string inside single quotes
    const localhostQuoteRegex = /'http:\/\/localhost\/pos-system([^']*)'/g;
    if (localhostQuoteRegex.test(content)) {
        content = content.replace(localhostQuoteRegex, "API_BASE_URL + '$1'");
        if (!content.includes(configImport)) {
            content = configImport + content;
        }
        modified = true;
    }

    // 3. Replace inside backticks or template literals
    if (content.includes('`http://localhost/pos-system') || (!content.includes('`${API_BASE_URL}') && content.includes('http://localhost/pos-system'))) {
        content = content.replace(/http:\/\/localhost\/pos-system/g, '${API_BASE_URL}');
        if (!content.includes(configImport)) {
            content = configImport + content;
        }
        modified = true;
    }

    const filename = path.basename(filepath);

    // 4. Leads.jsx / POS endpoints explicit paths
    if (['Leads.jsx', 'POS.jsx', 'POSLayout.jsx', 'POSDashboard.jsx', 'TaskManagement.jsx', 'Customers.jsx'].includes(filename)) {
        const routeRegex = /(axios\.(get|post|put|delete)\()(["'])(\/server\/api\/[^\3]+)\3/g;
        if (routeRegex.test(content)) {
            content = content.replace(routeRegex, "$1`${API_BASE_URL}$4`");
            if (!content.includes(configImport)) {
                content = configImport + content;
            }
            modified = true;
        }

        const urlRegex = /apiConvertUrl=(["'])(\/server\/api\/[^\1]+)\1/g;
        if (urlRegex.test(content)) {
            content = content.replace(urlRegex, "apiConvertUrl={`\\$\\{API_BASE_URL\\}$2`}"); // escape the template string in replace
            // Actually simpler:
            content = content.replace(/apiConvertUrl="\/server\/api\/convert_lead\.php"/g, "apiConvertUrl={`${API_BASE_URL}/server/api/convert_lead.php`}");
            if (!content.includes(configImport)) {
                content = configImport + content;
            }
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Modified', filepath);
    }
});
