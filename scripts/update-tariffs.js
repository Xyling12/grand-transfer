const fs = require('fs');
const path = require('path');

const tariffsPath = path.join(__dirname, '..', 'src', 'data', 'tariffs.ts');
let content = fs.readFileSync(tariffsPath, 'utf8');

// Add comfort to the interface
if (!content.includes('comfort: number;')) {
    content = content.replace('comfortPlus: number;', 'comfort: number;\n    comfortPlus: number;');
}

// Add comfort to all cities
content = content.replace(/"standart": (\d+),/g, (match, p1) => {
    const comfortPrice = p1 === '30' ? 35 : p1 === '90' ? 90 : parseInt(p1) + 5;
    return `"standart": ${p1},\n        "comfort": ${comfortPrice},`;
});

fs.writeFileSync(tariffsPath, content);
console.log('Successfully updated tariffs.ts');
