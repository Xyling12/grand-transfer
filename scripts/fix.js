const fs = require('fs');

let content = fs.readFileSync('src/data/cities.ts', 'utf8');

// The exact substring causing the error is `\\n    { id: "воткинск"` 
// We will replace the literal backslash followed by 'n' with an actual newline

const fixingString = 'pskov.jpg" },\\\\n    { id: "воткинск",';
const replacementString = 'pskov.jpg" },\\n    { id: "воткинск",';

if (content.includes(fixingString)) {
    content = content.replace(fixingString, replacementString);
    fs.writeFileSync('src/data/cities.ts', content);
    console.log("Replaced literal backslash-n successfully.");
} else {
    // try a more generic replace if it's just raw '\\n' 
    if (content.includes('\\\\n    { id: "воткинск"')) {
        content = content.replace('\\\\n    { id: "воткинск"', '\\n    { id: "воткинск"');
        fs.writeFileSync('src/data/cities.ts', content);
        console.log("Replaced generic backslash-n successfully.");
    } else {
        console.log("Could not find the target string.");
        // Dump a slice of the file to see exactly what's there
        const idx = content.indexOf('pskov');
        console.log(content.slice(idx, idx + 200));
    }
}
