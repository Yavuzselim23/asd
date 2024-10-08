const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { playNextSong, resetQueueAndStop, getCurrentPlayer, getCurrentFilePath, setVolumeLevel, getVolumeLevel, queue, nowPlaying } = require('./play');

let radyoQueue = [];
let radyoPlaying = false;
let currentPlayer = null;
let currentConnection = null;
let volumeLevel = 0.2;
const radyoDirectory = path.join(__dirname, 'songs', 'radyo');

if (!fs.existsSync(radyoDirectory)) {
    fs.mkdirSync(radyoDirectory, { recursive: true });
}

function loadRadyoSongs() {
    radyoQueue = [];
    fs.readdir(radyoDirectory, (err, files) => {
        if (err) {
            console.error('Radyo şarkıları yüklenirken hata oluştu:', err);
            return;
        }
        files.forEach(file => {
            if (path.extname(file).toLowerCase() === '.mp3') {
                radyoQueue.push(path.join(radyoDirectory, file));
            }
        });
        if (radyoQueue.length === 0) {
            console.log('Radyo klasöründe şarkı bulunamadı.');
        }
    });
}

function getRandomSong() {
    if (radyoQueue.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * radyoQueue.length);
    return radyoQueue.splice(randomIndex, 1)[0];
}

async function playRadyo(message) {
    if (radyoQueue.length === 0) {
        loadRadyoSongs();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (radyoQueue.length === 0) {
        const embed = new EmbedBuilder()
            .setColor(16711680)
            .setDescription('❌ Radyo klasöründe şarkı bulunamadı.');
        return message.channel.send({ embeds: [embed] });
    }

    if (radyoPlaying) {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('radyo zaten çalışıyor')
            .setDescription('Azerbaycan Music');
        return message.channel.send({ embeds: [embed] });
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        const embed = new EmbedBuilder()
            .setColor(16711680)
            .setTitle('sese gir kardeşim')
            .setDescription('Azerbaycan Music');
        return message.channel.send({ embeds: [embed] });
    }

    radyoPlaying = true;
    await playNextRadyoSong(message);

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('iyi dinle keraneci')
        .setDescription('Azerbaycan Music');
    message.channel.send({ embeds: [embed] });
}

async function playNextRadyoSong(message) {
    if (radyoQueue.length === 0) {
        loadRadyoSongs();
    }

    const filePath = getRandomSong();
    if (!filePath) {
        radyoPlaying = false;
        const embed = new EmbedBuilder()
            .setColor(16711680)
            .setDescription('❌ Radyo şarkıları bulunamadı.');
        return message.channel.send({ embeds: [embed] });
    }

    const title = path.basename(filePath, '.mp3'); 

    const audioResource = createAudioResource(filePath, {
        metadata: {
            title: title || 'Radyo Şarkısı',
        },
        inlineVolume: true,
    });

    if (!currentConnection) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(16711680)
                .setTitle('ses kanalında kimse olmadığı için baba bu sesi terk ediyor hadi eyw')
                .setDescription('Azerbaycan Music');
            message.channel.send({ embeds: [embed] });
            return;
        }

        currentConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        currentConnection.on(VoiceConnectionStatus.Ready, () => {
            currentPlayer = createAudioPlayer();

            currentPlayer.on(AudioPlayerStatus.Idle, () => {
                playNextRadyoSong(message);
            });

            currentPlayer.on('error', error => {
                console.error('Ses oynatıcıda hata:', error);
            });

            currentPlayer.play(audioResource);
            currentConnection.subscribe(currentPlayer);
        });

        currentConnection.on(VoiceConnectionStatus.Disconnected, () => {
            currentConnection.destroy();
        });

        currentConnection.on(VoiceConnectionStatus.Destroyed, () => {
            currentConnection = null;
        });
    } else {
        currentPlayer.play(audioResource);
    }
}

function skipRadyoSong() {
    if (currentPlayer) {
        currentPlayer.stop();
    }
}

async function stopRadyo(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        const embed = new EmbedBuilder()
            .setColor(16711680)
            .setTitle('sese gir kardeşim')
            .setDescription('Azerbaycan Music');
        return message.channel.send({ embeds: [embed] });
    }

    if (currentConnection) {
        currentConnection.destroy();
        currentConnection = null;
    }
    if (currentPlayer) {
        currentPlayer.stop();
        currentPlayer = null;
    }
    radyoPlaying = false;
    radyoQueue = [];
}

module.exports = {
    name: 'radyo',
    description: 'Radyo modunu başlatır.',
    async execute(message) {
        await playRadyo(message);
    },
    skipRadyoSong,
    stopRadyo,
    loadRadyoSongs,
};
