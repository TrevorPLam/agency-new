#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File extensions to include
const CODE_EXTENSIONS = ['.ts', '.js', '.tsx', '.jsx'];

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.next',
  'coverage',
  '.nyc_output',
  '.changeset',
  '.github'
];

// Files to exclude
const EXCLUDE_FILES = [
  'consolidate-packages.js',
  'consolidate-codebase.js'
];

function shouldIncludeFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  
  // Check file extension
  if (!CODE_EXTENSIONS.includes(ext)) {
    return false;
  }
  
  // Check excluded files
  if (EXCLUDE_FILES.includes(fileName)) {
    return false;
  }
  
  // Check if file is in excluded directory
  const relativePath = path.relative(process.cwd(), filePath);
  const parts = relativePath.split(path.sep);
  
  for (const part of parts) {
    if (EXCLUDE_DIRS.includes(part)) {
      return false;
    }
  }
  
  return true;
}

function getAllCodeFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip excluded directories
      if (EXCLUDE_DIRS.includes(file)) {
        continue;
      }
      getAllCodeFiles(filePath, fileList);
    } else if (shouldIncludeFile(filePath)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

function generatePackageMarkdown(packageDir, packageName) {
  const packagePath = path.join(process.cwd(), 'packages', packageDir);
  
  if (!fs.existsSync(packagePath)) {
    console.error(`Package directory not found: ${packagePath}`);
    return null;
  }
  
  const codeFiles = getAllCodeFiles(packagePath);
  
  // Sort files by path for consistent ordering
  codeFiles.sort();
  
  let markdown = `# ${packageName}\n\n`;
  markdown += `Generated on: ${new Date().toISOString()}\n`;
  markdown += `Total files: ${codeFiles.length}\n\n`;
  
  // Try to read package.json for description
  const packageJsonPath = path.join(packagePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.description) {
        markdown += `**Description:** ${packageJson.description}\n\n`;
      }
      if (packageJson.version) {
        markdown += `**Version:** ${packageJson.version}\n\n`;
      }
    } catch (error) {
      console.warn(`Could not read package.json for ${packageName}:`, error.message);
    }
  }
  
  // Add table of contents
  markdown += '## Table of Contents\n\n';
  
  codeFiles.forEach(filePath => {
    const relativePath = path.relative(packagePath, filePath);
    const fileName = path.basename(filePath);
    const anchor = fileName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    markdown += `- [${fileName}](#${anchor})\n`;
  });
  
  markdown += '\n## File Contents\n\n';
  
  // Add file contents
  codeFiles.forEach(filePath => {
    const relativePath = path.relative(packagePath, filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      markdown += `### ${fileName}\n\n`;
      markdown += `**Path:** \`${relativePath}\`\n\n`;
      markdown += `**Language:** ${ext === '.ts' ? 'TypeScript' : ext === '.js' ? 'JavaScript' : ext === '.tsx' ? 'TypeScript React' : 'JavaScript React'}\n\n`;
      markdown += '```' + (ext === '.ts' || ext === '.tsx' ? 'typescript' : 'javascript') + '\n';
      markdown += content;
      markdown += '\n```\n\n';
      markdown += '---\n\n';
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  });
  
  return markdown;
}

function consolidateAllPackages() {
  const packagesDir = path.join(process.cwd(), 'packages');
  const outputDir = path.join(process.cwd(), 'docs', 'consolidated');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  if (!fs.existsSync(packagesDir)) {
    console.error('Packages directory not found!');
    return;
  }
  
  const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`Found ${packageDirs.length} packages to consolidate...\n`);
  
  const results = [];
  
  for (const packageDir of packageDirs) {
    console.log(`Processing ${packageDir}...`);
    
    const markdown = generatePackageMarkdown(packageDir, packageDir);
    
    if (markdown) {
      const outputFile = path.join(outputDir, `${packageDir}.md`);
      fs.writeFileSync(outputFile, markdown);
      
      const stats = fs.statSync(outputFile);
      results.push({
        package: packageDir,
        file: outputFile,
        size: stats.size,
        files: markdown.split('### ').length - 1
      });
      
      console.log(`✅ Generated ${outputFile}`);
    } else {
      console.log(`❌ Failed to process ${packageDir}`);
    }
  }
  
  // Generate summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Consolidation Summary');
  console.log('='.repeat(50));
  
  let totalSize = 0;
  let totalFiles = 0;
  
  results.forEach(result => {
    totalSize += result.size;
    totalFiles += result.files;
    console.log(`${result.package.padEnd(25)} | ${result.files.toString().padStart(3)} files | ${(result.size / 1024).toFixed(1).padStart(6)} KB`);
  });
  
  console.log(''.padEnd(50, '-'));
  console.log(`${'TOTAL'.padEnd(25)} | ${totalFiles.toString().padStart(3)} files | ${(totalSize / 1024).toFixed(1).padStart(6)} KB`);
  console.log(`📁 Output directory: ${outputDir}`);
}

// Main execution
try {
  consolidateAllPackages();
} catch (error) {
  console.error('❌ Error consolidating packages:', error.message);
  process.exit(1);
}
