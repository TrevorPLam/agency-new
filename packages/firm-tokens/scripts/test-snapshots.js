#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const SNAPSHOT_DIR = path.join(__dirname, '..', 'snapshots');
const DIST_DIR = path.join(__dirname, '..', 'dist');

async function ensureSnapshotDir() {
  await fs.ensureDir(SNAPSHOT_DIR);
}

async function takeSnapshot(filename) {
  const source = path.join(DIST_DIR, filename);
  const target = path.join(SNAPSHOT_DIR, filename);
  
  if (await fs.pathExists(source)) {
    await fs.copy(source, target);
    console.log(chalk.green(`✓ Snapshot created: ${filename}`));
    return true;
  } else {
    console.log(chalk.red(`✗ Source file not found: ${filename}`));
    return false;
  }
}

async function compareSnapshot(filename) {
  const source = path.join(DIST_DIR, filename);
  const target = path.join(SNAPSHOT_DIR, filename);
  
  if (!(await fs.pathExists(target))) {
    console.log(chalk.yellow(`? No snapshot exists for ${filename}, creating one`));
    return await takeSnapshot(filename);
  }
  
  if (!(await fs.pathExists(source))) {
    console.log(chalk.red(`✗ Generated file not found: ${filename}`));
    return false;
  }
  
  const sourceContent = await fs.readFile(source, 'utf8');
  const targetContent = await fs.readFile(target, 'utf8');
  
  if (sourceContent === targetContent) {
    console.log(chalk.green(`✓ Snapshot matches: ${filename}`));
    return true;
  } else {
    console.log(chalk.red(`✗ Snapshot mismatch: ${filename}`));
    console.log(chalk.gray('Expected (snapshot):'));
    console.log(chalk.gray(targetContent));
    console.log(chalk.gray('Actual (generated):'));
    console.log(chalk.gray(sourceContent));
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const updateMode = args.includes('--update');
  
  console.log(chalk.blue('🔍 Testing design token snapshots...'));
  
  await ensureSnapshotDir();
  
  const files = ['variables.css', 'constants.ts', 'tokens.json'];
  let allPassed = true;
  
  for (const file of files) {
    if (updateMode) {
      const passed = await takeSnapshot(file);
      allPassed = allPassed && passed;
    } else {
      const passed = await compareSnapshot(file);
      allPassed = allPassed && passed;
    }
  }
  
  if (allPassed) {
    console.log(chalk.green('\n✅ All snapshot tests passed!'));
    process.exit(0);
  } else {
    console.log(chalk.red('\n❌ Some snapshot tests failed!'));
    console.log(chalk.yellow('Run "npm run test:snapshots -- --update" to update snapshots'));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Error running snapshot tests:'), error);
    process.exit(1);
  });
}
