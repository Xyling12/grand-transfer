const fs = require('fs');
const filePath = 'src/data/cities.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Strip the property assignment in the array objects
content = content.replace(/,\s*heroImage:\s*\"[^\"]+\"/g, '');

// Strip the property definition in the interface (both optional and required forms just in case)
content = content.replace(/\s*heroImage\?:\s*string;/g, '');
content = content.replace(/\s*heroImage:\s*string;/g, '');

fs.writeFileSync(filePath, content);
console.log('Successfully stripped heroImage from cities.ts');
