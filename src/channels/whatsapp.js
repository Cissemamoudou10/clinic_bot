const express = require('express');
const config = require('../config/env');
const { askClinic } = require('../bot/clinicBot');

const app = express();
app.use(express.json());

/**
 * Envoie un message texte via l'API Evolution v2.
 * @param {string} recipient - JID ou numéro du destinataire
 * @param {string} text - Texte à envoyer
 */
async function sendWhatsAppMessage(recipient, text) {
    const url = `${config.EVOLUTION_API_URL}/message/sendText/${config.EVOLUTION_INSTANCE_NAME}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': config.EVOLUTION_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                number: recipient,
                text: text,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`❌ Erreur envoi WhatsApp (${response.status}):`, errorData);
        } else {
            console.log(`✅ Message envoyé à ${recipient}`);
        }
    } catch (err) {
        console.error('❌ Erreur réseau lors de l\'envoi WhatsApp:', err.message);
    }
}

/**
 * Webhook pour recevoir les messages de l'Evolution API v2.
 */
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        // Traiter uniquement les messages entrants
        if (body.event !== 'messages.upsert') {
            return res.sendStatus(200);
        }

        const messageData = body.data;

        // Ignorer les messages du bot
        if (messageData.key?.fromMe) {
            return res.sendStatus(200);
        }

        // Evolution API v2.3.7 résout le LID automatiquement → remoteJid = vrai numéro
        const clientJid = messageData.key?.remoteJid || '';
        const sessionId = clientJid.replace(/@.*$/, '');

        const userMessage = messageData.message?.conversation
            || messageData.message?.extendedTextMessage?.text
            || '';

        if (!userMessage || !clientJid) {
            return res.sendStatus(200);
        }

        console.log(`📩 Message de ${sessionId}: ${userMessage}`);

        // Générer la réponse IA (avec fallback)
        let botResponse;
        try {
            botResponse = await askClinic(sessionId, userMessage);
        } catch (aiError) {
            console.error('❌ Erreur IA:', aiError.message || aiError);
            botResponse = '⚠️ Désolé, notre service est temporairement indisponible. Veuillez réessayer dans quelques instants ou nous contacter directement par téléphone.';
        }

        console.log(`🤖 Réponse pour ${sessionId}: ${botResponse}`);

        // Envoyer la réponse au client
        await sendWhatsAppMessage(clientJid, botResponse);

    } catch (err) {
        console.error('❌ Erreur webhook:', err.message || err);
    }

    res.sendStatus(200);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mode: 'whatsapp', uptime: process.uptime() });
});

// Démarrage du serveur
app.listen(config.WEBHOOK_PORT, () => {
    console.log(`🚀 CliniqueBot WhatsApp en écoute sur le port ${config.WEBHOOK_PORT}`);
    console.log(`📡 Webhook URL : http://localhost:${config.WEBHOOK_PORT}/webhook`);
    console.log(`🏥 Health check : http://localhost:${config.WEBHOOK_PORT}/health`);
});