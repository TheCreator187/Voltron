const express = require('express');
const stripe = require('stripe')('sk_test_your_secret_key'); // Replace with your Stripe secret key
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow CORS for testing
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

// StockX API configuration
const STOCKX_API_KEY = 'your_stockx_api_key'; // Replace with your StockX API key
const STOCKX_API_URL = 'https://api.stockx.com/v1';

// Solana connection
const solanaConnection = new Connection('https://api.mainnet-beta.solana.fm', 'confirmed');
const recipientAddress = 'CdzZ2CVwvbWp19dtpVrN7L1qVJYCSv7p8Fb1xjhnWxxa'; // Replace if needed

// Search sneakers
app.get('/search-sneakers', async (req, res) => {
    const { name, brand, size } = req.query;
    if (!name) return res.status(400).json({ error: 'Sneaker name is required' });
    try {
        const response = await fetch(`${STOCKX_API_URL}/search?query=${encodeURIComponent(name)}&facets=brand:${encodeURIComponent(brand || '')}&size=${size || ''}`, {
            headers: { 'Authorization': `Bearer ${STOCKX_API_KEY}` }
        });
        if (!response.ok) throw new Error(`StockX API request failed: ${response.statusText}`);
        const data = await response.json();
        const results = data.hits.map(item => ({
            name: item.name,
            url: `https://stockx.com/${item.urlKey}`,
            price: item.lowestAsk || item.lastSale,
            size: item.size || size || 'N/A',
            brand: item.brand,
            store: 'StockX',
            inStock: item.available || false,
            productId: item.productId // For cart/purchase
        })).filter(item => item.inStock && item.price);
        if (results.length === 0) return res.status(404).json({ error: 'No sneakers found in stock' });
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add to cart (StockX doesn’t expose this publicly; placeholder for a real store API)
app.post('/add-to-cart', async (req, res) => {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) return res.status(400).json({ error: 'Product ID and quantity are required' });
    try {
        // StockX requires authenticated user actions via their private API or SDK
        // Replace with a real store API (e.g., Shopify, Nike) for actual cart functionality
        console.log(`Adding ${quantity} of product ${productId} to cart (placeholder)`);
        res.status(501).json({ error: 'Cart functionality not implemented for StockX public API' });
    } catch (error) {
        console.error('Cart error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create Stripe PaymentIntent
app.post('/create-payment-intent', async (req, res) => {
    const { amount, currency, description } = req.body;
    if (!amount || !currency || !description) return res.status(400).json({ error: 'Amount, currency, and description are required' });
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount, // In cents
            currency,
            description
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Process Solana payment
app.post('/process-solana-payment', async (req, res) => {
    const { senderAddress, amount } = req.body;
    if (!senderAddress || !amount) return res.status(400).json({ error: 'Sender address and amount are required' });
    try {
        const lamports = LAMPORTS_PER_SOL * amount;
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(senderAddress),
                toPubkey: new PublicKey(recipientAddress),
                lamports
            })
        );
        const { blockhash } = await solanaConnection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey(senderAddress);

        const serializedTx = transaction.serializeMessage().toString('base64');
        res.json({ transaction: serializedTx });
    } catch (error) {
        console.error('Solana payment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Confirm Solana transaction
app.post('/confirm-solana-transaction', async (req, res) => {
    const { signature } = req.body;
    if (!signature) return res.status(400).json({ error: 'Transaction signature is required' });
    try {
        const confirmation = await solanaConnection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value.err) throw new Error('Transaction failed on chain');
        res.json({ success: true, signature });
    } catch (error) {
        console.error('Confirmation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));