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
├── sepolia/
├── ...
```

## How to Submit Your Distribution

### Prerequisites

1. You must have already deployed a `SaturnMerkleDistributor` contract on your target chain
2. You must have registered your distribution in the `SaturnDistributionRegistry`
- sepolia SaturnDistributionRegistry: "0x2357f0951Fe2cf82914a8e8318F70Ee7AB55c568"
- ethereum SaturnDistributionRegistry: updated soon
- classic SaturnDistributionRegistry: updated soon
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
     "createdBy": "0x...",
     "totalRecipients": 1000,
     "totalAmount": "1000000000000000000000"
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

All distributions in this repo are automatically displayed on **https://app.saturndex.org/#/my-account/rewards** (must connect wallet to view content). Projects not in this repo can still be claimed directly if users know the distributor address.

## For SaturnDEX Team

### Adding a New Distribution Flow

# Generate snapshot
# Generate merkle tree
# Deploy distributor (deployment and funding are separate steps)
# Fund the distributor (separate step, can be done by project owner)

# Then copy merkle-tree.json to this repo and compose distribution.json
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
| Sepolia | `sepolia/` | 11155111 |


## License

MIT - See [LICENSE](./LICENSE)

## Support

For questions or issues:
- Discord: https://discord.gg/spWVruAgB5 
- Email: info@saturndex.org
