const xlsx = require('xlsx');
const wb = xlsx.readFile('D:\\\\Antigravity\\\\2_5242559853137790132.xlsx');
console.log('Sheets:', wb.SheetNames);
for (let sheetName of wb.SheetNames) {
    console.log('\\n--- Sheet:', sheetName, '---');
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws);

    if (data.length > 0) {
        console.log('Row 0:', data[0]);
        console.log('Row 1:', data[1]);
        console.log('Row 10:', data[10]);
        console.log('Total rows:', data.length);
    } else {
        console.log('Empty sheet');
    }
}
