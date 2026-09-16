// ====================================================================
// GLOBAL BULK - Pi Network Payment Backend
// ====================================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// ===== VARIABLES D'ENVIRONNEMENT (configurées sur Render) =====
const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_BASE = 'https://api.minepi.com/v2';
const PORT = process.env.PORT || 3000;

function log(...args) {
    console.log('[Pi Backend]', new Date().toISOString(), ...args);
}

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Global Bulk Pi Backend',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        ok: true,
        apiKeyConfigured: !!PI_API_KEY
    });
});

// ===== APPROVE =====
app.post('/approve', async (req, res) => {
    const { paymentId } = req.body;
    log('📥 Approve demandé:', paymentId);

    if (!paymentId) return res.status(400).json({ error: 'paymentId manquant' });
    if (!PI_API_KEY) return res.status(500).json({ error: 'PI_API_KEY non configurée' });

    try {
        const response = await axios.post(
            `${PI_API_BASE}/payments/${paymentId}/approve`,
            {},
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        log('✅ Paiement approuvé:', paymentId);
        res.json({ success: true, payment: response.data });
    } catch (error) {
        log('❌ Erreur approve:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Échec approbation',
            details: error.response?.data || error.message
        });
    }
});

// ===== COMPLETE =====
app.post('/complete', async (req, res) => {
    const { paymentId, txid } = req.body;
    log('📥 Complete demandé:', paymentId, 'txid:', txid);

    if (!paymentId || !txid) return res.status(400).json({ error: 'paymentId ou txid manquant' });
    if (!PI_API_KEY) return res.status(500).json({ error: 'PI_API_KEY non configurée' });

    try {
        const response = await axios.post(
            `${PI_API_BASE}/payments/${paymentId}/complete`,
            { txid: txid },
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        log('✅ Paiement complété:', paymentId);
        res.json({ success: true, payment: response.data });
    } catch (error) {
        log('❌ Erreur complete:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Échec complétion',
            details: error.response?.data || error.message
        });
    }
});

// ===== INCOMPLETE (optionnel) =====
app.post('/incomplete', (req, res) => {
    log('⚠️ Paiement incomplet:', req.body);
    res.json({ success: true });
});

// ===== DÉMARRAGE =====
app.listen(PORT, () => {
    log(`🚀 Serveur démarré sur le port ${PORT}`);
    log(`API Key configurée : ${!!PI_API_KEY ? 'OUI' : 'NON'}`);
});
