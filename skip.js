const { EmbedBuilder } = require('discord.js');
const { playNextSong, getCurrentPlayer, getCurrentFilePath, queue } = require('./play'); // play.js dosyasından gerekli fonksiyonları ve queue'yu içe aktar

module.exports = {
    name: 'skip',
    description: 'Skip the current song and play the next one in the queue.',
    async execute(message) {
        const currentPlayer = getCurrentPlayer();
        const currentFilePath = getCurrentFilePath();

        if (!currentPlayer || !currentFilePath) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('');
            return message.channel.send({ embeds: [embed] });
        }

        currentPlayer.stop();

        if (queue.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('şarkıyı skip attım, sıradakini çalıyorum')
                .setColor('#00FF00')
                .setDescription('Azerbaycan Music');
            await message.channel.send({ embeds: [embed] });
        } else {
            playNextSong(message);
            const embed = new EmbedBuilder()
                .setTitle('şarkıyı skip attım, sıradakini çalıyorum')
                .setColor('#00FF00')
                .setDescription('Azerbaycan Music');
            await message.channel.send({ embeds: [embed] });
        }
    },
};