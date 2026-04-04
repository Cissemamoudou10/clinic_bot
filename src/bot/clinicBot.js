const supabase = require('../services/supabase');
const { embedModel, chatModel } = require('../services/gemini');
const { isQuestion, logQuestion } = require('../services/questionLogger');

// Map de sessions : chaque conversation (par numéro WhatsApp ou "console") a son propre chat
const sessions = new Map();

/**
 * Crée ou récupère une session de chat pour un identifiant donné.
 * @param {string} sessionId - Identifiant unique (numéro WhatsApp ou "console")
 * @returns {object} Session de chat Gemini avec historique
 */
function getSession(sessionId) {
    if (!sessions.has(sessionId)) {
        const chat = chatModel.startChat({ history: [] });
        sessions.set(sessionId, chat);
    }
    return sessions.get(sessionId);
}

/**
 * Supprime une session (utile pour reset ou déconnexion).
 * @param {string} sessionId
 */
function clearSession(sessionId) {
    sessions.delete(sessionId);
}

/**
 * Traite un message utilisateur et retourne la réponse du bot.
 * Pipeline : embedding → recherche vectorielle → contexte → LLM → log
 * 
 * @param {string} sessionId - Identifiant de la conversation
 * @param {string} userInput - Message de l'utilisateur
 * @returns {Promise<string>} Réponse du bot
 */
async function askClinic(sessionId, userInput) {
    // A. Générer le vecteur pour la question
    const embeddingResult = await embedModel.embedContent(userInput);
    let embedding = embeddingResult.embedding.values;
    if (embedding.length > 768) {
        embedding = embedding.slice(0, 768);
    }

    // B. Recherche sémantique dans Supabase
    const { data: documents, error } = await supabase.rpc('match_clinic_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.45,
        match_count: 5
    });

    if (error) throw error;

    // C. Préparer le contexte
    let contextFound = true;
    let contextText = '';
    if (documents && documents.length > 0) {
        contextText = documents.map(doc => doc.content).join('\n- ');
    } else {
        contextText = 'Aucune information clinique pertinente trouvée dans la base de données pour cette question précise.';
        contextFound = false;
    }

    // D. Assembler le prompt
    const finalPrompt = `
Voici les informations cliniques disponibles pour t'aider à répondre :
<contexte>
${contextText}
</contexte>

Question / Message de l'utilisateur :
<question>
${userInput}
</question>
`;

    // E. Envoyer au chat (avec historique de la session)
    const chat = getSession(sessionId);
    const result = await chat.sendMessage(finalPrompt);
    const responseText = result.response.text();

    // F. Logger si c'est une question (en arrière-plan, ne bloque pas la réponse)
    if (isQuestion(userInput)) {
        logQuestion(sessionId, userInput, responseText, contextFound);
    }

    return responseText;
}

module.exports = { askClinic, getSession, clearSession };
