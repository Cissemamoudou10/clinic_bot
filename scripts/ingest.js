const supabase = require('../src/services/supabase');
const { embedModel } = require('../src/services/gemini');

async function ingest() {
    console.log('🚀 Connexion à Supabase...');

    // Récupérer les lignes sans embedding
    const { data: rows, error } = await supabase
        .from('clinic_knowledge')
        .select('id, content')
        .is('embedding', null);

    if (error) {
        console.error('❌ Erreur Supabase :', error);
        return;
    }

    if (rows.length === 0) {
        console.log('✅ Toutes les données ont déjà leurs vecteurs !');
        return;
    }

    console.log(`🧠 Génération de ${rows.length} vecteurs avec Gemini...`);

    for (const row of rows) {
        try {
            const result = await embedModel.embedContent(row.content);
            let embedding = result.embedding.values;

            if (embedding.length > 768) {
                embedding = embedding.slice(0, 768);
            }

            const { error: updateError } = await supabase
                .from('clinic_knowledge')
                .update({ embedding: embedding })
                .eq('id', row.id);

            if (updateError) throw updateError;
            console.log(`✔ OK : ${row.content.substring(0, 40)}...`);
        } catch (err) {
            console.error(`❌ Erreur sur la ligne ${row.id}:`, err);
        }
    }

    console.log('\n✨ Ingestion terminée ! La base est prête.');
}

ingest();
