const fs = require('fs');
const path = require('path');

const sampleDir = 'c:\\Users\\HomePC\\Music\\jalaloaded\\sample';
const targetFile = 'c:\\Users\\HomePC\\Music\\jalaloaded\\app\\globals.css';

const files = [
  'jalaloaded_homepage.html',
  'jalaloaded_post_page.html',
  'jalaloaded_music_page.html',
  'jalaloaded_admin_create_post.html'
];

let finalCss = `@import "tailwindcss";

:root {
  --color-background-primary: #121212;
  --color-background-secondary: #1a1a1a;
  --color-background-tertiary: #0D0D0D;
  --color-border-secondary: rgba(255, 255, 255, 0.1);
  --color-border-tertiary: rgba(255, 255, 255, 0.05);
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.6);
  --color-text-tertiary: rgba(255, 255, 255, 0.4);
}

`;

for (const file of files) {
  const content = fs.readFileSync(path.join(sampleDir, file), 'utf8');
  const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
  if (styleMatch) {
    let css = styleMatch[1];
    // Remove the redundant google font imports from internal CSS, Layout component handles it
    css = css.replace(/@import url\('[^']+'\);/g, '');
    finalCss += `/* --- From ${file} --- */\n${css}\n\n`;
  }
}

fs.writeFileSync(targetFile, finalCss);
console.log('CSS merged successfully into globals.css');
