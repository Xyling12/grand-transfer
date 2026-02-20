const fs = require('fs');
const missing = fs.readFileSync('missing-cities.txt', 'utf8');
const cities = fs.readFileSync('src/data/cities.ts', 'utf8');

// The original array closes with:
//     { id: "pskov", name: "Псков", namePrepositional: "Пскова", lat: 57.81, lon: 28.34, heroImage: "/images/cities/pskov.jpg" }
// ];

// Replace the closing bracket with a comma and the missing cities, then close it again
const newCities = cities.replace(
    '};\\n];',
    '},\\n' + missing + '];' // Fallback
).replace(
    // More robust replace for the array end
    /(\s*\{\s*id:\s*"[^"]+",[^}]+\}\s*)\n\];/,
    '$1,\\n' + missing + '];'
);

fs.writeFileSync('src/data/cities.ts', newCities);
console.log('Appended missing cities to cities.ts');
