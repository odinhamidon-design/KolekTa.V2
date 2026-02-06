/**
 * Copy vendor library dist files from node_modules to public/vendor/
 * Run: node scripts/copy-vendor.js
 * Also runs automatically via "postinstall" in package.json
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public', 'vendor');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  const srcPath = path.join(__dirname, '..', 'node_modules', src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  SKIP (not found): ${src}`);
    return;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(srcPath, dest);
  console.log(`  ${src} -> ${path.relative(path.join(__dirname, '..'), dest)}`);
}

function copyDir(src, dest) {
  const srcPath = path.join(__dirname, '..', 'node_modules', src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  SKIP dir (not found): ${src}`);
    return;
  }
  ensureDir(dest);
  const entries = fs.readdirSync(srcPath, { withFileTypes: true });
  for (const entry of entries) {
    const srcEntry = path.join(srcPath, entry.name);
    const destEntry = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(path.join(src, entry.name), destEntry);
    } else {
      fs.copyFileSync(srcEntry, destEntry);
      console.log(`  ${path.join(src, entry.name)} -> ${path.relative(path.join(__dirname, '..'), destEntry)}`);
    }
  }
}

console.log('Copying vendor files to public/vendor/...\n');

// Leaflet
console.log('[Leaflet]');
copyFile('leaflet/dist/leaflet.css', path.join(PUBLIC, 'leaflet', 'leaflet.css'));
copyFile('leaflet/dist/leaflet.js', path.join(PUBLIC, 'leaflet', 'leaflet.js'));
copyDir('leaflet/dist/images', path.join(PUBLIC, 'leaflet', 'images'));

// Leaflet Routing Machine
console.log('\n[Leaflet Routing Machine]');
copyFile('leaflet-routing-machine/dist/leaflet-routing-machine.css', path.join(PUBLIC, 'leaflet-routing-machine', 'leaflet-routing-machine.css'));
copyFile('leaflet-routing-machine/dist/leaflet-routing-machine.js', path.join(PUBLIC, 'leaflet-routing-machine', 'leaflet-routing-machine.js'));

// Leaflet Heat
console.log('\n[Leaflet Heat]');
copyFile('leaflet.heat/dist/leaflet-heat.js', path.join(PUBLIC, 'leaflet-heat', 'leaflet-heat.js'));

// jsPDF
console.log('\n[jsPDF]');
copyFile('jspdf/dist/jspdf.umd.min.js', path.join(PUBLIC, 'jspdf', 'jspdf.umd.min.js'));

// jsPDF AutoTable
console.log('\n[jsPDF AutoTable]');
copyFile('jspdf-autotable/dist/jspdf.plugin.autotable.min.js', path.join(PUBLIC, 'jspdf', 'jspdf.plugin.autotable.min.js'));

// Chart.js
console.log('\n[Chart.js]');
copyFile('chart.js/dist/chart.umd.js', path.join(PUBLIC, 'chartjs', 'chart.umd.js'));

// Lucide Icons
console.log('\n[Lucide]');
copyFile('lucide/dist/umd/lucide.min.js', path.join(PUBLIC, 'lucide', 'lucide.min.js'));

console.log('\nDone! Vendor files copied to public/vendor/');
