/**
 * Merkle tree validation script
 * Verifies merkle-tree.json integrity and consistency with distribution.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadMerkleTree(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load merkle tree: ${error.message}`);
  }
}

function validateMerkleTree(treeData, expectedRoot) {
  const errors = [];
  
  // Check tree structure
  if (!treeData.values || !Array.isArray(treeData.values)) {
    errors.push('Missing or invalid values array');
    return errors;
  }
  
  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    errors.push('Missing or invalid tree array');
    return errors;
  }
  
  if (!treeData.leafEncoding || !Array.isArray(treeData.leafEncoding)) {
    errors.push('Missing or invalid leafEncoding');
  }
  
  // Verify merkle root matches if provided
  // Handle standard-v1 format where root is tree[0]
  const actualRoot = treeData.format === 'standard-v1' && treeData.tree?.[0] 
    ? treeData.tree[0] 
    : treeData.root;
  
  if (expectedRoot && actualRoot !== expectedRoot) {
    errors.push(`Merkle root mismatch: ${actualRoot} vs expected ${expectedRoot}`);
  }
  
  // Validate each leaf
  for (let i = 0; i < treeData.values.length; i++) {
    const entry = treeData.values[i];
    
    if (!entry.value || !Array.isArray(entry.value)) {
      errors.push(`Entry ${i}: Missing or invalid value`);
      continue;
    }
    
    if (entry.value.length !== 3) {
      errors.push(`Entry ${i}: Expected 3 fields (index, address, amount), got ${entry.value.length}`);
    }
    
    // Validate index is number
    if (typeof entry.value[0] !== 'number') {
      errors.push(`Entry ${i}: Index should be a number`);
    }
    
    // Validate address format
    const address = entry.value[1];
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      errors.push(`Entry ${i}: Invalid address format: ${address}`);
    }
    
    // Validate amount is string (for BigInt compatibility)
    const amount = entry.value[2];
    if (typeof amount !== 'string' || !/^\d+$/.test(amount)) {
      errors.push(`Entry ${i}: Amount should be numeric string, got: ${amount}`);
    }
    
    // Check treeIndex exists
    if (typeof entry.treeIndex !== 'number') {
      errors.push(`Entry ${i}: Missing or invalid treeIndex`);
    }
  }
  
  // Check for duplicate indices
  const indices = treeData.values.map(v => v.value[0]);
  const duplicates = indices.filter((item, index) => indices.indexOf(item) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate indices found: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  // Verify tree length is sufficient
  const minTreeLength = Math.max(1, Math.ceil(Math.log2(treeData.values.length)) * 2);
  if (treeData.tree.length < minTreeLength) {
    errors.push(`Tree array too short: ${treeData.tree.length} (expected at least ${minTreeLength})`);
  }
  
  return errors;
}

async function main() {
  const changedFiles = process.env.CHANGED_FILES || '';
  const files = changedFiles.split('\n').filter(f => f.includes('merkle-tree.json'));
  
  // If no changed files, scan all
  const scanFiles = files.length > 0 ? files : findAllMerkleFiles();
  
  let hasErrors = false;
  
  for (const file of scanFiles) {
    console.log(`\nValidating merkle tree: ${file}`);
    
    try {
      const treeData = loadMerkleTree(file);
      
      // Load corresponding distribution.json for root verification
      const dir = path.dirname(file);
      const distFile = path.join(dir, 'distribution.json');
      let expectedRoot = null;
      
      if (fs.existsSync(distFile)) {
        const distData = JSON.parse(fs.readFileSync(distFile, 'utf-8'));
        expectedRoot = distData.merkleRoot;
      }
      
      const errors = validateMerkleTree(treeData, expectedRoot);
      
      if (errors.length > 0) {
        hasErrors = true;
        console.error(`  ❌ Errors found:`);
        errors.forEach(e => console.error(`    - ${e}`));
      } else {
        console.log(`  ✓ Valid`);
        console.log(`  - Leaves: ${treeData.values.length}`);
        const displayRoot = treeData.format === 'standard-v1' && treeData.tree?.[0] 
          ? treeData.tree[0] 
          : treeData.root;
        console.log(`  - Root: ${displayRoot}`);
      }
    } catch (error) {
      hasErrors = true;
      console.error(`  ❌ Error: ${error.message}`);
    }
  }
  
  if (hasErrors) {
    process.exit(1);
  }
  
  console.log('\n✅ All merkle trees valid');
}

function findAllMerkleFiles() {
  const files = [];
  const chains = ['ethereum', 'classic', 'base', 'optimism', 'arbitrum', 'polygon', 'bsc', 'avalanche'];
  
  for (const chain of chains) {
    const chainPath = path.join(process.cwd(), chain);
    if (!fs.existsSync(chainPath)) continue;
    
    const distributors = fs.readdirSync(chainPath);
    for (const distributor of distributors) {
      const distributorPath = path.join(chainPath, distributor);
      if (!fs.statSync(distributorPath).isDirectory()) continue;
      
      const merkleFile = path.join(distributorPath, 'merkle-tree.json');
      if (fs.existsSync(merkleFile)) {
        files.push(merkleFile);
      }
    }
  }
  
  return files;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
