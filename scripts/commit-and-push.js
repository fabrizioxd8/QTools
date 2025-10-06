#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

// Function to generate intelligent commit message based on changes
function generateCommitMessage(changedFiles) {
  const categories = {
    '🔧': ['server/', 'database.js', 'api.ts', '.env'],
    '🎨': ['components/', 'pages/', '.tsx', '.css', 'ui/'],
    '📝': ['.md', 'README', 'GUIDE', 'SUMMARY'],
    '⚙️': ['package.json', 'vite.config', 'tsconfig', '.json'],
    '🔒': ['certs/', 'ssl', 'https', 'security'],
    '🐛': ['fix', 'bug', 'error', 'issue'],
    '✨': ['feature', 'new', 'add'],
    '📱': ['mobile', 'responsive', 'device'],
    '🚀': ['deploy', 'build', 'production']
  };

  const fileTypes = {
    backend: ['server/', 'database.js', 'api.ts', 'routes/'],
    frontend: ['src/', 'components/', 'pages/', '.tsx'],
    docs: ['.md', 'README', 'GUIDE'],
    config: ['package.json', 'vite.config', 'tsconfig', '.env'],
    assets: ['public/', 'images/', 'logo', 'favicon']
  };

  // Analyze changed files
  const changes = {
    backend: changedFiles.some(f => fileTypes.backend.some(t => f.includes(t))),
    frontend: changedFiles.some(f => fileTypes.frontend.some(t => f.includes(t))),
    docs: changedFiles.some(f => fileTypes.docs.some(t => f.includes(t))),
    config: changedFiles.some(f => fileTypes.config.some(t => f.includes(t))),
    assets: changedFiles.some(f => fileTypes.assets.some(t => f.includes(t)))
  };

  // Generate message based on changes
  let emoji = '🔄';
  let description = 'Update';

  if (changes.backend && changes.frontend) {
    emoji = '🚀';
    description = 'Full-stack improvements';
  } else if (changes.backend) {
    emoji = '🔧';
    description = 'Backend enhancements';
  } else if (changes.frontend) {
    emoji = '🎨';
    description = 'UI/UX improvements';
  } else if (changes.docs) {
    emoji = '📝';
    description = 'Documentation updates';
  } else if (changes.config) {
    emoji = '⚙️';
    description = 'Configuration changes';
  } else if (changes.assets) {
    emoji = '🖼️';
    description = 'Asset updates';
  }

  // Add specific details
  const details = [];
  if (changes.backend) details.push('backend');
  if (changes.frontend) details.push('UI components');
  if (changes.docs) details.push('documentation');
  if (changes.config) details.push('configuration');

  const detailStr = details.length > 0 ? ` - ${details.join(', ')}` : '';
  
  return `${emoji} ${description}${detailStr}`;
}

// Function to get user input
function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

console.log('🚀 QTools - Smart Commit & Push');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  // Check if there are any changes
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (!status.trim()) {
    console.log('✅ No changes to commit. Working tree is clean.');
    process.exit(0);
  }

  // Get list of changed files
  const changedFiles = status.split('\n')
    .filter(line => line.trim())
    .map(line => line.substring(3)); // Remove git status prefix

  console.log('📋 Detected changes in:');
  changedFiles.forEach(file => {
    if (file) console.log(`   📄 ${file}`);
  });

  // Generate intelligent commit message
  const autoMessage = generateCommitMessage(changedFiles);
  
  console.log(`\n🤖 Generated commit message: "${autoMessage}"`);
  
  // Ask user for confirmation or custom message
  const userChoice = await askUser('\n❓ Use this message? (y/n/custom): ');
  
  let finalMessage = autoMessage;
  
  if (userChoice.toLowerCase() === 'n' || userChoice.toLowerCase() === 'no') {
    console.log('❌ Commit cancelled.');
    process.exit(0);
  } else if (userChoice.toLowerCase() === 'c' || userChoice.toLowerCase() === 'custom') {
    const customMessage = await askUser('✏️  Enter your custom commit message: ');
    if (customMessage) {
      finalMessage = customMessage;
    }
  }

  console.log('\n📋 Staging all changes...');
  execSync('git add .', { stdio: 'pipe' });

  console.log(`💾 Creating commit: "${finalMessage}"`);
  execSync(`git commit -m "${finalMessage}"`, { stdio: 'inherit' });

  console.log('\n🌐 Pushing to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('\n🎉 SUCCESSFULLY PUSHED TO GITHUB!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔗 Check your repository for the latest changes!');
  console.log('═══════════════════════════════════════════════════════════════');

} catch (error) {
  console.error('❌ Error during git operations:', error.message);
  console.log('\n💡 You can try manually:');
  console.log('1. git add .');
  console.log('2. git commit -m "Your message here"');
  console.log('3. git push origin main');
}