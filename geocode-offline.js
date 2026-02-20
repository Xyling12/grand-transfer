const fs = require('fs');

async function main() {
    console.log("Loading tariffs and existing cities...");

    const tariffsTs = fs.readFileSync('./src/data/tariffs.ts', 'utf-8');
    const cityMatches = [...tariffsTs.matchAll(/"([^"]+)": {/g)].map(m => m[1]);

    const citiesTs = fs.readFileSync('./src/data/cities.ts', 'utf-8');
    const rawCitiesMatch = citiesTs.match(/const rawCities:\s*CityData\[\]\s*=\s*\[([\s\S]*?)\];/);
    if (!rawCitiesMatch) return;

    const existingNames = [...rawCitiesMatch[1].matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
    const missingCities = cityMatches.filter(c => !existingNames.includes(c));

    console.log(`Need to geocode ${missingCities.length} missing cities.`);

    console.log("Downloading russian cities database...");
    const req = await fetch('https://raw.githubusercontent.com/pensnarik/russian-cities/master/russian-cities.json');
    const ruCities = await req.json();

    let newCitiesTs = "";

    for (const city of missingCities) {
        // Try to find in offline DB
        const match = ruCities.find(c => c.name.toLowerCase() === city.toLowerCase());

        let lat = 55.75; // fallback to moscow approx
        let lon = 37.61;

        if (match && match.coords) {
            lat = parseFloat(match.coords.lat);
            lon = parseFloat(match.coords.lon);
        } else {
            console.warn(`Coords not found for ${city}, using Moscow default.`);
        }

        const id = city.toLowerCase().replace(/[^a-zа-я0-9]/gi, '_');
        let prep = city;
        if (city.endsWith('а')) prep = city.slice(0, -1) + 'ы';
        else if (city.endsWith('я')) prep = city.slice(0, -1) + 'и';
        else if (city.endsWith('ь')) prep = city.slice(0, -1) + 'и';
        else prep = city + 'а';

        newCitiesTs += `    { id: "${id}", name: "${city}", namePrepositional: "${prep}", lat: ${lat.toFixed(4)}, lon: ${lon.toFixed(4)} },\n`;
    }

    fs.writeFileSync('./missing-cities.txt', newCitiesTs, 'utf-8');
    console.log(`Generated TS definitions for ${missingCities.length} cities and saved to missing-cities.txt`);
}

main();
