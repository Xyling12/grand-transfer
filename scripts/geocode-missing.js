const fs = require('fs');

async function main() {
    console.log("Loading tariffs and existing cities...");

    const tariffsTs = fs.readFileSync('./src/data/tariffs.ts', 'utf-8');
    const cityMatches = [...tariffsTs.matchAll(/"([^"]+)": {/g)].map(m => m[1]);
    console.log(`Found ${cityMatches.length} cities in tariffs.ts`);

    const citiesTs = fs.readFileSync('./src/data/cities.ts', 'utf-8');
    const rawCitiesMatch = citiesTs.match(/const rawCities:\s*CityData\[\]\s*=\s*\[([\s\S]*?)\];/);
    if (!rawCitiesMatch) {
        console.error("Could not parse rawCities from cities.ts");
        return;
    }

    const existingNames = [...rawCitiesMatch[1].matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
    console.log(`Found ${existingNames.length} existing cities in cities.ts`);

    const missingCities = cityMatches.filter(c => !existingNames.includes(c));
    console.log(`Need to geocode ${missingCities.length} missing cities.`);

    let newCitiesTs = "";
    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < missingCities.length; i++) {
        const city = missingCities[i];
        console.log(`Fetching coords for ${city}... (${i + 1}/${missingCities.length})`);

        try {
            await delay(1200);

            const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Россия')}&format=json&limit=1`;

            const req = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'GrandTransferAppBot/1.0 (test@example.com)'
                }
            });
            const data = await req.json();

            let lat = 0;
            let lon = 0;
            if (data && data.length > 0) {
                lat = parseFloat(data[0].lat);
                lon = parseFloat(data[0].lon);
            } else {
                console.warn(`Coords not found for ${city}, using 0,0 default.`);
            }

            const id = city.toLowerCase().replace(/[^a-zа-я0-9]/gi, '_');
            let prep = city;
            if (city.endsWith('а')) prep = city.slice(0, -1) + 'ы';
            else if (city.endsWith('я')) prep = city.slice(0, -1) + 'и';
            else if (city.endsWith('ь')) prep = city.slice(0, -1) + 'и';
            else prep = city + 'а';

            newCitiesTs += `    { id: "${id}", name: "${city}", namePrepositional: "${prep}", lat: ${lat.toFixed(4)}, lon: ${lon.toFixed(4)} },\n`;

        } catch (e) {
            console.error(`Error for ${city}:`, e.message);
        }
    }

    console.log("\nDone fetching! New items to append:");
    fs.writeFileSync('./missing-cities.txt', newCitiesTs, 'utf-8');
    console.log(newCitiesTs);
}

main();
