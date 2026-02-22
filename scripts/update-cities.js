const fs = require('fs');
const filePath = 'src/data/cities.ts';
const content = fs.readFileSync(filePath, 'utf8');
const updatedContent = content.replace(/\.jpg/g, '.webp');
fs.writeFileSync(filePath, updatedContent);
console.log('Successfully updated cities.ts images to webp');
