const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'server', 'api');

const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.php'));

files.forEach(file => {
    const filepath = path.join(apiDir, file);
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Split into lines
    let lines = content.split('\n');
    
    // Filter out all Access-Control lines
    lines = lines.filter(line => !line.trim().toLowerCase().startsWith("header('access-control-allow-") && !line.trim().toLowerCase().startsWith('header("access-control-allow-'));
    
    content = lines.join('\n');
    
    // Now insert the correct logic at the top
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

    // Insert after opening <?php OR after first line
    if (content.includes('<?php')) {
        content = content.replace('<?php', '<?php' + corsLogic);
    } else {
        content = '<?php' + corsLogic + content;
    }
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Deep cleaned and updated CORS in ${file}`);
});
