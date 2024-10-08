const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'komutlar',
    description: 'Sunucudaki komutları listeler.',
    execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('KOMUTLAR:')
            .addFields(
                { name: '**!play**', value: '*müzik oynatır.*' },
                { name: '**!skip**', value: '*şarkıyı atlar.*' },
                { name: '**!stop**', value: '*müzik çalmayı durdurur.*' },
                { name: '**!queue**', value: '*Şarkı listesini görüntüler*' },
                { name: '**!join**', value: '*bot sese gelir npc taklidi yapar*' },
                { name: '**!repeat**', value: '*listedeki tüm müzikleri tekrar oynatır*' },
                { name: '**!radyo**', value: '*şimdiye kadar dinlenmiş tüm müzikleri açar*' },
                { name: '**!rskip**', value: '*radyoda çalan müziği atlar*' },
                { name: '**!rstop**', value: '*radyoyu kapatır*' },
                { name: '**ADK**', value: '*sadece babanızın adını yazın, eğer şanslıysanız size özel sürprizlerle karşılaşacaksınız*' },
            )
            .setColor('#838387')
            .setFooter({ text: 'Azerbaycan Music - yavuzun hayratıdır' });

        message.channel.send({ embeds: [embed] });
    },
};
