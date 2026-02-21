const fs = require('fs');

let tariffs = fs.readFileSync('src/data/tariffs.ts', 'utf8');
tariffs = tariffs.replace(/ДНр/g, 'ДНР');
fs.writeFileSync('src/data/tariffs.ts', tariffs);

let cities = fs.readFileSync('src/data/cities.ts', 'utf8');
cities = cities.replace(/ДНр/g, 'ДНР');
fs.writeFileSync('src/data/cities.ts', cities);

console.log('Fixed typos in both TS files');
