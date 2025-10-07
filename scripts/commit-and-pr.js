#!/usr/bin/env node

/**
 * Enhanced QTools Commit & PR Script
 * 
 * Features:
 * - AI-powered commit message generation based on actual code changes
 * - Intelligent branch naming with proper prefixes (feature/, bugfix/, docs/, etc.)
 * - Comprehensive PR body generation with categorized changes
 * - Diff analysis for better context understanding
 * - Automatic change type detection (features, fixes, improvements)
 * - Fallback mechanisms for error handling
 * 
 * Usage: npm run pr
 */

import { execSync } from 'child_process';
import readline from 'readline';

// Function to analyze specific changes for better commit messages
function analyzeSpecificChanges(changedFiles, diffOutput) {
  const newFeatures = [];
  const bugFixes = [];
  const improvements = [];

  // Analyze file names and patterns for context
  changedFiles.forEach(file => {
    const fileName = file.toLowerCase();

    // New features detection
    if (fileName.includes('new') || fileName.includes('add')) {
      newFeatures.push('new functionality');
    }
    if (fileName.includes('wizard') || fileName.includes('checkout')) {
      newFeatures.push('checkout wizard');
    }
    if (fileName.includes('layout') || fileName.includes('grid')) {
      newFeatures.push('layout controls');
    }
    if (fileName.includes('sort')) {
      newFeatures.push('sorting functionality');
    }

    // Bug fixes detection
    if (fileName.includes('fix') || fileName.includes('bug')) {
      bugFixes.push('critical bugs');
    }
    if (fileName.includes('error') || fileName.includes('blank')) {
      bugFixes.push('page loading issues');
    }

    // Improvements detection
    if (fileName.includes('ui') || fileName.includes('ux')) {
      improvements.push('user interface');
    }
    if (fileName.includes('style') || fileName.includes('design')) {
      improvements.push('visual design');
    }
    if (fileName.includes('performance') || fileName.includes('optimize')) {
      improvements.push('performance');
    }
  });

  // Analyze diff content for more context
  if (diffOutput.includes('useState') || diffOutput.includes('useEffect')) {
    improvements.push('React hooks implementation');
  }
  if (diffOutput.includes('Button') || diffOutput.includes('Card')) {
    improvements.push('UI components');
  }
  if (diffOutput.includes('sort') || diffOutput.includes('filter')) {
    newFeatures.push('data sorting and filtering');
  }

  return {
    newFeatures: [...new Set(newFeatures)],
    bugFixes: [...new Set(bugFixes)],
    improvements: [...new Set(improvements)]
  };
}

// Function to generate intelligent commit message based on changes
function generateCommitMessage(changedFiles) {
  try {
    // Get detailed diff information
    const diffOutput = execSync('git diff --cached --name-status', { encoding: 'utf8' });
    const diffSummary = execSync('git diff --cached --stat', { encoding: 'utf8' });

    // Analyze file changes
    const fileTypes = {
      backend: ['server/', 'database.js', 'api.ts', 'routes/'],
      frontend: ['src/', 'components/', 'pages/', '.tsx'],
      docs: ['.md', 'README', 'GUIDE'],
      config: ['package.json', 'vite.config', 'tsconfig', '.env'],
      assets: ['public/', 'images/', 'logo', 'favicon']
    };

    const changes = {
      backend: changedFiles.some(f => fileTypes.backend.some(t => f.includes(t))),
      frontend: changedFiles.some(f => fileTypes.frontend.some(t => f.includes(t))),
      docs: changedFiles.some(f => fileTypes.docs.some(t => f.includes(t))),
      config: changedFiles.some(f => fileTypes.config.some(t => f.includes(t))),
      assets: changedFiles.some(f => fileTypes.assets.some(t => f.includes(t)))
    };

    // Analyze specific changes for better descriptions
    const specificChanges = analyzeSpecificChanges(changedFiles, diffOutput);

    // Generate contextual message
    let emoji = '🔄';
    let description = 'Update';

    if (specificChanges.newFeatures.length > 0) {
      emoji = '✨';
      description = `Add ${specificChanges.newFeatures.join(', ')}`;
    } else if (specificChanges.bugFixes.length > 0) {
      emoji = '🐛';
      description = `Fix ${specificChanges.bugFixes.join(', ')}`;
    } else if (specificChanges.improvements.length > 0) {
      emoji = '🎨';
      description = `Improve ${specificChanges.improvements.join(', ')}`;
    } else if (changes.backend && changes.frontend) {
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

    // Add comprehensive technical details
    const details = [];

    // Add change type details
    if (changes.backend) details.push('backend');
    if (changes.frontend) details.push('UI components');
    if (changes.docs) details.push('documentation');
    if (changes.config) details.push('configuration');

    // Add specific feature details
    if (specificChanges.newFeatures.length > 0) {
      details.push(`new: ${specificChanges.newFeatures.slice(0, 2).join(', ')}`);
    }
    if (specificChanges.bugFixes.length > 0) {
      details.push(`fixes: ${specificChanges.bugFixes.slice(0, 2).join(', ')}`);
    }
    if (specificChanges.improvements.length > 0) {
      details.push(`improves: ${specificChanges.improvements.slice(0, 2).join(', ')}`);
    }

    // Add file count context
    const fileCount = changedFiles.length;
    if (fileCount > 1) {
      details.push(`${fileCount} files`);
    }

    const detailStr = details.length > 0 ? ` - ${details.join(', ')}` : '';

    return `${emoji} ${description}${detailStr}`;

  } catch (error) {
    console.log('⚠️  Error analyzing changes, using basic message generation');
    // Fallback to basic generation
    return generateBasicCommitMessage(changedFiles);
  }
}

// Fallback function for basic commit message generation
function generateBasicCommitMessage(changedFiles) {
  const fileTypes = {
    backend: ['server/', 'database.js', 'api.ts', 'routes/'],
    frontend: ['src/', 'components/', 'pages/', '.tsx'],
    docs: ['.md', 'README', 'GUIDE'],
    config: ['package.json', 'vite.config', 'tsconfig', '.env'],
    assets: ['public/', 'images/', 'logo', 'favicon']
  };

  const changes = {
    backend: changedFiles.some(f => fileTypes.backend.some(t => f.includes(t))),
    frontend: changedFiles.some(f => fileTypes.frontend.some(t => f.includes(t))),
    docs: changedFiles.some(f => fileTypes.docs.some(t => f.includes(t))),
    config: changedFiles.some(f => fileTypes.config.some(t => f.includes(t))),
    assets: changedFiles.some(f => fileTypes.assets.some(t => f.includes(t)))
  };

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

  const details = [];
  if (changes.backend) details.push('backend');
  if (changes.frontend) details.push('UI components');
  if (changes.docs) details.push('documentation');
  if (changes.config) details.push('configuration');

  const detailStr = details.length > 0 ? ` - ${details.join(', ')}` : '';
  return `${emoji} ${description}${detailStr}`;
}

// Function to generate comprehensive PR body
function generatePRBody(changedFiles, commitMessage) {
  try {
    // Get diff stats
    const diffStats = execSync('git diff --cached --stat', { encoding: 'utf8' });
    const diffSummary = execSync('git diff --cached --shortstat', { encoding: 'utf8' });

    // Categorize files
    const categories = {
      'Frontend Components': changedFiles.filter(f => f.includes('src/components/')),
      'Pages': changedFiles.filter(f => f.includes('src/pages/')),
      'Backend/API': changedFiles.filter(f => f.includes('server/') || f.includes('api')),
      'Styles/UI': changedFiles.filter(f => f.includes('.css') || f.includes('style')),
      'Configuration': changedFiles.filter(f => f.includes('package.json') || f.includes('config') || f.includes('.env')),
      'Documentation': changedFiles.filter(f => f.includes('.md')),
      'Scripts': changedFiles.filter(f => f.includes('scripts/')),
      'Other': changedFiles.filter(f => !Object.values(categories).flat().includes(f))
    };

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) delete categories[key];
    });

    let prBody = `## 📋 Summary\n\n${commitMessage}\n\n`;

    // Add changes by category
    prBody += `## 🔄 Changes Made\n\n`;
    Object.entries(categories).forEach(([category, files]) => {
      if (files.length > 0) {
        prBody += `### ${category}\n`;
        files.forEach(file => {
          prBody += `- \`${file}\`\n`;
        });
        prBody += '\n';
      }
    });

    // Add diff statistics
    if (diffSummary.trim()) {
      prBody += `## 📊 Statistics\n\n\`\`\`\n${diffSummary.trim()}\n\`\`\`\n\n`;
    }

    // Add testing notes
    prBody += `## 🧪 Testing\n\n- [ ] Functionality tested locally\n- [ ] UI/UX reviewed\n- [ ] No breaking changes\n- [ ] Performance impact assessed\n\n`;

    // Add review checklist
    prBody += `## ✅ Review Checklist\n\n- [ ] Code follows project standards\n- [ ] Changes are well documented\n- [ ] No sensitive information exposed\n- [ ] Ready for deployment\n\n`;

    prBody += `---\n*Auto-generated PR from commit script*`;

    return prBody;

  } catch (error) {
    // Fallback to basic PR body
    return `## Changes\n\n${changedFiles.map(f => `- ${f}`).join('\n')}\n\n## Description\n\nAutomatically generated pull request for: ${commitMessage}`;
  }
}

// Function to generate intelligent branch names
function generateBranchName(commitMessage, changedFiles) {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // Determine branch type based on commit message
  let branchType = 'feature';
  if (commitMessage.includes('🐛') || commitMessage.toLowerCase().includes('fix')) {
    branchType = 'bugfix';
  } else if (commitMessage.includes('📝') || commitMessage.toLowerCase().includes('doc')) {
    branchType = 'docs';
  } else if (commitMessage.includes('⚙️') || commitMessage.toLowerCase().includes('config')) {
    branchType = 'config';
  } else if (commitMessage.includes('🎨') || commitMessage.toLowerCase().includes('style')) {
    branchType = 'style';
  } else if (commitMessage.includes('🔧') || commitMessage.toLowerCase().includes('refactor')) {
    branchType = 'refactor';
  }

  // Extract key terms from commit message
  let branchDescription = commitMessage
    .toLowerCase()
    .replace(/[🔄🚀🔧🎨📝⚙️🖼️✨🐛]/g, '') // Remove emojis
    .replace(/\b(add|fix|update|improve|enhance|implement|create)\b/g, '') // Remove common verbs
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 25); // Limit length

  // If description is too short, use file-based description
  if (branchDescription.length < 5) {
    const mainFiles = changedFiles
      .filter(f => f.includes('src/pages/') || f.includes('src/components/'))
      .map(f => f.split('/').pop().replace(/\.(tsx|ts|js|jsx)$/, ''))
      .slice(0, 2)
      .join('-');

    if (mainFiles) {
      branchDescription = mainFiles.toLowerCase();
    } else {
      branchDescription = 'updates';
    }
  }

  return `${branchType}/${branchDescription}-${timestamp}`;
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

  // Generate intelligent branch name from commit message
  const branchName = generateBranchName(finalMessage, changedFiles);

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

      // Generate enhanced PR body
      const prBody = generatePRBody(changedFiles, finalMessage);

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