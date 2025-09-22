#!/usr/bin/env node

/**
 * Cleanup Script for Pass Files
 * 
 * This script removes all stored .pkpass files since we now generate them on-demand
 * and don't need to store them permanently.
 */

const fs = require('fs');
const path = require('path');

const passesDir = path.join(process.cwd(), 'storage', 'passes');

async function cleanupPassFiles() {
  try {
    console.log('🧹 Starting cleanup of stored .pkpass files...');
    
    if (!fs.existsSync(passesDir)) {
      console.log('✅ No passes directory found - nothing to clean up');
      return;
    }

    const files = await fs.promises.readdir(passesDir);
    const pkpassFiles = files.filter(file => file.endsWith('.pkpass'));
    
    if (pkpassFiles.length === 0) {
      console.log('✅ No .pkpass files found - nothing to clean up');
      return;
    }

    console.log(`📊 Found ${pkpassFiles.length} .pkpass files to remove`);
    
    let totalSize = 0;
    let removedCount = 0;

    for (const file of pkpassFiles) {
      const filePath = path.join(passesDir, file);
      try {
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
        
        await fs.promises.unlink(filePath);
        removedCount++;
        
        if (removedCount % 50 === 0) {
          console.log(`   Removed ${removedCount}/${pkpassFiles.length} files...`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to remove ${file}:`, error.message);
      }
    }

    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Cleanup complete!`);
    console.log(`   Files removed: ${removedCount}/${pkpassFiles.length}`);
    console.log(`   Space freed: ${sizeMB} MB`);
    console.log(`   Directory: ${passesDir}`);
    
    // Optionally remove the passes directory if it's empty
    const remainingFiles = await fs.promises.readdir(passesDir);
    if (remainingFiles.length === 0) {
      await fs.promises.rmdir(passesDir);
      console.log(`   Empty directory removed: ${passesDir}`);
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Add to package.json scripts
function updatePackageJson() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!packageJson.scripts['cleanup:passes']) {
      packageJson.scripts['cleanup:passes'] = 'node scripts/cleanup-pass-files.js';
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('📦 Added cleanup:passes script to package.json');
    }
  } catch (error) {
    console.warn('⚠️  Could not update package.json:', error.message);
  }
}

if (require.main === module) {
  cleanupPassFiles()
    .then(() => {
      updatePackageJson();
      console.log('\n🎉 Pass files cleanup completed successfully!');
      console.log('💡 Your app now generates passes on-demand without storing them.');
      console.log('💡 This saves storage space and follows Apple PassKit best practices.');
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupPassFiles };
