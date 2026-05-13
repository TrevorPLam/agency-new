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
  'consolidate-codebase.js',
  'codebase.md',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock'
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
  
  // Check if file is in test directory but keep test files
  const relativePath = path.relative(process.cwd(), filePath);
  const parts = relativePath.split(path.sep);
  
  // Exclude files in excluded directories
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

function generateCodebaseMarkdown() {
  const codeFiles = getAllCodeFiles(process.cwd());
  
  // Sort files by path for consistent ordering
  codeFiles.sort();
  
  let markdown = '# Agency Codebase Consolidation\n\n';
  markdown += `Generated on: ${new Date().toISOString()}\n`;
  markdown += `Total files: ${codeFiles.length}\n\n`;
  
  markdown += '## Table of Contents\n\n';
  
  // Generate table of contents
  const categories = {};
  codeFiles.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const category = relativePath.includes('apps/') ? 'apps' : 
                    relativePath.includes('packages/') ? 'packages' : 'root';
    
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(relativePath);
  });
  
  Object.keys(categories).sort().forEach(category => {
    markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    categories[category].forEach(filePath => {
      const fileName = path.basename(filePath);
      const anchor = fileName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      markdown += `- [${fileName}](#${anchor})\n`;
    });
    markdown += '\n';
  });
  
  // Add file contents
  markdown += '## File Contents\n\n';
  
  codeFiles.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
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

// Main execution
try {
  console.log('Consolidating codebase...');
  const markdown = generateCodebaseMarkdown();
  
  const outputPath = path.join(process.cwd(), 'codebase.md');
  fs.writeFileSync(outputPath, markdown);
  
  console.log(`✅ Codebase consolidated successfully!`);
  console.log(`📁 Output file: ${outputPath}`);
  console.log(`📊 Total files processed: ${markdown.split('### ').length - 1}`);
} catch (error) {
  console.error('❌ Error consolidating codebase:', error.message);
  process.exit(1);
}
