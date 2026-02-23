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

  // Validate new format: {root, leaves}
  if (!treeData.root || typeof treeData.root !== 'string') {
    errors.push('Missing or invalid root field');
  }

  if (!treeData.leaves || !Array.isArray(treeData.leaves)) {
    errors.push('Missing or invalid leaves array');
    return errors;
  }

  // Verify merkle root matches distribution.json if provided
  if (expectedRoot && treeData.root !== expectedRoot) {
    errors.push(`Merkle root mismatch: ${treeData.root} vs expected ${expectedRoot}`);
  }

  // Validate each leaf
  for (let i = 0; i < treeData.leaves.length; i++) {
    const leaf = treeData.leaves[i];

    if (typeof leaf.leafIndex !== 'number') {
      errors.push(`Leaf ${i}: Missing or invalid leafIndex`);
    }

    if (!leaf.address || !/^0x[a-fA-F0-9]{40}$/.test(leaf.address)) {
      errors.push(`Leaf ${i}: Invalid address format: ${leaf?.address}`);
    }

    if (!leaf.amount || typeof leaf.amount !== 'string' || !/^\d+$/.test(leaf.amount)) {
      errors.push(`Leaf ${i}: Amount should be numeric string, got: ${leaf?.amount}`);
    }
  }

  // Check for duplicate leafIndex values
  const indices = treeData.leaves.map(l => l.leafIndex);
  const duplicates = indices.filter((item, index) => indices.indexOf(item) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate leafIndex values found: ${[...new Set(duplicates)].join(', ')}`);
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
        console.log(`  - Leaves: ${treeData.leaves.length}`);
        console.log(`  - Root: ${treeData.root}`);
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
  const chains = ['ethereum', 'classic', 'base', 'optimism', 'arbitrum', 'polygon', 'bsc', 'avalanche', 'sepolia', 'mordor', 'arbitrum-sepolia', 'optimism-sepolia', 'base-sepolia', 'smartchain-testnet', 'polygon-amoy', 'avalanchec-fuji'];
  
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
