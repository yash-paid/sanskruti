import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'upload-profiles-here');
const targetDir = path.join(__dirname, 'public', 'assets', 'profiles');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created upload folder:', uploadDir);
}

const files = fs.readdirSync(uploadDir).filter(f => !f.endsWith('.txt') && !f.startsWith('.'));

console.log(`Found ${files.length} photo(s) in upload folder.`);

const mapping = {
  '1.jpg': 'simran.jpg',
  '2.jpg': 'uma.jpg',
  '3.jpg': 'alina.jpg',
  '4.jpg': 'neha.jpg',
  '5.jpg': 'riya.jpg',
  '6.jpg': 'priya.jpg',
  '7.jpg': 'aarohi.jpg',
  '8.jpg': 'nikita.jpg',
  '9.jpg': 'palak.jpg',
  '10.jpg': 'ritika.jpg',
  '11.jpg': 'rambha.jpg',
  '12.jpg': 'kaju.jpg',
  '13.jpg': 'ananya.jpg',
  '14.jpg': 'kavya.jpg',
  '15.jpg': 'megha.jpg',
  '16.jpg': 'pooja.jpg',
  '17.jpg': 'shruti.jpg',
  '18.jpg': 'divya.jpg',
  '19.jpg': 'ishita.jpg',
  '20.jpg': 'naina.jpg',
  '21.jpg': 'tanya.jpg',
  '22.jpg': 'roshni.jpg',
  '23.jpg': 'swati.jpg',
  '24.jpg': 'meera.jpg',
  '25.jpg': 'anjali.jpg',
  '26.jpg': 'sana.jpg',
  '27.jpg': 'aisha.jpg',
  '28.jpg': 'aditi.jpg',
  '29.jpg': 'tara.jpg',
  '30.jpg': 'diya.jpg',
};

let copied = 0;
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const baseName = file.toLowerCase();

  // If named 1.jpg, 2.png etc.
  const targetName = mapping[baseName] || file;

  const srcPath = path.join(uploadDir, file);
  const destPath = path.join(targetDir, targetName);

  fs.copyFileSync(srcPath, destPath);
  console.log(`✓ Copied: ${file} -> ${targetName}`);
  copied++;
}

console.log(`Successfully synced ${copied} photos to public/assets/profiles!`);

