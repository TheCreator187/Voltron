const express = require('express');
const { ethers } = require('ethers');
const app = express();
const port = 3000;

app.use(express.json());

// Replace with your Ethereum provider and USDC contract details
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC contract on Ethereum
const usdcABI = [ /* ERC-20 ABI, get from Etherscan */ ];
const walletAddress = '0xYourUSDCWalletAddressHere';

app.post('/pay-and-deploy', async (req, res) => {
    const { botType, crypto, volume, userAddress } = req.body;

    try {
        const usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider);
        const fee = ethers.utils.parseUnits('100', 6); // USDC has 6 decimals

        // Simulate checking payment (in reality, use a wallet like MetaMask on frontend)
        // For demo, assume payment is sent manually and verified here
        const txHash = req.body.txHash; // Frontend would send this after payment
        const receipt = await provider.waitForTransaction(txHash);

        if (receipt.status === 1) {
            // Payment confirmed, proceed with bot deployment logic
            res.json({ success: true, message: `${botType} bot deployed for ${crypto} with ${volume} volume` });
        } else {
            throw new Error('Payment failed');
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment or deployment failed: ' + error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});