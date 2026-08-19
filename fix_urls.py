import os
import re

config_import = "import { API_BASE_URL } from '../config';\n"

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            modified = False

            # Replace const API_BASE_URL
            const_pattern = r"const\s+API_BASE_URL\s*=\s*'https://rajugariventures\.com/sbr-pos';\n?"
            if re.search(const_pattern, content):
                content = re.sub(const_pattern, "", content)
                content = config_import + content
                modified = True

            # Replace explicit http://localhost
            localhost_pattern = r"'http://localhost/pos-system([^']*)'"
            if re.search(localhost_pattern, content):
                content = re.sub(localhost_pattern, r"API_BASE_URL + '\1'", content)
                if config_import not in content:
                    content = config_import + content
                modified = True

            # Replace in backticks
            localhost_template_pattern = r"http://localhost/pos-system"
            if 'http://localhost/pos-system' in content or '${API_BASE_URL}' not in content and 'http://localhost/pos-system' in content:
                content = content.replace('http://localhost/pos-system', '')
                if config_import not in content:
                    content = config_import + content
                modified = True

            # Leads.jsx uses /server/api/leads.php without host
            if file == 'Leads.jsx':
                content = content.replace('"/server/api/leads.php"', '${API_BASE_URL}/server/api/leads.php')
                content = content.replace('"/server/api/users.php"', '${API_BASE_URL}/server/api/users.php')
                content = content.replace('"/server/api/products.php"', '${API_BASE_URL}/server/api/products.php')
                content = content.replace('/server/api/leads.php?id=', '${API_BASE_URL}/server/api/leads.php?id=')
                content = content.replace('apiConvertUrl="/server/api/convert_lead.php"', 'apiConvertUrl={${API_BASE_URL}/server/api/convert_lead.php}')
                if config_import not in content:
                    content = config_import + content
                modified = True
            
            # POS.jsx / POS dashboard endpoints often use /server/api/
            if file == 'POS.jsx' or file == 'POSLayout.jsx' or file == 'POSDashboard.jsx':
                # Just find axios calls with /server/api and prefix them if needed
                if config_import not in content:
                    content = config_import + content
                content = content.replace("axios.get('/server/api", "axios.get(${API_BASE_URL}/server/api")
                content = content.replace("axios.post('/server/api", "axios.post(${API_BASE_URL}/server/api")
                content = content.replace('axios.post("/server/api', 'axios.post(${API_BASE_URL}/server/api')
                modified = True

            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
