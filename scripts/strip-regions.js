const fs = require('fs');

try {
    // 1. Clean cities.ts
    let cities = fs.readFileSync('src/data/cities.ts', 'utf8');
    // Match space followed by ДНР, ЛНР, or Республика globally
    cities = cities.replace(/\s+(ДНР|ЛНР|Республика)/g, '');
    fs.writeFileSync('src/data/cities.ts', cities);

    // 2. Clean tariffs.ts
    let tariffs = fs.readFileSync('src/data/tariffs.ts', 'utf8');
    tariffs = tariffs.replace(/\s+(ДНР|ЛНР|Республика)/g, '');
    fs.writeFileSync('src/data/tariffs.ts', tariffs);

    console.log('Successfully stripped region suffixes from databases.');
} catch (e) {
    console.error('Error:', e);
}
