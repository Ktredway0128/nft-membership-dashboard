import { Buffer } from 'buffer';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import './App.css';
import NftMembershipABI from './contracts/NftMembership.json';
import sepoliaDeployment from './contracts/sepolia.json';
import whitelist from './whitelist.json';

window.Buffer = Buffer;

const NFT_ADDRESS = sepoliaDeployment.NftMembership;
const NFT_ABI = NftMembershipABI.abi;

// Dark gold for buttons and accents
const GOLD = '#9a6f00';
const GOLD_DARK = '#7a5500';

const STATUS_COLORS = {
  admin:   { backgroundColor: '#8b6508',               color: '#fff' },
  mint:    { backgroundColor: '#8b6508',               color: '#fff' },
  pause:   { backgroundColor: '#dc2626',               color: '#fff' },
  unpause: { backgroundColor: '#16a34a',               color: '#fff' },
  success: { backgroundColor: '#22c55e',               color: '#fff' },
  error:   { backgroundColor: '#dc2626',               color: '#fff' },
  default: { backgroundColor: 'rgba(255,255,255,0.5)', color: '#0f2d5e' },
};

const PHASE_LABELS = ['Paused', 'Whitelist', 'Public'];
const PHASE_COLORS = {
  Paused:    '#94a3b8',
  Whitelist: '#b8860b',
  Public:    '#22c55e',
};

function getMerkleProof(address) {
  if (!address) return [];
  const checksummed = ethers.utils.getAddress(address);
  const leaves = whitelist.map(addr => keccak256(ethers.utils.getAddress(addr)));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return tree.getHexProof(keccak256(checksummed));
}

function getMerkleRoot() {
  const leaves = whitelist.map(addr => keccak256(ethers.utils.getAddress(addr)));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return tree.getHexRoot();
}


const parseError = (err) => {
  if (err.message.includes('user rejected'))              return 'Transaction rejected in MetaMask.';
  if (err.message.includes('insufficient funds'))         return 'Insufficient funds for this transaction.';
  if (err.message.includes('Whitelist phase not active')) return 'Whitelist phase is not currently active.';
  if (err.message.includes('Public phase not active'))    return 'Public phase is not currently active.';
  if (err.message.includes('Already claimed'))            return 'You have already used your whitelist mint.';
  if (err.message.includes('Invalid Merkle proof'))       return 'Your address is not on the whitelist.';
  if (err.message.includes('Insufficient payment'))       return 'Insufficient ETH sent for this mint.';
  if (err.message.includes('Max supply reached'))         return 'Max supply has been reached.';
  if (err.message.includes('Already at final phase'))     return 'Already at the final phase.';
  if (err.message.includes('Nothing to withdraw'))        return 'No ETH to withdraw.';
  return 'Transaction failed. Please try again.';
};

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255,255,255,0.4)',
      borderTop: '2px solid #fff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      marginRight: '10px',
      verticalAlign: 'middle',
    }} />
  );
}

function App() {
  const [nftContract,     setNftContract]     = useState(null);
  const [readNft,         setReadNft]         = useState(null);
  const [account,         setAccount]         = useState(null);
  const [provider,        setProvider]        = useState(null);

  // Contract data
  const [currentPhase,     setCurrentPhase]     = useState(0);
  const [totalMinted,      setTotalMinted]      = useState('0');
  const [maxSupply,        setMaxSupply]        = useState('0');
  const [mintPrice,        setMintPrice]        = useState('0');
  const [whitelistPrice,   setWhitelistPrice]   = useState('0');
  const [merkleRoot,       setMerkleRoot]       = useState('');
  const [userTokenIds,     setUserTokenIds]     = useState([]);
  const [whitelistClaimed, setWhitelistClaimed] = useState(false);
  const [contractBalance,  setContractBalance]  = useState('0');

  // Admin inputs
  const [newMintPrice,      setNewMintPrice]      = useState('');
  const [newWhitelistPrice, setNewWhitelistPrice] = useState('');
  const [newMerkleRoot,     setNewMerkleRoot]     = useState('');
  const [newBaseURI,        setNewBaseURI]        = useState('');
  const [withdrawAddress,   setWithdrawAddress]   = useState('');
  const [recoverToken,      setRecoverToken]      = useState('');
  const [recoverTo,         setRecoverTo]         = useState('');
  const [recoverAmount,     setRecoverAmount]     = useState('');
  const [isAdmin,           setIsAdmin]           = useState(false);
  const [showAdminPanel,    setShowAdminPanel]    = useState(false);

  // Status
  const [status,      setStatus]      = useState('');
  const [statusStyle, setStatusStyle] = useState(STATUS_COLORS.default);
  const [isLoading,   setIsLoading]   = useState(false);
  const [txHash,      setTxHash]      = useState('');
  const [isPaused,    setIsPaused]    = useState(false);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus('MetaMask not found. Please install it.');
        setStatusStyle(STATUS_COLORS.error);
        return;
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7' && chainId !== '0x7a69') {
        setStatus('Please switch MetaMask to Sepolia or Localhost 8545.');
        setStatusStyle(STATUS_COLORS.error);
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const metaMaskProvider = new ethers.providers.Web3Provider(window.ethereum);
      const _signer  = metaMaskProvider.getSigner();
      const _account = await _signer.getAddress();

      const isLocalhost = chainId === '0x7a69';
      const rpcProvider = isLocalhost
        ? new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545')
        : new ethers.providers.JsonRpcProvider(
            process.env.REACT_APP_ALCHEMY_URL,
            { name: 'sepolia', chainId: 11155111 }
          );

      const _nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, _signer);
      const _readNft     = new ethers.Contract(NFT_ADDRESS, NFT_ABI, rpcProvider);

      setNftContract(_nftContract);
      setReadNft(_readNft);
      setAccount(_account);
      setProvider(rpcProvider);

      await loadDashboardData(_readNft, _account, rpcProvider);
    } catch (err) {
      setStatus('Error connecting wallet: ' + err.message);
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountChange = async (accounts) => {
      setStatus('');
      setTxHash('');
      if (accounts.length === 0) {
        setAccount(null);
        setNftContract(null);
        setReadNft(null);
        setProvider(null);
        setCurrentPhase(0);
        setTotalMinted('0');
        setMaxSupply('0');
        setMintPrice('0');
        setWhitelistPrice('0');
        setMerkleRoot('');
        setUserTokenIds([]);
        setWhitelistClaimed(false);
        setIsAdmin(false);
        setContractBalance('0');
        setIsPaused(false);
      } else {
        await connectWallet();
      }
    };
    window.ethereum.on('accountsChanged', handleAccountChange);
    return () => window.ethereum.removeListener('accountsChanged', handleAccountChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async (_readNft, _account, _provider) => {
    try {
      const _phase           = await _readNft.currentPhase();
      const _totalMinted     = await _readNft.totalMinted();
      const _maxSupply       = await _readNft.maxSupply();
      const _mintPrice       = await _readNft.mintPrice();
      const _whitelistPrice  = await _readNft.whitelistMintPrice();
      const _merkleRoot      = await _readNft.merkleRoot();
      const _claimed         = await _readNft.whitelistClaimed(_account);
      const _contractBalance = await _provider.getBalance(NFT_ADDRESS);
      const _isPaused        = await _readNft.paused();

      setCurrentPhase(_phase);
      setTotalMinted(_totalMinted.toString());
      setMaxSupply(_maxSupply.toString());
      setMintPrice(ethers.utils.formatEther(_mintPrice));
      setWhitelistPrice(ethers.utils.formatEther(_whitelistPrice));
      setMerkleRoot(_merkleRoot);
      setWhitelistClaimed(_claimed);
      setContractBalance(ethers.utils.formatEther(_contractBalance));
      setIsPaused(_isPaused);

      const ADMIN_ROLE = await _readNft.ADMIN_ROLE();
      const _isAdmin = await _readNft.hasRole(ADMIN_ROLE, _account);
      setIsAdmin(_isAdmin);

      try {
        const filterTo   = _readNft.filters.Transfer(null, _account);
        const filterFrom = _readNft.filters.Transfer(_account, null);
        const toEvents   = await _readNft.queryFilter(filterTo);
        const fromEvents = await _readNft.queryFilter(filterFrom);

        const received = new Set(toEvents.map(e => e.args.tokenId.toString()));
        const sent     = new Set(fromEvents.map(e => e.args.tokenId.toString()));
        const owned    = [...received].filter(id => !sent.has(id));
        setUserTokenIds(owned);
      } catch {
        setUserTokenIds([]);
      }

    } catch (err) {
      setStatus('Error loading data: ' + err.message);
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handleRefresh = async () => {
    if (!readNft || !account) return;
    setStatus('Refreshing...');
    setStatusStyle(STATUS_COLORS.default);
    await loadDashboardData(readNft, account, provider);
    setStatus('');
  };

  // ─────────────────────────────────────────
  // Minting
  // ─────────────────────────────────────────

  const handleWhitelistMint = async () => {
    try {
      const proof = getMerkleProof(account);
      if (proof.length === 0) {
        setStatus('Your address is not on the whitelist.');
        setStatusStyle(STATUS_COLORS.error);
        return;
      }
      setStatus('Minting whitelist pass...');
      setStatusStyle(STATUS_COLORS.mint);
      setIsLoading(true);
      const tx = await nftContract.whitelistMint(proof, {
        value: ethers.utils.parseEther(whitelistPrice)
      });
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Whitelist pass minted successfully!');
      setStatusStyle(STATUS_COLORS.success);
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handlePublicMint = async () => {
    try {
      setStatus('Minting membership pass...');
      setStatusStyle(STATUS_COLORS.mint);
      setIsLoading(true);
      const tx = await nftContract.publicMint({
        value: ethers.utils.parseEther(mintPrice)
      });
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Membership pass minted successfully!');
      setStatusStyle(STATUS_COLORS.success);
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  // ─────────────────────────────────────────
  // Admin
  // ─────────────────────────────────────────

  const handleAdvancePhase = async () => {
    try {
      setStatus('Advancing phase...');
      setStatusStyle(STATUS_COLORS.admin);
      setIsLoading(true);
      const tx = await nftContract.advancePhase();
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Phase advanced successfully!');
      setStatusStyle(STATUS_COLORS.success);
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handlePause = async () => {
    try {
      setStatus('Pausing contract...');
      setStatusStyle(STATUS_COLORS.pause);
      setIsLoading(true);
      const tx = await nftContract.pause();
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Contract paused.');
      setStatusStyle(STATUS_COLORS.success);
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handleUnpause = async () => {
    try {
      setStatus('Unpausing contract...');
      setStatusStyle(STATUS_COLORS.unpause);
      setIsLoading(true);
      const tx = await nftContract.unpause();
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Contract unpaused.');
      setStatusStyle(STATUS_COLORS.success);
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handleSetMintPrice = async () => {
    if (!newMintPrice) return;
    try {
      setStatus('Updating mint price...');
      setStatusStyle(STATUS_COLORS.admin);
      setIsLoading(true);
      const tx = await nftContract.setMintPrice(ethers.utils.parseEther(newMintPrice));
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Mint price updated!');
      setStatusStyle(STATUS_COLORS.success);
      setNewMintPrice('');
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handleSetWhitelistPrice = async () => {
    if (!newWhitelistPrice) return;
    try {
      setStatus('Updating whitelist price...');
      setStatusStyle(STATUS_COLORS.admin);
      setIsLoading(true);
      const tx = await nftContract.setWhitelistMintPrice(ethers.utils.parseEther(newWhitelistPrice));
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Whitelist price updated!');
      setStatusStyle(STATUS_COLORS.success);
      setNewWhitelistPrice('');
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handleSetMerkleRoot = async () => {
    if (!newMerkleRoot) return;
    try {
      setStatus('Updating Merkle root...');
      setStatusStyle(STATUS_COLORS.admin);
      setIsLoading(true);
      const tx = await nftContract.setMerkleRoot(newMerkleRoot);
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Merkle root updated!');
      setStatusStyle(STATUS_COLORS.success);
      setNewMerkleRoot('');
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handleSetBaseURI = async () => {
    if (!newBaseURI) return;
    try {
      setStatus('Updating base URI...');
      setStatusStyle(STATUS_COLORS.admin);
      setIsLoading(true);
      const tx = await nftContract.setBaseURI(newBaseURI);
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('Base URI updated!');
      setStatusStyle(STATUS_COLORS.success);
      setNewBaseURI('');
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !ethers.utils.isAddress(withdrawAddress)) {
      setStatus('Please enter a valid withdrawal address.');
      setStatusStyle(STATUS_COLORS.error);
      return;
    }
    try {
      setStatus('Withdrawing ETH...');
      setStatusStyle(STATUS_COLORS.admin);
      setIsLoading(true);
      const tx = await nftContract.withdraw(withdrawAddress);
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('ETH withdrawn successfully!');
      setStatusStyle(STATUS_COLORS.success);
      setWithdrawAddress('');
      await loadDashboardData(readNft, account, provider);
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const handleRecoverERC20 = async () => {
    if (!recoverToken || !recoverTo || !recoverAmount) {
      setStatus('Please fill in all recovery fields.');
      setStatusStyle(STATUS_COLORS.error);
      return;
    }
    try {
      setStatus('Recovering ERC-20 tokens...');
      setStatusStyle(STATUS_COLORS.admin);
      setIsLoading(true);
      const tx = await nftContract.recoverERC20(
        recoverToken,
        recoverTo,
        ethers.utils.parseUnits(recoverAmount, 18)
      );
      await tx.wait();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setTxHash(tx.hash);
      setStatus('ERC-20 tokens recovered!');
      setStatusStyle(STATUS_COLORS.success);
      setRecoverToken('');
      setRecoverTo('');
      setRecoverAmount('');
    } catch (err) {
      setIsLoading(false);
      setTxHash('');
      setStatus(parseError(err));
      setStatusStyle(STATUS_COLORS.error);
    }
  };

  const phaseLabel = PHASE_LABELS[currentPhase] || 'Unknown';
  const supplyPct  = maxSupply > 0 ? ((Number(totalMinted) / Number(maxSupply)) * 100).toFixed(1) : '0';
  const isWhitelisted = getMerkleProof(account).length > 0;
  const isSoldOut = Number(totalMinted) >= Number(maxSupply);

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="shimmer-bg"></div>
      <div className="content min-h-screen p-8">
        <div className="max-w-5xl mx-auto" style={{ position: 'relative' }}>

          {/* TD LOGO */}
          <img src="/td-logo-justtd.png" alt="Tredway Development"
            style={{ position: 'absolute', top: '0', left: '-110px', height: '35px' }} />

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-5xl font-bold tracking-tight" style={{ color: '#0f4c5c' }}>
                NFT <span style={{ color: GOLD }}>Membership</span> Dashboard
              </h1>
              <p className="text-sm mt-2 uppercase tracking-widest font-medium" style={{ color: '#64748b' }}>
                On-Chain Membership Pass Management Interface
              </p>
            </div>
            {account && (
              <div className="text-right">
                <button onClick={handleRefresh} disabled={isLoading}
                  className="text-xs font-mono px-3 py-1 rounded-lg mb-2 transition-all hover:opacity-80"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    color: '#0f4c5c',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'block',
                    marginLeft: 'auto',
                  }}>
                  ↻ Refresh
                </button>
                <p className="text-xs font-mono" style={{ color: '#64748b' }}>Connected</p>
                <p className="text-sm font-mono font-semibold" style={{ color: '#0f4c5c' }}>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            )}
          </div>
          <hr style={{ borderColor: 'rgba(15,76,92,0.2)', marginBottom: '2rem' }} />

          {/* STATUS BAR */}
          {status && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
              style={statusStyle}>
              {isLoading && <Spinner />}
              <span>{status}</span>
              {txHash && !isLoading && (
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: '#fff', textDecoration: 'underline', marginLeft: '8px', fontWeight: 'bold' }}>
                  View on Etherscan ↗
                </a>
              )}
            </div>
          )}

          {!account ? (
            <div className="text-center py-32">
              <div className="mb-6 text-6xl">🎫</div>
              <button onClick={connectWallet}
                className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:opacity-90 mb-6 btn-hover"
                style={{ backgroundColor: GOLD }}>
                Connect Wallet
              </button>
              <p className="text-3xl font-bold mb-3 tracking-tight" style={{ color: '#0f4c5c' }}>
                Connect your wallet to manage membership passes
              </p>
              <p className="text-sm uppercase tracking-widest" style={{ color: '#64748b' }}>
                Make sure you're on the Sepolia test network or Localhost 8545
              </p>
            </div>
          ) : (
            <>
              {/* STATS CARDS */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                  { label: 'Current Phase', value: phaseLabel, valueColor: PHASE_COLORS[phaseLabel] },
                  { label: 'Total Minted',  value: `${totalMinted} / ${maxSupply}` },
                  { label: 'Supply Minted', value: `${supplyPct}%` },
                  { label: 'Passes Owned',  value: userTokenIds.length },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl p-4 shadow-sm card-hover"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.55)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.8)',
                      borderLeft: `4px solid ${GOLD}`,
                    }}>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>{stat.label}</p>
                    <p className="text-lg font-bold" style={{ color: stat.valueColor || '#0f4c5c' }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* SUPPLY BAR */}
              <div className="rounded-2xl p-6 mb-8 shadow-sm card-hover"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  borderLeft: `4px solid ${GOLD}`,
                }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: '#0f4c5c' }}>Supply</h2>
                <div style={{ height: '8px', borderRadius: '9999px', overflow: 'hidden', backgroundColor: 'rgba(15,76,92,0.1)', marginBottom: '8px' }}>
                  <div style={{
                    width: `${supplyPct}%`,
                    height: '100%',
                    backgroundColor: GOLD,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <div className="flex justify-between">
                  <p className="text-xs" style={{ color: '#64748b' }}>{totalMinted} minted</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{Number(maxSupply) - Number(totalMinted)} remaining</p>
                </div>
              </div>

              {/* MINT CARD */}
              <div className="rounded-2xl p-6 mb-8 shadow-sm card-hover"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  borderLeft: `4px solid ${GOLD}`,
                }}>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#0f4c5c' }}>Mint a Pass</h2>
                <p className="text-xs uppercase tracking-wide mb-4" style={{ color: '#64748b' }}>
                  Phase: <span style={{ color: PHASE_COLORS[phaseLabel], fontWeight: 700 }}>{phaseLabel}</span>
                </p>

                {currentPhase === 0 && (
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    ⏸ Minting is currently paused. Check back when the whitelist phase opens.
                  </p>
                )}

                {currentPhase === 1 && (
                  <div>
                    <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                      Whitelist phase is active. Price: <strong>{whitelistPrice} ETH</strong> per pass.
                      {whitelistClaimed && (
                        <span style={{ color: '#22c55e' }}> ✅ You have already claimed your whitelist mint.</span>
                      )}
                    </p>
                    {!whitelistClaimed && (
                      <>
                        {isWhitelisted ? (
                          <>
                            <p className="text-xs mb-4" style={{ color: '#22c55e' }}>
                              ✅ Your wallet is on the whitelist.
                            </p>
                            {isSoldOut ? (
                              <div>
                                <button disabled
                                  className="px-6 py-3 rounded-xl font-semibold text-white"
                                  style={{ backgroundColor: GOLD, opacity: 0.4, cursor: 'not-allowed' }}>
                                  Sold Out
                                </button>
                                <p className="text-xs mt-2" style={{ color: '#dc2626' }}>
                                  ⚠️ All membership passes have been minted.
                                </p>
                              </div>
                            ) : isPaused ? (
                              <div>
                                <button disabled
                                  className="px-6 py-3 rounded-xl font-semibold text-white"
                                  style={{ backgroundColor: GOLD, opacity: 0.4, cursor: 'not-allowed' }}>
                                  Mint Whitelist Pass — {whitelistPrice} ETH
                                </button>
                                <p className="text-xs mt-2" style={{ color: '#dc2626' }}>
                                  ⚠️ Minting is currently paused.
                                </p>
                              </div>
                            ) : (
                              <button onClick={handleWhitelistMint} disabled={isLoading}
                                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 btn-hover"
                                style={{
                                  backgroundColor: GOLD,
                                  opacity: isLoading ? 0.6 : 1,
                                  cursor: isLoading ? 'not-allowed' : 'pointer',
                                }}>
                                Mint Whitelist Pass — {whitelistPrice} ETH
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm" style={{ color: '#dc2626' }}>
                            ✗ Your wallet is not on the whitelist.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {currentPhase === 2 && (
                  <div>
                    <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                      Public mint is open. Price: <strong>{mintPrice} ETH</strong> per pass.
                    </p>
                    {isSoldOut ? (
                      <div>
                        <button disabled
                          className="px-6 py-3 rounded-xl font-semibold text-white"
                          style={{ backgroundColor: GOLD, opacity: 0.4, cursor: 'not-allowed' }}>
                          Sold Out
                        </button>
                        <p className="text-xs mt-2" style={{ color: '#dc2626' }}>
                          ⚠️ All membership passes have been minted.
                        </p>
                      </div>
                    ) : isPaused ? (
                      <div>
                        <button disabled
                          className="px-6 py-3 rounded-xl font-semibold text-white"
                          style={{ backgroundColor: GOLD, opacity: 0.4, cursor: 'not-allowed' }}>
                          Mint Pass — {mintPrice} ETH
                        </button>
                        <p className="text-xs mt-2" style={{ color: '#dc2626' }}>
                          ⚠️ Minting is currently paused.
                        </p>
                      </div>
                    ) : (
                      <button onClick={handlePublicMint} disabled={isLoading}
                        className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 btn-hover"
                        style={{
                          backgroundColor: GOLD,
                          opacity: isLoading ? 0.6 : 1,
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}>
                        Mint Pass — {mintPrice} ETH
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* YOUR PASSES */}
              <div className="rounded-2xl p-6 mb-8 shadow-sm card-hover"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  borderLeft: `4px solid ${GOLD}`,
                }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: '#0f4c5c' }}>Your Passes</h2>
                {userTokenIds.length === 0 ? (
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    You don't own any membership passes yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {userTokenIds.map((id) => (
                      <div key={id} className="rounded-xl px-4 py-3 text-center"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          border: `1px solid ${GOLD}40`,
                          minWidth: '80px',
                        }}>
                        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Pass</p>
                        <p className="text-lg font-bold" style={{ color: GOLD }}>#{id}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MINT SETTINGS */}
              <div className="rounded-2xl p-6 mb-8 shadow-sm card-hover"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  borderLeft: `4px solid ${GOLD}`,
                }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: '#0f4c5c' }}>Mint Settings</h2>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Public Mint Price', value: mintPrice + ' ETH' },
                    { label: 'Whitelist Price',   value: whitelistPrice + ' ETH' },
                    { label: 'Max Supply',        value: maxSupply },
                    { label: 'Merkle Root',       value: merkleRoot.slice(0, 10) + '...' },
                  ].map((setting) => (
                    <div key={setting.label}>
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>{setting.label}</p>
                      <p className="text-sm font-bold" style={{ color: '#0f4c5c' }}>{setting.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADMIN PANEL */}
              {isAdmin && (
                <div className="rounded-2xl p-6 mb-8 shadow-sm card-hover"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    borderLeft: `4px solid ${GOLD}`,
                  }}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold" style={{ color: '#0f4c5c' }}>Admin Panel</h2>
                    <button
                      onClick={() => setShowAdminPanel(prev => !prev)}
                      className="text-xs font-semibold transition-all hover:opacity-80"
                      style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showAdminPanel ? '▲ Hide' : '▼ Show'}
                    </button>
                  </div>

                  {showAdminPanel && (
                    <div>

                      {/* PHASE */}
                      <div className="mb-6 p-4 rounded-xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(15,76,92,0.15)' }}>
                        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: '#64748b' }}>Phase Control</p>
                        <p className="text-sm mb-3" style={{ color: '#64748b' }}>
                          Current phase: <strong style={{ color: PHASE_COLORS[phaseLabel] }}>{phaseLabel}</strong>
                          {currentPhase < 2 && ` — clicking advance will move to ${PHASE_LABELS[currentPhase + 1]}`}
                          {currentPhase === 2 && ' — already at final phase'}
                        </p>
                        <div className="flex gap-3">
                          <button onClick={handleAdvancePhase} disabled={isLoading || currentPhase >= 2}
                            className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                            style={{
                              backgroundColor: GOLD,
                              opacity: (isLoading || currentPhase >= 2) ? 0.6 : 1,
                              cursor: (isLoading || currentPhase >= 2) ? 'not-allowed' : 'pointer',
                            }}>
                            Advance Phase
                          </button>
                          <button onClick={handlePause} disabled={isLoading}
                            className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                            style={{
                              backgroundColor: '#dc2626',
                              opacity: isLoading ? 0.6 : 1,
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                            }}>
                            Pause
                          </button>
                          <button onClick={handleUnpause} disabled={isLoading}
                            className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                            style={{
                              backgroundColor: '#16a34a',
                              opacity: isLoading ? 0.6 : 1,
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                            }}>
                            Unpause
                          </button>
                        </div>
                      </div>

                      {/* UPDATE PRICES */}
                      <div className="mb-6 p-4 rounded-xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(15,76,92,0.15)' }}>
                        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: '#64748b' }}>Update Prices</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Public Mint Price (ETH)</p>
                            <div className="flex gap-2">
                              <input type="text" placeholder="e.g. 0.05"
                                value={newMintPrice}
                                onChange={(e) => setNewMintPrice(e.target.value)}
                                className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none"
                                style={{ borderColor: '#bae6fd', color: '#334155' }} />
                              <button onClick={handleSetMintPrice} disabled={isLoading}
                                className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                                style={{ backgroundColor: GOLD, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                                Update
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Whitelist Price (ETH)</p>
                            <div className="flex gap-2">
                              <input type="text" placeholder="e.g. 0.03"
                                value={newWhitelistPrice}
                                onChange={(e) => setNewWhitelistPrice(e.target.value)}
                                className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none"
                                style={{ borderColor: '#bae6fd', color: '#334155' }} />
                              <button onClick={handleSetWhitelistPrice} disabled={isLoading}
                                className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                                style={{ backgroundColor: GOLD, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                                Update
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* UPDATE MERKLE ROOT */}
                      <div className="mb-6 p-4 rounded-xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(15,76,92,0.15)' }}>
                        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: '#64748b' }}>Update Merkle Root</p>
                        <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                          Current whitelist root: <span className="font-mono">{getMerkleRoot()}</span>
                        </p>
                        <div className="flex gap-2">
                          <input type="text" placeholder="0x... new merkle root"
                            value={newMerkleRoot}
                            onChange={(e) => setNewMerkleRoot(e.target.value)}
                            className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none"
                            style={{ borderColor: '#bae6fd', color: '#334155' }} />
                          <button onClick={handleSetMerkleRoot} disabled={isLoading}
                            className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                            style={{ backgroundColor: GOLD, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                            Update
                          </button>
                        </div>
                      </div>

                      {/* UPDATE BASE URI */}
                      <div className="mb-6 p-4 rounded-xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(15,76,92,0.15)' }}>
                        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: '#64748b' }}>Update Base URI</p>
                        <div className="flex gap-2">
                          <input type="text" placeholder="ipfs://YOUR_NEW_CID/"
                            value={newBaseURI}
                            onChange={(e) => setNewBaseURI(e.target.value)}
                            className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none"
                            style={{ borderColor: '#bae6fd', color: '#334155' }} />
                          <button onClick={handleSetBaseURI} disabled={isLoading}
                            className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                            style={{ backgroundColor: GOLD, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                            Update
                          </button>
                        </div>
                      </div>

                      {/* WITHDRAW */}
                      <div className="mb-6 p-4 rounded-xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(15,76,92,0.15)' }}>
                        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: '#64748b' }}>Withdraw ETH</p>
                        <p className="text-sm mb-3" style={{ color: '#0f4c5c' }}>
                          Contract Balance: <strong>{contractBalance} ETH</strong>
                        </p>
                        <div className="flex gap-2">
                          <input type="text" placeholder="0x... recipient address"
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                            className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none"
                            style={{ borderColor: '#bae6fd', color: '#334155' }} />
                          <button onClick={handleWithdraw} disabled={isLoading}
                            className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                            style={{ backgroundColor: GOLD, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                            Withdraw
                          </button>
                        </div>
                      </div>

                      {/* RECOVER ERC20 */}
                      <div className="p-4 rounded-xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(15,76,92,0.15)' }}>
                        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: '#64748b' }}>Recover ERC-20 Tokens</p>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Token Address</p>
                            <input type="text" placeholder="0x... token contract"
                              value={recoverToken}
                              onChange={(e) => setRecoverToken(e.target.value)}
                              className="w-full border rounded-xl px-4 py-2 text-sm outline-none"
                              style={{ borderColor: '#bae6fd', color: '#334155' }} />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Recipient Address</p>
                            <input type="text" placeholder="0x... recipient"
                              value={recoverTo}
                              onChange={(e) => setRecoverTo(e.target.value)}
                              className="w-full border rounded-xl px-4 py-2 text-sm outline-none"
                              style={{ borderColor: '#bae6fd', color: '#334155' }} />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>Amount</p>
                            <input type="text" placeholder="e.g. 100"
                              value={recoverAmount}
                              onChange={(e) => setRecoverAmount(e.target.value)}
                              className="w-full border rounded-xl px-4 py-2 text-sm outline-none"
                              style={{ borderColor: '#bae6fd', color: '#334155' }} />
                          </div>
                        </div>
                        <button onClick={handleRecoverERC20} disabled={isLoading}
                          className="px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 btn-hover"
                          style={{ backgroundColor: GOLD, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                          Recover Tokens
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;