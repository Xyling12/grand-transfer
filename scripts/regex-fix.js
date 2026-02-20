const fs = require('fs');
let c = fs.readFileSync('src/data/cities.ts', 'utf8');
// Fix ANY sequence of backslash followed by n that is NOT a real newline
c = c.replace(/\\\\n/g, '\\n');
fs.writeFileSync('src/data/cities.ts', c);
console.log('Regex fixed cities.ts syntax');
