const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const { Connection, PublicKey } = require('@solana/web3.js');
const mongoose = require('mongoose');
const { deploySolanaRaydiumVolumeBot } = require('./Asset/Solana-raydium-volume-bot');

const app = express();
const port = 3000;

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/voltron', { useNewUrlParser: true, useUnifiedTopology: true });
const transactionSchema = new mongoose.Schema({
    userWallet: String,
    txHash: String,
    network: String,
    timestamp: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// Middleware
app.use(bodyParser.json());

// Ethereum setup
const ethProvider = new ethers.providers.InfuraProvider('mainnet', 'YOUR_INFURA_PROJECT_ID');
const ethUsdcAddress = '0xYourEthereumUSDCWalletAddressHere';

// Solana setup
const solConnection = new Connection('https://api.mainnet-beta.solana.com');
const solUsdcAddress = new PublicKey('YourSolanaUSDCWalletAddressHere');

// Endpoint to store transaction
app.post('/api/transaction', async (req, res) => {
    const { userWallet, txHash, network } = req.body;

    if (!userWallet || !txHash || !network) {
        return res.status(400).send('Missing required fields');
    }

    const newTransaction = new Transaction({ userWallet, txHash, network });
    await newTransaction.save();

    res.status(200).send('Transaction stored successfully');
});

// Endpoint to clean up old transactions
app.delete('/api/cleanup', async (req, res) => {
    const { days } = req.body;
    if (!days) {
        return res.status(400).send('Missing required field: days');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await Transaction.deleteMany({ timestamp: { $lt: cutoffDate } });

    res.status(200).send(`Transactions older than ${days} days have been removed.`);
});

// Monitor Ethereum transactions
ethProvider.on('pending', async (txHash) => {
    try {
        const tx = await ethProvider.getTransaction(txHash);
        if (tx && tx.to && tx.to.toLowerCase() === ethUsdcAddress.toLowerCase()) {
            const newTransaction = new Transaction({ userWallet: tx.from, txHash: tx.hash, network: 'Ethereum' });
            await newTransaction.save();
        }
    } catch (error) {
        console.error(`Error processing Ethereum transaction ${txHash}:`, error);
    }
});

// Monitor Solana transactions
solConnection.onSignature(solUsdcAddress, async (signature, result) => {
    try {
        if (result.err === null) {
            const tx = await solConnection.getTransaction(signature);
            if (tx && tx.transaction.message.accountKeys.some(key => key.equals(solUsdcAddress))) {
                const newTransaction = new Transaction({ userWallet: tx.transaction.message.accountKeys[0].toString(), txHash: signature, network: 'Solana' });
                await newTransaction.save();
            }
        }
    } catch (error) {
        console.error(`Error processing Solana transaction ${signature}:`, error);
    }
}, 'confirmed');

// Endpoint to deploy Solana Raydium volume bot
app.post('/api/deploy-solana-raydium-bot', async (req, res) => {
    const { userPublicKey, targetVolume } = req.body;

    if (!userPublicKey || !targetVolume) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const transaction = await deploySolanaRaydiumVolumeBot(new PublicKey(userPublicKey), targetVolume);
        res.status(200).send({ transaction });
    } catch (error) {
        res.status(500).send(`Error deploying bot: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
