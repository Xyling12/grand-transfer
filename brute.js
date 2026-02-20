const fs = require('fs');

let c = fs.readFileSync('src/data/cities.ts', 'utf8');

// The issue spans between `velikynovgorod.jpg" },` and `{ id: "сарапул"`
const nIdx = c.indexOf('velikynovgorod.jpg" },');
const sIdx = c.indexOf('{ id: "сарапул"');

if (nIdx !== -1 && sIdx !== -1) {
    const prior = c.substring(0, nIdx + 22);
    const post = c.substring(sIdx);

    const middle = `
    { id: "pskov", name: "Псков", namePrepositional: "Пскова", lat: 57.81, lon: 28.34, heroImage: "/images/cities/pskov.jpg" },
    { id: "воткинск", name: "Воткинск", namePrepositional: "Воткинска", lat: 57.0500, lon: 54.0000 },
    `;

    fs.writeFileSync('src/data/cities.ts', prior + middle + post);
    console.log("Brute force splice successful");
} else {
    console.log("Could not find anchor indices", nIdx, sIdx);
}
