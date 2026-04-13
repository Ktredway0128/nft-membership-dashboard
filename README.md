# TOKEN GOVERNANCE DASHBOARD

[![Verified on Etherscan](https://img.shields.io/badge/Etherscan-Verified-brightgreen)](https://sepolia.etherscan.io/address/0xA7a65E7Ca137977d36e804034bD059B1eD713591#code)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-blue)](https://token-governance-dashboard.netlify.app/)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Ethers.js](https://img.shields.io/badge/Ethers.js-5.8-purple)
![Network](https://img.shields.io/badge/Network-Sepolia-green)

Built by [Tredway Development](https://kyle-tredway-portfolio.netlify.app/) — professional Solidity smart contract packages for Web3 companies.

A production-ready React frontend for interacting with a deployed on-chain governance system built on the OpenZeppelin Governor framework.

> ⚠️ This dashboard is connected to the Sepolia test network for demonstration purposes only.
> These contracts have not been professionally audited. A full security audit is strongly recommended before any mainnet deployment.

This project demonstrates the full lifecycle of a token governance dashboard including:

- Wallet connection and network validation
- Voting power activation and delegation management
- Proposal creation with multiple action types
- Token-weighted voting with For, Against, and Abstain options
- Real-time proposal state tracking across the full governance lifecycle
- Timelock queue and execution management
- Proposal history with Active and All filter views
- Transaction feedback with Etherscan verification

The repository represents the frontend layer of an ERC-20 Token Governance package, designed to work alongside the full token infrastructure suite as part of the Protocol tier.


## PROJECT GOALS

The purpose of this project is to demonstrate how a modern on-chain governance dashboard should be designed for real-world use.

The dashboard includes common features required by token governance interfaces:

- Full proposal lifecycle management from creation to execution
- Token-weighted voting with quorum enforcement
- Timelock-controlled execution with mandatory delay
- Role-based delegation with self-delegate and delegate-to-address options
- Friendly proposal creation with preset action types
- Live vote count tracking with visual progress bar
- Proposal history with active and all filter views
- User-friendly transaction status and error handling
- Etherscan transaction verification

These patterns are widely used in production DeFi governance applications.


## DASHBOARD FEATURES

### WALLET CONNECTION

The dashboard connects to MetaMask and automatically detects the connected wallet's token balance, voting power, and delegation status.
A network check ensures the user is on the correct chain before connecting.
The UI refreshes automatically when the wallet is switched inside MetaMask.
Supports both Sepolia testnet and Localhost 8545 for local development.

### LIVE GOVERNANCE DATA

On connection, the dashboard loads the following data directly from the contracts:

- Token Balance — STK tokens held by the connected wallet
- Voting Power — active voting power after delegation
- Proposal Threshold — minimum tokens required to create a proposal
- Quorum Required — percentage of total supply that must participate for a proposal to pass
- Voting Delay — blocks before voting opens after proposal creation
- Voting Period — blocks that voting remains open
- Timelock Delay — mandatory seconds between queue and execution
- Total Proposals — number of proposals created so far

### VOTING POWER CARD

The voting power card guides the user through the delegation setup:

- Not yet delegated — displays a prominent Activate My Voting Power button and an optional collapsed delegate-to-address field
- Delegated — displays active status, delegated address, and a collapsed change delegation toggle

Delegation is a one-time setup. Once activated the user can vote on all future proposals without repeating this step.

### GOVERNANCE SETTINGS

Displays the core governance parameters directly from the contract:

- Voting Delay in days
- Voting Period in weeks
- Timelock Delay in days
- Total Proposals count

### CREATE PROPOSAL

The proposal creation form supports multiple actions per proposal and four preset action types:

| Action Type | Description |
|-------------|-------------|
| Transfer Tokens | Transfer STK from the governance treasury to a recipient |
| Mint Tokens | Mint new STK tokens to a recipient address |
| Update a Setting | Call any single-value setter function on any permitted contract |
| Custom Action (Advanced) | Manually specify any contract, function signature, and parameters |

Each proposal requires a title, description, and at least one action. The Submit Proposal button is disabled if the wallet has not delegated or does not meet the proposal threshold.

### PROPOSALS LIST

All proposals are displayed with full lifecycle information:

- Proposal title and description
- Color-coded state badge — Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed
- Proposal ID and snapshot block
- Voting deadline block
- Quorum status indicator
- Visual vote bar showing For, Against, and Abstain percentages
- Individual vote counts for For, Against, and Abstain

**Filter Toggle:**
- Active — shows only Pending, Active, Succeeded, and Queued proposals
- All — shows complete proposal history including Executed, Defeated, and Canceled

### VOTING

When a proposal is Active the voting interface appears:

- Optional reason field for on-chain vote explanation
- For button — green
- Against button — red
- Abstain button — gray

After voting the buttons are replaced with a confirmation message. Double voting is prevented at both the UI and contract level.

### PROPOSAL LIFECYCLE BUTTONS

Each proposal displays the appropriate action button based on its current state:

| State | Available Action |
|-------|-----------------|
| Pending | Cancel Proposal |
| Active | Cast Vote |
| Succeeded | Queue in Timelock |
| Queued | Execute Proposal |
| Executed | Confirmation message |
| Defeated | Defeat message |
| Canceled | Canceled message |
| Expired | Expired message |

### ACTION SUMMARY

Each proposal card displays a summary of its encoded actions showing the number of actions and target contract addresses. Known contracts are labeled automatically — Token Contract, Timelock, and Governance.

### TRANSACTION FEEDBACK

Every action triggers a color-coded status bar with a loading spinner:

| Action | Status Color |
|--------|-------------|
| Creating Proposal | Brown |
| Casting Vote | Matches vote button — green, red, or gray |
| Activating Voting Power | Brown |
| Queueing Proposal | Navy Blue |
| Executing Proposal | Dark Navy |
| Success | Bright Green |
| Error | Red |

On success a clickable Etherscan link appears for immediate transaction verification.

### ERROR HANDLING

User-friendly error messages are displayed for common failure cases:

- Transaction rejected in MetaMask
- Insufficient funds
- Insufficient tokens to create a proposal
- Voting is not currently active on this proposal
- You have already voted on this proposal
- Proposal has not succeeded yet
- Timelock delay has not passed yet
- Invalid proposal configuration
- General transaction failure


## TECHNOLOGY STACK

This project was built using the following tools:

- React – Frontend framework
- Ethers.js – Contract interaction library
- MetaMask – Wallet provider
- Alchemy – Ethereum RPC provider for reads
- Tailwind CSS – Utility-first styling
- Sepolia Test Network – Deployment environment


## PROJECT STRUCTURE

```
src/
    App.js
    App.css
    index.js
    contracts/
        TokenGovernance.json
        TimelockController.json
        SampleToken.json
        sepolia.json

public/
    index.html

.env
```

### APP.JS

Contains all wallet connection logic, contract interaction, proposal encoding, and UI rendering.

### ENV

Contains the Alchemy RPC URL used for all read operations.


## INSTALLATION

### CLONE THE REPOSITORY:

```bash
git clone https://github.com/Ktredway0128/token-governance-dashboard
cd token-governance-dashboard
```

### INSTALL DEPENDENCIES:

```bash
npm install
```

### START THE DEVELOPMENT SERVER:

```bash
npm start
```


## ENVIRONMENT SETUP

Create a `.env` file in the root directory:

```
REACT_APP_ALCHEMY_URL=YOUR_SEPOLIA_ALCHEMY_URL
```

This value allows the dashboard to:

- Read governance data directly from the blockchain via Alchemy
- Bypass MetaMask's RPC for all read operations


## HOW TO USE

### CONNECTING YOUR WALLET

1. Make sure MetaMask is installed in your browser
2. Switch MetaMask to the **Sepolia** test network
3. Click **Connect Wallet**
4. Approve the connection in MetaMask

### ACTIVATING VOTING POWER

1. Connect your wallet
2. Click **Activate My Voting Power** to self-delegate
3. Confirm the transaction in MetaMask
4. Your voting power is now active for all future proposals

> Note: You must activate voting power before the snapshot block of any proposal you wish to vote on. Delegating after a proposal is created will not apply to that proposal.

### CREATING A PROPOSAL

1. Connect your wallet with at least 1,000 STK voting power
2. Enter a proposal title and description
3. Select an action type and fill in the required fields
4. Click **Add Another Action** to include multiple actions in one proposal
5. Click **Submit Proposal** and confirm in MetaMask

### VOTING ON A PROPOSAL

1. Wait for the proposal to move from Pending to Active
2. Optionally enter a reason for your vote
3. Click **For**, **Against**, or **Abstain**
4. Confirm the transaction in MetaMask

### QUEUEING A PASSED PROPOSAL

1. After the voting period ends and the proposal Succeeded
2. Click **Queue in Timelock**
3. Confirm the transaction in MetaMask
4. The proposal enters the 2 day timelock delay

### EXECUTING A PROPOSAL

1. After the 2 day timelock delay has passed
2. Click **Execute Proposal**
3. Confirm the transaction in MetaMask
4. The proposal actions are executed on-chain automatically


## GOVERNANCE LIFECYCLE

```
Created → Pending → Active → Succeeded → Queued → Executed
                           ↘ Defeated
                  ↘ Canceled
```

| Stage | Duration | Description |
|-------|----------|-------------|
| Pending | ~1 day | Voting delay — community reviews the proposal |
| Active | ~1 week | Voting window — token holders cast votes |
| Succeeded | Immediate | Quorum reached and For votes won |
| Queued | 2 days | Timelock delay — community can review before execution |
| Executed | Permanent | Proposal actions carried out on-chain |


## PROPOSAL ACTION TYPES

### TRANSFER TOKENS

Transfers STK tokens from the governance treasury (timelock) to a recipient address. Requires the timelock to hold sufficient token balance.

### MINT TOKENS

Mints new STK tokens to a recipient address. Requires the timelock to hold MINTER_ROLE on the token contract.

### UPDATE A SETTING

Calls any single-value setter function on any contract where the timelock holds the appropriate role. Examples include updating reward periods, fee parameters, or protocol settings.

### CUSTOM ACTION (ADVANCED)

Allows technically experienced proposers to call any function on any contract by specifying the target address, function signature, ETH value, and parameters as a JSON array.


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
| SampleToken | `0x6259A01559E34aF1b2e16cF4396c2aDFAFa8a83B` | [View on Etherscan](https://sepolia.etherscan.io/address/0x6259A01559E34aF1b2e16cF4396c2aDFAFa8a83B#code) |
| TimelockController | `0x42FFC12FaFbF81D04E97Fce3bB08d4e8c10c201d` | [View on Etherscan](https://sepolia.etherscan.io/address/0x42FFC12FaFbF81D04E97Fce3bB08d4e8c10c201d#code) |
| TokenGovernance | `0xA7a65E7Ca137977d36e804034bD059B1eD713591` | [View on Etherscan](https://sepolia.etherscan.io/address/0xA7a65E7Ca137977d36e804034bD059B1eD713591#code) |

Deployed: 2026-04-13


## EXAMPLE TOKEN CONFIGURATION

Example parameters used with this dashboard:

- Token Name: Sample Token
- Token Symbol: STK
- Token Cap: 1,000,000 STK
- Initial Supply: 100,000 STK
- Proposal Threshold: 1,000 STK
- Quorum: 4% of total supply
- Voting Delay: 1 day
- Voting Period: 1 week
- Timelock Delay: 2 days


## SECURITY PRACTICES

The dashboard enforces security at two levels:

**UI Level**
- Submit Proposal disabled below proposal threshold
- Submit Proposal disabled before delegation
- Voting buttons hidden after already voted
- Network check prevents connection on wrong chain
- Input validation prevents invalid transactions

**Contract Level**
- All role checks enforced by the smart contract
- The UI is a convenience layer — the contract is the source of truth
- No transaction can bypass the contract's access control
- Timelock enforces mandatory delay between queue and execution
- ERC20Votes checkpointing prevents flash loan voting attacks
- OpenZeppelin Governor framework used by major DeFi protocols


## EXAMPLE USE CASES

This dashboard architecture can support many types of projects:

- Protocol parameter updates via token holder vote
- Treasury fund allocation and spending proposals
- Smart contract upgrade approvals
- Community grant programs
- DAO operational decisions
- Fee structure changes


## FUTURE ENHANCEMENTS

This dashboard serves as the sixth and final frontend layer in a larger Web3 infrastructure package.

Possible upgrades include:

- Delegate leaderboard showing top voting power holders
- Proposal discussion thread integration
- Email or push notifications for new proposals
- Mainnet deployment
- Multi-chain governance support


## AUTHOR

Kyle Tredway

Smart Contract Developer / Token Launch Specialist


## LICENSE

MIT License