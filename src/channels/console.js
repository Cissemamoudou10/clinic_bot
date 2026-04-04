const readline = require('readline');
const { askClinic, clearSession } = require('../bot/clinicBot');

const SESSION_ID = 'console';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log('=== Bienvenue ! Discutez avec CliniqueBot ===');
console.log('(Tapez "exit" ou "quit" pour quitter)\n');

function askQuestion() {
    rl.question('👤 Vous : ', async (userInput) => {
        const input = userInput.trim();

        if (!input) {
            askQuestion();
            return;
        }

        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            clearSession(SESSION_ID);
            console.log('👋 Au revoir !');
            rl.close();
            return;
        }

        try {
            const response = await askClinic(SESSION_ID, input);
            console.log(`\n🤖 CliniqueBot : ${response}`);
        } catch (err) {
            console.error('❌ Erreur :', err.message || err);
        }

        console.log('\n----------------');
        askQuestion();
    });
}

askQuestion();
