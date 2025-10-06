#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

// Function to generate intelligent commit message based on changes
function generateCommitMessage(changedFiles) {
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

// Check if GitHub CLI is available
function hasGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

console.log('🚀 QTools - Smart Commit & Auto Pull Request');
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

  // Generate branch name from commit message
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const branchName = `feature/${finalMessage
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 30)}-${timestamp}`; // Add timestamp and limit length

  console.log(`\n🌿 Creating new branch: "${branchName}"`);
  
  // Create and switch to new branch
  execSync(`git checkout -b "${branchName}"`, { stdio: 'pipe' });

  console.log('📋 Staging all changes...');
  execSync('git add .', { stdio: 'pipe' });

  console.log(`💾 Creating commit: "${finalMessage}"`);
  execSync(`git commit -m "${finalMessage}"`, { stdio: 'inherit' });

  console.log(`\n🌐 Pushing branch to GitHub...`);
  execSync(`git push -u origin "${branchName}"`, { stdio: 'inherit' });

  // Check if GitHub CLI is available and ask user if they want to create PR
  const hasGH = hasGitHubCLI();
  
  if (hasGH) {
    const createPR = await askUser('\n🔄 Create Pull Request automatically? (y/n): ');
    
    if (createPR.toLowerCase() === 'y' || createPR.toLowerCase() === 'yes') {
      console.log('\n📝 Creating Pull Request...');
      
      const prTitle = finalMessage;
      const prBody = `## Changes\n\n${changedFiles.map(f => `- ${f}`).join('\n')}\n\n## Description\n\nAutomatically generated pull request for: ${finalMessage}`;
      
      try {
        const prResult = execSync(`gh pr create --title "${prTitle}" --body "${prBody}" --base main --head "${branchName}"`, { encoding: 'utf8' });
        console.log('\n🎉 PULL REQUEST CREATED SUCCESSFULLY!');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`🔗 ${prResult.trim()}`);
        console.log('═══════════════════════════════════════════════════════════════');
      } catch (error) {
        console.log('\n⚠️  Could not create PR automatically. You can create it manually on GitHub.');
      }
    }
  }

  if (!hasGH || createPR?.toLowerCase() !== 'y') {
    console.log('\n🎉 SUCCESSFULLY PUSHED BRANCH TO GITHUB!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🌿 Branch: ${branchName}`);
    console.log('🔗 Next steps:');
    console.log('   1. Go to your GitHub repository');
    console.log('   2. Create a Pull Request from the new branch');
    console.log('   3. Review and merge when ready');
    console.log('═══════════════════════════════════════════════════════════════');
  }
  
  // Switch back to main branch
  console.log('\n🔄 Switching back to main branch...');
  execSync('git checkout main', { stdio: 'pipe' });

} catch (error) {
  console.error('❌ Error during git operations:', error.message);
  console.log('\n💡 You can try manually:');
  console.log('1. git checkout -b feature/your-branch-name');
  console.log('2. git add .');
  console.log('3. git commit -m "Your message here"');
  console.log('4. git push -u origin feature/your-branch-name');
  console.log('5. Create PR on GitHub');
}