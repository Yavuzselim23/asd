const { EmbedBuilder } = require('discord.js');

let isRepeat = false;

module.exports = {
    name: 'repeat',
    description: 'Toggle repeat mode for the current queue.',
    execute(message) {
        isRepeat = !isRepeat;

        const embed = new EmbedBuilder()
            .setColor(isRepeat ? '#00FF00' : '#FF0000')
            .setTitle('tekrar modu')
            .setDescription(isRepeat 
                ? '🔄  **tekrar modunu açtım**. listedeki şarkılar döngüye girecek' 
                : '⏹️  **tekrar modununu kapattım**.')
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    },
    isRepeatMode: () => isRepeat
};
