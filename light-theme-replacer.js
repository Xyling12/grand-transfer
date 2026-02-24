const fs = require('fs');
const path = require('path');

const cssDir = 'D:\\Antigravity\\grand-transfer-light\\src\\components';

function processFile(filePath) {
    if (!filePath.endsWith('.css')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Replace dark transparent backgrounds with light ones
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.03\)/g, 'rgba(0, 0, 0, 0.03)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'rgba(0, 0, 0, 0.05)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.07\)/g, 'rgba(0, 0, 0, 0.07)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'rgba(0, 0, 0, 0.08)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, 'var(--color-border)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.2\)/g, 'rgba(0, 0, 0, 0.1)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.3\)/g, 'rgba(0, 0, 0, 0.3)');
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.7\)/g, 'rgba(0, 0, 0, 0.6)');

    // Replace strict dark colors
    content = content.replace(/rgba\(12,\s*10,\s*9,\s*0\.98\)/g, '#FFFFFF');
    content = content.replace(/rgba\(12,\s*10,\s*9,\s*0\.95\)/g, '#FFFFFF');
    content = content.replace(/#0C0A09/gi, '#FFFFFF');
    content = content.replace(/#1C1917/gi, '#F3F4F6');
    content = content.replace(/#000000/g, '#FFFFFF');
    content = content.replace(/#1a1a1a/gi, '#F9FAFB');

    // Text colors
    content = content.replace(/#A8A29E/g, 'var(--color-text-muted)');
    content = content.replace(/color:\s*#fff/g, 'color: #111111');
    content = content.replace(/color:\s*#ffffff/gi, 'color: #111111');
    // Button text colors exception: btn-primary usually needs dark text on yellow, which is #11111. Wait, #fff -> #111111 does that.

    content = content.replace(/text-shadow:\s*0\s*0\s*20px\s*rgba\(202,\s*138,\s*4,\s*0\.2\);/g, 'text-shadow: none;');

    fs.writeFileSync(filePath, content);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

walkDir(cssDir);
console.log('CSS dark patterns replaced.');
