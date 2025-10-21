// tailwind-build.js
const { execSync } = require('child_process');

try {
  execSync('npx tailwindcss -i ./src/index.css -o ./src/index.css --content ./src/**/*.{js,jsx,ts,tsx}');
  console.log('Tailwind CSS build successful.');
} catch (error) {
  console.error('Tailwind CSS build failed:', error.message);
}