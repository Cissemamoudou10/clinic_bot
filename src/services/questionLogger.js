const supabase = require('./supabase');

// Mots interrogatifs courants en français
const QUESTION_STARTERS = [
    'quel', 'quelle', 'quels', 'quelles',
    'comment', 'combien', 'pourquoi', 'quand', 'où', 'ou',
    'qui', 'que', 'quoi',
    'est-ce', 'est ce',
    'puis-je', 'puis je', 'pourrais-je', 'pourrais je',
    'pouvez', 'pourrais', 'pourriez',
    'avez-vous', 'avez vous',
    'y a-t-il', 'y a t il',
    'faut-il', 'faut il',
    'peut-on', 'peut on',
    'ai-je', 'a-t-on',
    'c\'est quoi', 'c est quoi',
    'dites-moi', 'dites moi',
    'j\'aimerais savoir', 'j aimerais savoir',
    'je voudrais savoir', 'je veux savoir',
    'donnez-moi', 'donnez moi',
    'liste', 'tarif', 'prix', 'horaire', 'adresse',
];

/**
 * Détecte si un message est une question.
 * @param {string} text
 * @returns {boolean}
 */
function isQuestion(text) {
    if (!text || text.trim().length === 0) return false;
    
    const normalized = text.toLowerCase().trim();

    // Contient un point d'interrogation
    if (normalized.includes('?')) return true;

    // Commence par un mot interrogatif
    for (const starter of QUESTION_STARTERS) {
        if (normalized.startsWith(starter)) return true;
    }

    return false;
}

/**
 * Enregistre une question dans Supabase (en arrière-plan).
 * @param {string} sessionId
 * @param {string} question
 * @param {string} botResponse
 * @param {boolean} contextFound
 */
async function logQuestion(sessionId, question, botResponse, contextFound) {
    try {
        const { error } = await supabase
            .from('chat_questions')
            .insert({
                session_id: sessionId,
                question: question,
                bot_response: botResponse,
                context_found: contextFound,
            });

        if (error) {
            console.error('⚠️ Erreur log question:', error.message);
        }
    } catch (err) {
        // Ne jamais bloquer le bot pour un log
        console.error('⚠️ Erreur log question:', err.message);
    }
}

module.exports = { isQuestion, logQuestion };
