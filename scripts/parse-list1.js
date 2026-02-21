const xlsx = require('xlsx');
const fs = require('fs');
const wb = xlsx.readFile('D:\\\\Antigravity\\\\2_5242559853137790132.xlsx');
const ws = wb.Sheets['Лист1'];
const data = xlsx.utils.sheet_to_json(ws);

const cityTariffs = {};

data.forEach(row => {
    // Keys in the Sheet might have trailing/leading spaces
    const cleanRow = {};
    for (let k in row) {
        cleanRow[k.trim()] = row[k];
    }

    if (cleanRow['Города']) {
        const city = cleanRow['Города'].trim();
        // Skip some rows if they are just headers or have no price data
        if (cleanRow['эконом'] || cleanRow['стандарт']) {
            cityTariffs[city] = {
                econom: cleanRow['эконом'] || 25,
                standart: cleanRow['стандарт'] || 30,
                comfortPlus: cleanRow['комфорт+'] || cleanRow['комфорт'] || 35,
                business: cleanRow['бизнес'] || 40,
                minivan: cleanRow['минивэн'] || 45,
                soberDriver: cleanRow['трезвый водитель'] || 120 // Fallback if missing
            };
        }
    }
});

let tsContent = `// Auto-generated tariffs based on user Excel spreadsheet ("Лист1")
export interface CityTariffs {
    econom: number;
    standart: number;
    comfortPlus: number;
    business: number;
    minivan: number;
    soberDriver: number;
}

export const cityTariffs: Record<string, CityTariffs> = ${JSON.stringify(cityTariffs, null, 4)};\n`;

fs.writeFileSync('./src/data/tariffs.ts', tsContent, 'utf-8');
console.log('Successfully re-generated src/data/tariffs.ts with', Object.keys(cityTariffs).length, 'cities from Лист1');
