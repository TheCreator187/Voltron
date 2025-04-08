const express = require('express');
const { Connection, PublicKey, TOKEN_PROGRAM_ID } = require('@solana/web3.js');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Solana setup
const solConnection = new Connection('https://api.mainnet-beta.solana.fm', 'confirmed');
const solUsdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const solWalletAddress = new PublicKey('CdzZ2CVwvbWp19dtpVrN7L1qVJYCSv7p8Fb1xjhnWxxa'); // Updated Solana USDC wallet address

// Validate Solana wallet address
if (solWalletAddress.toString() === 'YOUR_SOLANA_USDC_WALLET') {
    throw new Error('Please replace YOUR_SOLANA_USDC_WALLET with a valid base58-encoded Solana wallet address in server.js');
}

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

async function payWithSolana(userPublicKey, botType, volume) {
    const fee = 100 * 10 ** 6; // 100 USDC in lamports
    const status = `Initiating payment for ${botType} bot with ${volume} volume...`;
    console.log(status);

    try {
        const connection = new Connection('https://api.mainnet-beta.solana.fm', 'confirmed');
        const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        const userPublicKeyObj = new PublicKey(userPublicKey);

        // Fetch user's USDC token account
        const tokenAccounts = await connection.getTokenAccountsByOwner(userPublicKeyObj, { mint: usdcMint });
        if (tokenAccounts.value.length === 0) {
            throw new Error('No USDC token account found for the user');
        }

        const userTokenAccount = tokenAccounts.value[0].pubkey;

        // Create transaction
        const transaction = new solanaWeb3.Transaction().add(
            solanaWeb3.Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                userTokenAccount,
                solWalletAddress,
                userPublicKeyObj,
                [],
                fee
            )
        );

        // Send transaction
        const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [userPublicKeyObj]);
        console.log(`Payment successful with signature: ${signature}`);
        return `Payment successful for ${botType} bot with ${volume} volume. Transaction signature: ${signature}`;
    } catch (error) {
        console.error('Payment failed:', error);
        throw new Error(`Payment failed: ${error.message}`);
    }
}

// Verify payment endpoint
app.post('/verify-payment', async (req, res) => {
    const { walletType, txHash, botType, crypto, volume, userAddress } = req.body;
    const feeExpected = 100 * 10 ** 6;

    try {
        if (walletType === 'Phantom') {
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
        } else {
            throw new Error('Unsupported wallet type');
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