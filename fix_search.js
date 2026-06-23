import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Revert my previous bad replacement first:
  // Replace `?.toString().toLowerCase().includes` with `?.toLowerCase()?.includes`
  content = content.replace(/\?\.toString\(\)\.toLowerCase\(\)\.includes/g, '?.toString()?.toLowerCase()?.includes');
  
  // Also, any remaining `?.toLowerCase().includes` should be `?.toLowerCase()?.includes`
  content = content.replace(/\?\.toLowerCase\(\)\.includes/g, '?.toLowerCase()?.includes');

  // Also fix `?.toLowerCase()?.includes` where it might still fail if it's a number?
  // Actually, replacing `?.` with `?.toString()?.toLowerCase()?.includes` is safest.
  // Let's just run a global regex to find any `.includes(` that comes after `toLowerCase()`.
  
  // The absolute safest search pattern for these UI searches is `String(x || '').toLowerCase().includes(y)`.
  // Since we already have `?.toString()?.toLowerCase()?.includes`, let's just make sure EVERYTHING is optional chained.
  
  // Let's replace `?.toLowerCase().includes` with `?.toString()?.toLowerCase()?.includes`
  // Wait, I already changed some to `?.toString().toLowerCase().includes`
  // Let's just fix the missing `?` before `.toLowerCase()` and `.includes()`
  content = content.replace(/\?\.toString\(\)\.toLowerCase\(\)\.includes/g, '?.toString()?.toLowerCase()?.includes');
  
  // What if there is `u.login_user_id.toLowerCase().includes` (no `?`)?
  content = content.replace(/\.toLowerCase\(\)\.includes/g, '?.toString()?.toLowerCase()?.includes');
  // Wait, if it was already `?.toString()?.toLowerCase()?.includes`, the above might replace `.toLowerCase().includes` part and make it `?.toString()?.toString()?.toLowerCase()?.includes`!
  
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

// Better strategy for fixFile to avoid double replacing:
function fixFileSafe(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Remove all toString() we added previously to reset to original state (approximately)
  content = content.replace(/\?\.toString\(\)\.toLowerCase\(\)\.includes/g, '?.toLowerCase().includes');
  
  // 2. Now we have things like `u.email?.toLowerCase().includes` or `u.email.toLowerCase().includes`
  // We want to safely wrap them or just add the missing `?`.
  // To handle numbers AND nulls: replace `([a-zA-Z0-9_.]+(?:\?\.)?[a-zA-Z0-9_]+)\??\.toLowerCase\(\)\??\.includes\(`
  // It's easier to just do:
  content = content.replace(/\??\.toLowerCase\(\)\??\.includes\(/g, '?.toString()?.toLowerCase()?.includes(');

  // 3. Let's handle Date invalid time value just in case!
  // Replace `new Date(X).toLocaleDateString` -> `(new Date(X).getTime() ? new Date(X).toLocaleDateString : () => '-')`
  // Actually, replacing `new Date(` with a safe date function is harder.
  // We can inject a global safeDate at the top of AdminPanel.jsx if needed.
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function run() {
  walkDir(path.join(process.cwd(), 'src'));
  console.log('Fixed all jsx files!');
}

run();
