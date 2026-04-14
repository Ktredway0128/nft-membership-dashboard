# NFT MEMBERSHIP DASHBOARD

[![Verified on Etherscan](https://img.shields.io/badge/Etherscan-Verified-brightgreen)](https://sepolia.etherscan.io/address/0xF12215b2156f0E1dB8039d78FBad734b8f2158ac#code)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-blue)](https://nft-membership-dashboard.netlify.app/)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Ethers.js](https://img.shields.io/badge/Ethers.js-5.8-purple)
![Network](https://img.shields.io/badge/Network-Sepolia-green)

Built by [Tredway Development](https://tredwaydev.com) — professional Solidity smart contract packages for Web3 companies.

A production-ready React frontend for interacting with a deployed on-chain NFT membership pass system built on the OpenZeppelin ERC-721 framework.

> ⚠️ This dashboard is connected to the Sepolia test network for demonstration purposes only.
> These contracts have not been professionally audited. A full security audit is strongly recommended before any mainnet deployment.

This project demonstrates the full lifecycle of an NFT membership pass dashboard including:

- Wallet connection and network validation
- Phased minting with whitelist and public mint support
- Automatic Merkle proof generation for whitelisted addresses
- Real-time supply tracking with visual progress bar
- Membership pass ownership display
- Admin phase control, pricing, and configuration management
- ETH withdrawal and ERC-20 token recovery
- Transaction feedback with Etherscan verification

The repository represents the frontend layer of an NFT Membership Pass package, designed to work as a standalone product or as an optional add-on to the full token infrastructure suite.


## PROJECT GOALS

The purpose of this project is to demonstrate how a modern on-chain membership pass dashboard should be designed for real-world use.

The dashboard includes common features required by NFT membership interfaces:

- Phased minting with admin-controlled phase advancement
- Automatic whitelist detection and proof generation from a local address list
- Public mint support with live price display
- Real-time supply tracking with minted and remaining counts
- Per-wallet pass ownership display with token IDs
- Full admin panel for phase control, pricing, URIs, and treasury management
- Sold out and paused state handling with clear user feedback
- User-friendly transaction status and error handling
- Etherscan transaction verification

These patterns are widely used in production NFT and membership applications.


## DASHBOARD FEATURES

### WALLET CONNECTION

The dashboard connects to MetaMask and automatically detects the connected wallet's whitelist status, owned passes, and admin role.
A network check ensures the user is on the correct chain before connecting.
The UI refreshes automatically when the wallet is switched inside MetaMask.
Supports both Sepolia testnet and Localhost 8545 for local development.

### LIVE CONTRACT DATA

On connection, the dashboard loads the following data directly from the contract:

- Current Phase — Paused, Whitelist, or Public
- Total Minted — passes minted so far out of max supply
- Supply Minted — percentage of total supply minted
- Passes Owned — number of passes held by the connected wallet
- Public Mint Price — ETH price per pass during public phase
- Whitelist Mint Price — ETH price per pass during whitelist phase
- Max Supply — hard cap on total passes
- Merkle Root — current whitelist root stored on-chain
- Contract Balance — ETH collected from mints (admin only)

### SUPPLY BAR

A visual progress bar displays the percentage of total supply that has been minted, with minted count on the left and remaining count on the right. Updates automatically after every mint.

### MINT CARD

The mint card adapts dynamically based on the current phase and wallet status:

| Phase | Whitelisted | Behavior |
|-------|------------|---------|
| Paused | Any | Minting is paused message |
| Whitelist | Yes | ✅ On whitelist — mint button at whitelist price |
| Whitelist | No | ✗ Not on whitelist message |
| Whitelist | Yes, claimed | ✅ Already claimed message |
| Public | Any | Mint button at public price |
| Any | Sold Out | Grayed Sold Out button |
| Any | Paused | Grayed button with paused message |

Whitelist verification is fully automatic — the dashboard generates the Merkle proof from the local whitelist file and checks the connected wallet without any manual input required.

### YOUR PASSES

Displays all membership passes owned by the connected wallet as individual cards showing the pass number. Updates automatically after minting or transferring. If no passes are owned a friendly empty state message is displayed.

### MINT SETTINGS

Displays the current contract configuration at a glance:

- Public Mint Price
- Whitelist Price
- Max Supply
- Merkle Root (truncated)

### ADMIN PANEL

The admin panel is only visible to wallets holding ADMIN_ROLE. It is collapsed by default and contains the following sections:

**Phase Control**
- Current phase label with next phase preview
- Advance Phase button — forward only, cannot revert
- Pause button — emergency halt for all minting
- Unpause button — resume minting

**Update Prices**
- Set new public mint price in ETH
- Set new whitelist mint price in ETH

**Update Merkle Root**
- Displays the current root generated from the local whitelist file
- Input field to update the on-chain root

**Update Base URI**
- Input field to update the IPFS metadata URI for all passes

**Withdraw ETH**
- Displays current contract ETH balance
- Input field for recipient address
- Withdraw button to collect all ETH from mints

**Recover ERC-20 Tokens**
- Input fields for token address, recipient, and amount
- Recover button to retrieve accidentally sent ERC-20 tokens

### TRANSACTION FEEDBACK

Every action triggers a color-coded status bar with a loading spinner:

| Action | Status Color |
|--------|-------------|
| Minting | Gold |
| Admin Actions | Dark Gold |
| Pausing | Red |
| Unpausing | Green |
| Success | Bright Green |
| Error | Red |

On success a clickable Etherscan link appears for immediate transaction verification.

### ERROR HANDLING

User-friendly error messages are displayed for common failure cases:

- Transaction rejected in MetaMask
- Insufficient funds
- Whitelist phase not active
- Public phase not active
- Already claimed whitelist mint
- Address not on whitelist
- Insufficient ETH sent
- Max supply reached
- Already at final phase
- Nothing to withdraw
- General transaction failure


## TECHNOLOGY STACK

This project was built using the following tools:

- React – Frontend framework
- Ethers.js – Contract interaction library
- MerkleTreeJS – Client-side Merkle proof generation
- keccak256 – Leaf hashing for Merkle verification
- MetaMask – Wallet provider
- Alchemy – Ethereum RPC provider for reads
- Tailwind CSS – Utility-first styling
- Sepolia Test Network – Deployment environment


## PROJECT STRUCTURE

src/
    App.js
    App.css
    index.js
    whitelist.json
    contracts/
        NftMembership.json
        sepolia.json

public/
    index.html

.env

### APP.JS

Contains all wallet connection logic, contract interaction, Merkle proof generation, and UI rendering.

### WHITELIST.JSON

Contains the array of whitelisted wallet addresses. Update this file with client addresses before deployment. The dashboard automatically generates the correct Merkle root and proofs from this file.

### ENV

Contains the Alchemy RPC URL used for all read operations.


## INSTALLATION

### CLONE THE REPOSITORY:

git clone https://github.com/Ktredway0128/nft-membership-dashboard
cd nft-membership-dashboard

### INSTALL DEPENDENCIES:

npm install

### START THE DEVELOPMENT SERVER:

npm start


## ENVIRONMENT SETUP

Create a .env file in the root directory:

REACT_APP_ALCHEMY_URL=YOUR_SEPOLIA_ALCHEMY_URL

This value allows the dashboard to:

- Read contract data directly from the blockchain via Alchemy
- Bypass MetaMask's RPC for all read operations


## HOW TO USE

### CONNECTING YOUR WALLET

1. Make sure MetaMask is installed in your browser
2. Switch MetaMask to the Sepolia test network
3. Click Connect Wallet
4. Approve the connection in MetaMask

### MINTING A WHITELIST PASS

1. Connect your whitelisted wallet
2. Wait for the admin to open the whitelist phase
3. The dashboard automatically detects your whitelist status
4. Click Mint Whitelist Pass and confirm in MetaMask
5. Your pass appears in Your Passes after confirmation

### MINTING A PUBLIC PASS

1. Connect your wallet
2. Wait for the admin to open the public phase
3. Click Mint Pass and confirm in MetaMask
4. Your pass appears in Your Passes after confirmation

### ADMIN — OPENING PHASES

1. Connect the admin wallet
2. Open the Admin Panel and click Show
3. Click Advance Phase to move from Paused to Whitelist to Public
4. Phase advancement is permanent and cannot be reversed

### ADMIN — UPDATING THE WHITELIST

1. Update src/whitelist.json with the new address list
2. The dashboard automatically computes the new Merkle root
3. Copy the displayed root from the Update Merkle Root section
4. Paste it into the input field and click Update
5. The new whitelist is active on-chain immediately

### ADMIN — WITHDRAWING ETH

1. Connect the admin wallet
2. Open the Admin Panel
3. Note the Contract Balance displayed in the Withdraw ETH section
4. Enter the recipient address and click Withdraw
5. All collected ETH is transferred to the recipient


## MINTING PHASES

Paused → Whitelist → Public → Sold Out

| Phase | Who Can Mint | Price |
|-------|-------------|-------|
| Paused | Nobody | — |
| Whitelist | Whitelisted addresses only, one per wallet | Whitelist price |
| Public | Anyone | Public price |
| Sold Out | Nobody | — |


## WHITELIST ARCHITECTURE

The whitelist uses a Merkle tree for gas-efficient on-chain verification. The full address list lives in whitelist.json on the frontend. The dashboard generates Merkle proofs client-side and submits them with each whitelist mint transaction. Only a single 32-byte root hash is stored on-chain regardless of how many addresses are whitelisted.

To update the whitelist:
1. Edit whitelist.json
2. Copy the new root from the admin panel
3. Update the on-chain root via the admin panel

No backend or off-chain service is required.


## PROVIDER ARCHITECTURE

The dashboard uses a dual-provider setup for optimal performance and reliability:

| Provider | Purpose |
|----------|---------|
| MetaMask (Web3Provider) | Signs and broadcasts all write transactions |
| Alchemy (JsonRpcProvider) | Handles all read operations |

This separation ensures reads are fast and reliable while writes are always signed by the user's wallet.


## SEPOLIA TESTNET DEPLOYMENT

| Contract | Address | Etherscan |
|----------|---------|-----------|
| NftMembership | TO_BE_UPDATED | View on Etherscan |

Deployed: 4/14/2026


## EXAMPLE CONFIGURATION

Example parameters used with this dashboard:

- Token Name: Membership Pass
- Token Symbol: PASS
- Max Supply: 100
- Public Mint Price: 0.05 ETH
- Whitelist Mint Price: 0.03 ETH
- Base URI: ipfs://YOUR_CID_HERE/


## SECURITY PRACTICES

The dashboard enforces security at two levels:

**UI Level**
- Mint button hidden when phase is inactive
- Mint button grayed out when paused or sold out
- Whitelist button hidden for non-whitelisted wallets
- Admin panel hidden from non-admin wallets
- Network check prevents connection on wrong chain
- Input validation prevents invalid transactions

**Contract Level**
- All role checks enforced by the smart contract
- The UI is a convenience layer — the contract is the source of truth
- No transaction can bypass the contract's access control
- Phase advancement is forward-only and cannot be reversed
- Merkle proof verification prevents unauthorized whitelist minting
- OpenZeppelin ERC-721 framework used across thousands of production projects


## EXAMPLE USE CASES

This dashboard architecture can support many types of projects:

- Early investor credentials for token launches
- Community membership passes for DAOs and protocols
- On-chain access credentials for gated platforms
- Protocol access passes for DeFi applications
- Whitelist passes for future token sales or airdrops
- Contributor badges for open source or DAO teams


## FUTURE ENHANCEMENTS

This dashboard serves as an optional add-on frontend layer in a larger Web3 infrastructure package.

Possible upgrades include:

- NFT image display using IPFS metadata
- Transfer pass functionality between wallets
- Holder leaderboard showing top pass holders
- Tiered membership pass support
- Mainnet deployment
- Multi-chain support


## AUTHOR

Kyle Tredway

Smart Contract Developer / Token Launch Specialist


## LICENSE

MIT License