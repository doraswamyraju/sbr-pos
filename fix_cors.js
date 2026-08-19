const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'server', 'api');

const corsLogic = `
$allowed_origins = ['http://localhost:3000', 'https://rajugariventures.com', 'http://127.0.0.1:3000'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
`;

const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.php'));

files.forEach(file => {
    const filepath = path.join(apiDir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Remove existing CORS headers
    content = content.replace(/header\(['"]Access-Control-Allow-Origin:.*?\['"]\);/gi, '');
    content = content.replace(/header\(['"]Access-Control-Allow-Methods:.*?\['"]\);/gi, '');
    content = content.replace(/header\(['"]Access-Control-Allow-Headers:.*?\['"]\);/gi, '');
    content = content.replace(/header\(['"]Access-Control-Allow-Credentials:.*?\['"]\);/gi, '');
    
    // Insert new CORS logic after the opening <?php and any header('Content-Type: ...')
    if (content.includes('header(\'Content-Type: application/json\');')) {
        content = content.replace('header(\'Content-Type: application/json\');', "header('Content-Type: application/json');" + corsLogic);
    } else if (content.includes('header("Content-Type: application/json; charset=utf-8");')) {
        content = content.replace('header("Content-Type: application/json; charset=utf-8");', 'header("Content-Type: application/json; charset=utf-8");' + corsLogic);
    } else {
        content = content.replace('<?php', '<?php' + corsLogic);
    }
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated CORS in ${file}`);
});
