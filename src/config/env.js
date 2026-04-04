require('dotenv').config();

// Variables obligatoires dans tous les modes
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'];

// Variables obligatoires uniquement en mode whatsapp
const requiredWhatsapp = ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE_NAME'];

function validateEnv() {
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ Variables d'environnement manquantes : ${missing.join(', ')}`);
        process.exit(1);
    }

    if (process.env.BOT_MODE === 'whatsapp') {
        const missingWa = requiredWhatsapp.filter(key => !process.env[key]);
        if (missingWa.length > 0) {
            console.error(`❌ Variables Evolution API manquantes : ${missingWa.join(', ')}`);
            process.exit(1);
        }
    }
}

validateEnv();

module.exports = {
    BOT_MODE: process.env.BOT_MODE || 'console',
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || '',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
    EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME || '',
    WEBHOOK_PORT: parseInt(process.env.WEBHOOK_PORT) || 3000,
};
