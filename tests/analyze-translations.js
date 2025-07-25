#!/usr/bin/env node

/**
 * Translation Size Monitor
 * 
 * This script monitors your translation file sizes and warns
 * when they get large enough to consider lazy loading.
 */

const fs = require('fs');
const path = require('path');

const WARN_THRESHOLD = 200 * 1024; // 200KB
const CRITICAL_THRESHOLD = 500 * 1024; // 500KB

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + 'KB';
}

function analyzeTranslations() {
  const messagesDir = path.join(__dirname, '../messages');
  const files = ['en.json', 'ar.json'];
  
  let totalSize = 0;
  const results = [];

  console.log('🌍 Translation File Analysis\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  files.forEach(file => {
    const filePath = path.join(messagesDir, file);
    const size = getFileSize(filePath);
    totalSize += size;
    
    let status = '✅ Good';
    if (size > CRITICAL_THRESHOLD) {
      status = '🚨 Critical - Implement lazy loading';
    } else if (size > WARN_THRESHOLD) {
      status = '⚠️  Large - Consider optimization';
    }
    
    results.push({
      file,
      size,
      status,
      formatted: formatBytes(size)
    });
  });

  // Display results
  results.forEach(({ file, size, status, formatted }) => {
    console.log(`📄 ${file.padEnd(10)} ${formatted.padEnd(10)} ${status}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📊 Total Size: ${formatBytes(totalSize)}`);
  
  // Recommendations
  if (totalSize > CRITICAL_THRESHOLD * 2) {
    console.log('\n🚨 RECOMMENDATION: Implement lazy loading immediately');
    console.log('   - Files are too large for optimal performance');
    console.log('   - Use the lazy loading system in /app/lib/i18n-lazy/');
  } else if (totalSize > WARN_THRESHOLD * 2) {
    console.log('\n⚠️  RECOMMENDATION: Consider namespace organization');
    console.log('   - Split translations by feature/page');
    console.log('   - Prepare for future lazy loading');
  } else {
    console.log('\n✅ CURRENT SETUP: Optimal');
    console.log('   - File sizes are appropriate');
    console.log('   - No immediate action needed');
    console.log('   - Continue monitoring growth');
  }

  // Growth projection
  console.log('\n📈 GROWTH PROJECTION:');
  console.log(`   - At 2x growth: ${formatBytes(totalSize * 2)} (${totalSize * 2 > WARN_THRESHOLD * 2 ? 'Consider optimization' : 'Still good'})`);
  console.log(`   - At 5x growth: ${formatBytes(totalSize * 5)} (${totalSize * 5 > CRITICAL_THRESHOLD * 2 ? 'Lazy loading required' : 'Monitor closely'})`);
  console.log(`   - At 10x growth: ${formatBytes(totalSize * 10)} (Definitely need lazy loading)`);

  console.log('\n🔍 MONITORING:');
  console.log('   - Run this script monthly: npm run check-translations');
  console.log('   - Set up CI alerts at 200KB per file');
  console.log('   - Review translation structure quarterly');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

if (require.main === module) {
  analyzeTranslations();
}

module.exports = { analyzeTranslations };
