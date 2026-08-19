import os
import re

config_import = "import { API_BASE_URL } from '../config';\n"

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified = False

            # fix any axios.get("/server/...") and similar cases
            if re.search(r'axios\.\w+\(["\'](?:/[^/]+)?/server/api/', content):
                content = re.sub(r'(axios\.\w+\()["\'](?:/[^/]+)?/server/api/(.*?)(?:["\'])', r'\1${API_BASE_URL}/server/api/\2', content)
                if 'import { API_BASE_URL }' not in content:
                    content = config_import + content
                modified = True

            # fix convert_lead url
            if 'apiConvertUrl="/' in content:
                content = re.sub(r'apiConvertUrl=["\'][^"\']*/server/api/([^"\']*)["\']', r'apiConvertUrl={${API_BASE_URL}/server/api/\1}', content)
                if 'import { API_BASE_URL }' not in content:
                    content = config_import + content
                modified = True

            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
