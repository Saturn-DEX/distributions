# SaturnDEX Distributions Registry

Official registry for token distributions on SaturnDEX. This repository hosts the merkle trees and metadata for all claimable token distributions.

## Structure

```
saturndex-distributions/
├── ethereum/
│   └── 0x[DistributorAddress]/
│       ├── distribution.json     # Metadata
│       └── merkle-tree.json    # Full merkle tree
├── classic/
├── base/
├── ... (8 chains total)
```

## How to Submit Your Distribution

### Prerequisites

1. You must have already deployed a `SaturnMerkleDistributor` contract on your target chain
2. You must have registered your distribution in the `SaturnDistributionRegistry`
3. You must have funded your distributor with tokens

### Submission Steps

1. **Fork this repository**

2. **Create your distribution folder** at:
   ```
   [chain]/0x[YourDistributorAddress]/
   ```
   - `chain`: Use chain name (ethereum, classic, base, etc.)
   - `YourDistributorAddress`: Your deployed distributor contract address

3. **Create `distribution.json`**:
   ```json
   {
     "chainId": 1,
     "chainName": "ethereum",
     "name": "Your Project Airdrop",
     "description": "Description of your token distribution",
     "token": {
       "address": "0x...",
       "name": "Your Token",
       "symbol": "YTK",
       "decimals": 18
     },
     "distributor": "0x...",
     "registry": "0x...",
     "merkleRoot": "0x...",
     "deadline": 1700000000,
     "createdAt": 1699000000,
     "totalRecipients": 1000,
     "totalAmount": "1000000000000000000000",
     "createdBy": "0x...",
     "website": "https://yourproject.com",
     "twitter": "https://twitter.com/yourproject",
     "logo": "https://yourcdn.com/logo.png"
   }
   ```

4. **Upload `merkle-tree.json`** generated from your snapshot tool

5. **Create a Pull Request**
   - PR title: `Add distribution: [Your Project Name] on [Chain]`
   - Include verification that the distributor is funded
   - Include link to transaction funding the distributor

### Validation

Your PR will be automatically validated for:
- ✅ Valid JSON format
- ✅ Required fields present
- ✅ Valid Ethereum addresses
- ✅ Valid merkle root format
- ✅ Merkle tree integrity

### Visibility

All distributions in this repo are automatically displayed on **claim.saturndex.org**. Projects not in this repo can still be claimed directly if users know the distributor address.

## For SaturnDEX Team

### Adding a New Distribution

```bash
# Generate snapshot
npx ts-node scripts/distribution/snapshot.ts holders \
  --network ethereum \
  --token 0x... \
  --block 24498000 \
  --output ./snapshots/holders.json

# Generate merkle tree
npx ts-node scripts/distribution/merkle.ts generate \
  --input ./snapshots/holders.json \
  --output ./merkle/output

# Deploy distributor (deployment and funding are separate steps)
npx ts-node scripts/distribution/deploy-distributor.ts \
  --network ethereum \
  --token 0x... \
  --merkle-root 0x... \
  --deadline 0 \
  --registry 0x...

# Fund the distributor (separate step, can be done by project owner)
# For NATIVE: Send tokens directly to distributor address
# For ERC20/ERC223: Use token.transfer(distributorAddress, amount)

# Then copy merkle files to this repo
```

### Repository Maintenance

- Chain folders should only contain valid distributor addresses
- Each distributor folder contains exactly one distribution
- Old distributions should not be deleted (historical record)
- GitHub Actions validates all PRs automatically

## Chains Supported

| Chain | Folder | Chain ID |
|-------|--------|----------|
| Ethereum | `ethereum/` | 1 |
| Ethereum Classic | `classic/` | 61 |


## License

MIT - See [LICENSE](./LICENSE)

## Support

For questions or issues:
- Discord: https://discord.gg/9PRwAPGx
- Email: info@saturndex.org
