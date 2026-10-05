const fs = require('fs');
const path = require('path');

function patchReactText(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  // Replace the conflicting useEffect body in react-text that causes IME duplication
  code = code.replace(/e !== a\.children\[0\] && \(a\.children = \[e\], a\.onChange\(\)\);/g, '/* IME FIX: Prevent Slate text duplication during composition */');
  fs.writeFileSync(filePath, code);
  console.log(`Patched react-text: ${filePath}`);
}

function patchPlaitCommon(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  // Add 4px buffer to Canvas text measurement to prevent accidental DOM wrapping due to kerning differences
  code = code.replace(/return \{ width: finalWidth, height: finalHeight \};/g, 'return { width: finalWidth + 10, height: finalHeight };');
  fs.writeFileSync(filePath, code);
  console.log(`Patched plait-common: ${filePath}`);
}

const reactTextRoot = path.join(__dirname, '..', 'node_modules', '@plait-board', 'react-text');
if (fs.existsSync(reactTextRoot)) {
  patchReactText(path.join(reactTextRoot, 'index.mjs'));
  patchReactText(path.join(reactTextRoot, 'index.js'));
  patchReactText(path.join(reactTextRoot, 'fesm2022', 'plait-board-react-text.mjs'));
}

const plaitCommonRoot = path.join(__dirname, '..', 'node_modules', '@plait', 'common');
if (fs.existsSync(plaitCommonRoot)) {
  patchPlaitCommon(path.join(plaitCommonRoot, 'fesm2022', 'plait-common.mjs'));
  patchPlaitCommon(path.join(plaitCommonRoot, 'fesm2015', 'plait-common.mjs'));
}
