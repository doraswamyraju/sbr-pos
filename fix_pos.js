const fs = require('fs');
const path = require('path');
const configImport = "import { API_BASE_URL } from '../config';\n";

['src/pages/SalesMobile.jsx', 'src/pages/SalesDesktop.jsx', 'src/pages/Dashboard.jsx', 'src/App.js', 'src/App.jsx'].forEach(filepath => {
    let p = path.join(__dirname, filepath);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');
    let modified = false;

    const routeRegex = /(axios\.(get|post|put|delete)\()(["'])(\/server\/api\/[^\3]+)\3/g;
    if (routeRegex.test(content)) {
        content = content.replace(routeRegex, "$1`${API_BASE_URL}$4`");
        if (!content.includes(configImport)) {
            content = configImport + content;
        }
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(p, content, 'utf8');
        console.log('Modified', p);
    }
});
