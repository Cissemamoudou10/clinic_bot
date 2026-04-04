const config = require('./src/config/env');

console.log(`🏥 CliniqueBot — Mode : ${config.BOT_MODE.toUpperCase()}`);
console.log('---');

if (config.BOT_MODE === 'whatsapp') {
    require('./src/channels/whatsapp');
} else {
    require('./src/channels/console');
}
