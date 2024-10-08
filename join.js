const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
    name: 'join',
    description: 'Bot joins the voice channel and waits.',
    async execute(message) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000') 
                .setTitle('önce bi sese gir yarram evine mi gelicez')
                .setDescription('Azerbaycan Music');
            return message.channel.send({ embeds: [embed] });
        }
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('Bot sesli kanala bağlandı.');
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('sese geldim gardaş şuan şarkı çalamam eğer şarkı çalmak için çağırdıysan sesten siktir edip play komutuyla şarkı aç')
                .setDescription('Azerbaycan Music');
            message.channel.send({ embeds: [embed] });
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('Bot sesli kanaldan bağlantı kesildi.');
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log('Bot sesli kanaldan bağlantısı yok edildi.');
        });
    },
};
