/**
 * PR validation script for distribution submissions
 * Validates distribution.json format and required fields
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const SUPPORTED_CHAINS = {
  'ethereum': 1,
  'classic': 61,
  'base': 8453,
  'optimism': 10,
  'arbitrum': 42161,
  'polygon': 137,
  'bsc': 56,
  'avalanche': 43114
};

const REQUIRED_FIELDS = [
  'chainId',
  'chainName',
  'name',
  'description',
  'token',
  'distributor',
  'registry',
  'merkleRoot',
  'createdAt',
  'totalRecipients',
  'totalAmount',
  'createdBy'
];

const TOKEN_REQUIRED_FIELDS = ['address', 'name', 'symbol', 'decimals', 'type'];

function isValidAddress(address) {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

function isValidBytes32(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value);
}

async function validateDistributionFile(filePath) {
  const errors = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate chain
    if (data.chainName && !SUPPORTED_CHAINS[data.chainName]) {
      errors.push(`Unsupported chain: ${data.chainName}`);
    }
    
    if (data.chainId && data.chainName) {
      const expectedChainId = SUPPORTED_CHAINS[data.chainName];
      if (expectedChainId && expectedChainId !== data.chainId) {
        errors.push(`Chain ID mismatch: ${data.chainId} vs expected ${expectedChainId}`);
      }
    }
    
    // Validate addresses
    const addressFields = ['distributor', 'registry', 'createdBy'];
    if (data.token && data.token.address) {
      addressFields.push({ field: 'token.address', value: data.token.address });
    }
    
    for (const field of addressFields) {
      const fieldName = typeof field === 'string' ? field : field.field;
      const value = typeof field === 'string' ? data[field] : field.value;
      
      if (value && !isValidAddress(value)) {
        errors.push(`Invalid address in ${fieldName}: ${value}`);
      }
    }
    
    // Validate token fields
    if (data.token) {
      for (const field of TOKEN_REQUIRED_FIELDS) {
        if (!(field in data.token)) {
          errors.push(`Missing required token field: ${field}`);
        }
      }
      
      if (data.token.type && !['NATIVE', 'ERC20', 'ERC223'].includes(data.token.type)) {
        errors.push(`Invalid token type: ${data.token.type}`);
      }
    }
    
    // Validate merkle root
    if (data.merkleRoot && !isValidBytes32(data.merkleRoot)) {
      errors.push(`Invalid merkleRoot format: ${data.merkleRoot}`);
    }
    
    // Validate numbers
    if (data.totalRecipients && (isNaN(data.totalRecipients) || data.totalRecipients < 0)) {
      errors.push(`Invalid totalRecipients: ${data.totalRecipients}`);
    }
    
  } catch (error) {
    errors.push(`Failed to parse JSON: ${error.message}`);
  }
  
  return errors;
}

async function main() {
  // Find all distribution.json files in the PR
  const changedFiles = process.env.CHANGED_FILES || '';
  const files = changedFiles.split('\n').filter(f => f.includes('distribution.json'));
  
  // If no changed files detected, scan all
  const scanFiles = files.length > 0 ? files : findAllDistributionFiles();
  
  let hasErrors = false;
  
  for (const file of scanFiles) {
    console.log(`\nValidating: ${file}`);
    const errors = await validateDistributionFile(file);
    
    if (errors.length > 0) {
      hasErrors = true;
      console.error(`  ❌ Errors found:`);
      errors.forEach(e => console.error(`    - ${e}`));
    } else {
      console.log(`  ✓ Valid`);
    }
  }
  
  if (hasErrors) {
    process.exit(1);
  }
  
  console.log('\n✅ All distributions valid');
}

function findAllDistributionFiles() {
  const files = [];
  const chains = Object.keys(SUPPORTED_CHAINS);
  
  for (const chain of chains) {
    const chainPath = path.join(process.cwd(), chain);
    if (!fs.existsSync(chainPath)) continue;
    
    const distributors = fs.readdirSync(chainPath);
    for (const distributor of distributors) {
      const distributorPath = path.join(chainPath, distributor);
      if (!fs.statSync(distributorPath).isDirectory()) continue;
      
      const distFile = path.join(distributorPath, 'distribution.json');
      if (fs.existsSync(distFile)) {
        files.push(distFile);
      }
    }
  }
  
  return files;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
