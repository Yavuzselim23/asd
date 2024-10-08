const { setVolumeLevel, getVolumeLevel } = require('./play');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ses',
    description: 'Ses seviyesini ayarla veya mevcut ses seviyesini göster.',
    async execute(message, args) {
        if (args.length === 0) {
            // Ses seviyesini göster
            const currentVolume = getVolumeLevel() * 100;
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`ses seviyesi %${currentVolume.toFixed(0)} olarak ayarlanmış durumda`)
                .setDescription('Azerbaycan Music');

            return message.channel.send({ embeds: [embed] });
        }

        const volume = parseInt(args[0], 10);
        if (isNaN(volume) || volume < 0 || volume > 100) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('0-100 arası bir değer gir')
                .setDescription('Azerbaycan Music');
            return message.channel.send({ embeds: [embed] });
        }

        // Ses seviyesini güncelle
        setVolumeLevel(volume / 100);

        // Başarı mesajını gönder
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`ses seviyesini %${volume} olarak ayarladım`)
            .setDescription('Azerbaycan Music');

        message.channel.send({ embeds: [embed] });
    },
};
