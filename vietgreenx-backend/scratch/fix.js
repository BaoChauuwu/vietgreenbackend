const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/database/migrations/1784614568600-AddAdminNoteToCertifications.ts');
const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
const newLines = lines.filter(line => !line.includes('"location"'));
fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
console.log('Fixed migration!');
