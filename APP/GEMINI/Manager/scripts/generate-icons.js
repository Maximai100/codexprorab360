// Простой генератор SVG иконок для PWA
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Создаём директорию если её нет
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Генерируем SVG для каждого размера
sizes.forEach(size => {
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">С</text>
</svg>`;
    
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
    console.log(`Created icon-${size}x${size}.svg`);
});

// Создаём PNG версии используя простой подход (для production лучше использовать sharp)
// Для разработки SVG будет достаточно, но создадим заглушки PNG
sizes.forEach(size => {
    // Копируем SVG как PNG заглушку (в production нужно конвертировать)
    const svgContent = fs.readFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`));
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), svgContent);
    console.log(`Created icon-${size}x${size}.png placeholder`);
});

console.log('Icons generated successfully!');
