const express = require('express');
const { ethers } = require('ethers');
const { Connection, PublicKey, TOKEN_PROGRAM_ID } = require('@solana/web3.js');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Ethereum setup
const ethProvider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
const ethUsdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const ethWalletAddress = 'YOUR_ETHEREUM_USDC_WALLET'; // Your Ethereum USDC wallet

// Solana setup
const solConnection = new Connection('https://api.mainnet-beta.solana.fm', 'confirmed');
const solUsdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const solWalletAddress = new PublicKey('YOUR_SOLANA_USDC_WALLET'); // Your Solana USDC wallet

// Bot logic (mocked for now)
async function universalChainSync(crypto, volume) {
    console.log(`Syncing ${volume} volume for ${crypto} across chains...`);
    return `Universal Chain Sync deployed for ${crypto} with ${volume} volume`;
}

async function hyperVolumeBoost(crypto, volume) {
    console.log(`Boosting ${volume} volume for ${crypto}...`);
    return `Hyper Volume Boost deployed for ${crypto} with ${volume} volume`;
}

async function instantDeploy(crypto, volume) {
    console.log(`Instantly deploying ${volume} volume for ${crypto}...`);
    return `Instant Deployment deployed for ${crypto} with ${volume} volume`;
}

async function solanaRaydiumVolume(crypto, volume) {
    console.log(`Boosting ${volume} SOL volume on Raydium...`);
    // Replace with real logic from solana-volume-bot.js once uploaded
    return `Solana Raydium Volume Bot deployed for ${crypto} with ${volume} volume`;
}

async function sneakerBot(url, size, quantity) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url);
    console.log(`Buying ${quantity} sneakers of size ${size} from ${url}...`);
    await browser.close();
    return `Sneaker Bot copped ${quantity} sneakers of size ${size} from ${url}`;
}

// Verify payment endpoint
app.post('/verify-payment', async (req, res) => {
    const { walletType, txHash, botType, crypto, volume, userAddress } = req.body;
    const feeExpected = walletType === 'MetaMask' ? ethers.utils.parseUnits('100', 6) : 100 * 10 ** 6;

    try {
        if (walletType === 'MetaMask') {
            const tx = await ethProvider.getTransaction(txHash);
            if (!tx) throw new Error('Transaction not found');

            const receipt = await ethProvider.waitForTransaction(txHash);
            if (receipt.status !== 1) throw new Error('Transaction failed');

            // Verify USDC transfer
            const usdcInterface = new ethers.utils.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)']);
            const logs = receipt.logs.map(log => {
                try { return usdcInterface.parseLog(log); } catch { return null; }
            }).filter(log => log && log.name === 'Transfer');

            const paymentLog = logs.find(log => 
                log.args.from.toLowerCase() === userAddress.toLowerCase() &&
                log.args.to.toLowerCase() === ethWalletAddress.toLowerCase()
            );

            if (!paymentLog || paymentLog.args.value.lt(feeExpected)) {
                throw new Error('Insufficient or incorrect USDC payment');
            }
        } else if (walletType === 'Phantom') {
            const tx = await solConnection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
            if (!tx || tx.meta.err) throw new Error('Transaction failed');

            const tokenAccounts = await solConnection.getTokenAccountsByOwner(new PublicKey(userAddress), { mint: solUsdcMint });
            const transfer = tx.meta.innerInstructions
                .flatMap(i => i.instructions)
                .find(i => 
                    i.programId.equals(TOKEN_PROGRAM_ID) &&
                    i.parsed.type === 'transfer' &&
                    i.parsed.info.destination === solWalletAddress.toString() &&
                    i.parsed.info.source === tokenAccounts.value[0].pubkey.toString()
                );

            if (!transfer || transfer.parsed.info.amount < feeExpected) {
                throw new Error('Insufficient or incorrect USDC payment');
            }
        }

        // Payment verified, deploy bot
        let message;
        switch (botType.toLowerCase()) {
            case 'chain sync': message = await universalChainSync(crypto, volume); break;
            case 'volume boost': message = await hyperVolumeBoost(crypto, volume); break;
            case 'instant deploy': message = await instantDeploy(crypto, volume); break;
            case 'solana raydium volume': message = await solanaRaydiumVolume(crypto, volume); break;
            case 'sneaker bot': message = await sneakerBot(crypto, volume.split('-')[0], volume.split('-')[1]); break;
            default: throw new Error('Unknown bot type');
        }

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});