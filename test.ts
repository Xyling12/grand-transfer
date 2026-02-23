import { cities } from './src/data/cities';
const noginsk = cities.find(c => c.id === 'ногинск');
console.log("Noginsk:", noginsk);
console.log("Noginsk encoding test:", encodeURIComponent('ногинск'));
