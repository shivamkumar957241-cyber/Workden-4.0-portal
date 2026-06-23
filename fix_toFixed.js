import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // To avoid double replacement if I run it twice, let's remove any existing Number() wrapping around the same pattern, 
  // but it's easier to just do it once.
  
  // For `(u.wallet_balance || 0).toFixed(2)`
  // regex: \(([^()]+)\)\.toFixed\(
  content = content.replace(/\(([^()]+)\)\.toFixed\(/g, '(Number($1) || 0).toFixed(');
  
  // For `amount.toFixed(2)` or `txn.new_balance.toFixed(2)`
  // regex: ([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\.toFixed\(
  content = content.replace(/([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\.toFixed\(/g, '(Number($1) || 0).toFixed(');

  // For `txn.new_balance?.toFixed(2)`
  content = content.replace(/([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\?\.toFixed\(/g, '(Number($1) || 0).toFixed(');

  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      fixFile(fullPath);
    }
  }
}

walkDir(path.join(process.cwd(), 'src'));
console.log('Fixed toFixed issues in all jsx files!');
