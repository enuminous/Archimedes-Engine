'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), dest = path.join(root, 'dist');
require('./standalone.js');
fs.mkdirSync(dest, { recursive: true });
for (const file of ['index.html', 'Archimedes-Engine.html', 'observatory.html', 'styles.css', 'engine.js', 'app.js', 'observatory.js', 'icon.svg', '.nojekyll']) fs.copyFileSync(path.join(root, file), path.join(dest, file));
for (const dir of ['docs', 'examples', 'results']) fs.cpSync(path.join(root, dir), path.join(dest, dir), { recursive: true });
console.log('Static site written to dist/. No runtime dependencies.');
