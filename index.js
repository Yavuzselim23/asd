const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { handleQueueCommand } = require('./commands/play');
const { skipRadyoSong, stopRadyo } = require('./commands/radyo');
const { EmbedBuilder } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const prefix = '!';

client.commands = new Map();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js') || file === 'play.js');
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

console.log('Commands loaded:', [...client.commands.keys()]);

const activities = [
    "selamiyle",
    "tarkanla",
    "hüsokulliyle"
];

client.once('ready', () => {
    console.log('Bot is online!');
    client.user.setStatus('dnd'); 

    setInterval(() => {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        client.user.setActivity(activity);
    }, 10000); 
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const lowerContent = message.content.toLowerCase();

    if (lowerContent.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (commandName === 'rskip') {
            await skipRadyoSong(message);
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription('✅ Sonraki şarkıya geçiyorum');
            message.channel.send({ embeds: [embed] });
            return;
        }
        if (commandName === 'rstop') {
            await stopRadyo(message);
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription('✅ Radyo durduruldu ve sesli kanaldan çıkıldı.');
            message.channel.send({ embeds: [embed] });
            return;
        }        
        const command = client.commands.get(commandName);
        if (command) {
            await command.execute(message, args);
        } else if (commandName === 'queue') {
            await handleQueueCommand(message); 
        }
    }
    
    if (lowerContent.includes('tarkan')) {
        message.channel.send('tarkan bey şuan beyaz atleti ve kareli donuyla maldivlerde tatil yapıyor');
        return;
    }
    if (lowerContent.includes('daldaşşak')) {
        message.channel.send('tarkan bey şuan beyaz atleti ve kareli donuyla maldivlerde tatil yapıyor');
        return;
    }
    if (lowerContent.includes('selami')) {
        message.channel.send('selami duvardan geçerken modemin kablosuna takıldı ve yere düştü, şuan hayatı sorguluyor');
        return;
    }
    if (lowerContent.includes('casper')) {
        message.channel.send('selami duvardan geçerken modemin kablosuna takıldı ve yere düştü, şuan hayatı sorguluyor');
        return;
    }
    if (lowerContent.includes('hüsokulli')) {
        message.channel.send('hüso duvar örmeye gitti gelince modemi sökecek');
        return;
    }
    if (lowerContent.includes('hüso')) {
        message.channel.send('hüso duvar örmeye gitti gelince modemi sökecek');
        return;
    }
    if (lowerContent.includes('hüseyin')) {
        message.channel.send('hüso duvar örmeye gitti gelince modemi sökecek');
        return;
    }
    if (lowerContent.includes('yumurtacı')) {
        message.channel.send('yumurtacı enektar yapmaya gitti adını anmayın gelip pıçaklayabilir');
        return;
    }
    if (lowerContent.includes('bot')) {
        message.channel.send('bu bot yavuzun hayratıdır.');
        return;
    }
});
client.login('').catch(err => console.error('Login failed:', err));
