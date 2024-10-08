const { EmbedBuilder } = require('discord.js');
const { resetQueueAndStop } = require('./play');

module.exports = {
    name: 'stop',
    description: 'Stop playback and clear the queue.',
    execute(message) {
        const voiceChannel = message.guild.members.me.voice.channel;
        
        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(' seste bile değilim amk')
                .setDescription('Azerbaycan Music');
            return message.channel.send({ embeds: [embed] });
        }
        resetQueueAndStop();
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle(' Allaha emanet karrrrdeş')
            .setDescription('Azerbaycan Music');

        message.channel.send({ embeds: [embed] });
    },
};