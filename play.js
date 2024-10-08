const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const { isRepeatMode } = require('./repeat');

let currentConnection = null;
let currentPlayer = null;
let currentFilePath = null;
let queue = [];
let isPlaying = false;
let nowPlaying = null;
let volumeLevel = 0.2;
let lastMessage = null;
let disconnectTimeout = null;

const songsDirectory = path.join(__dirname, 'songs');
if (!fs.existsSync(songsDirectory)) {
    fs.mkdirSync(songsDirectory);
}

function sanitizeFileName(fileName) {
    return fileName.replace(/[<>:"/\\|?*]+/g, '');
}


async function getVideoTitle(url) {
    try {
        const info = await ytdl.getInfo(url);
        return {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url,
            channelName: info.videoDetails.author.name,
            duration: info.videoDetails.lengthSeconds,
        };
    } catch (error) {
        console.error('YouTube video bilgileri alınırken hata oluştu:', error);
        return null;
    }
}
async function searchVideo(query) {
    const apiKey = 'AIzaSyAzWAqDewI2U9ZpSLhdYrP5C_Wt4c4d1_A'; // API anahtarınızı buraya ekleyin
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=1`;
    try {
        const response = await axios.get(searchUrl);
        if (response.data.items.length === 0) {
            console.error('Arama sonucunda video bulunamadı.');
            return null;
        }
        const videoId = response.data.items[0].id.videoId;
        return `https://www.youtube.com/watch?v=${videoId}`;
    } catch (error) {
        console.error('YouTube arama sırasında hata oluştu:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function playNextSong(message) {
    if (queue.length === 0) {
        isPlaying = false;
        nowPlaying = null;

        // Eğer kuyruk boşsa 2 dakika bekle ve ses kanalından çık
        disconnectTimeout = setTimeout(() => {
            if (currentConnection) {
                currentConnection.destroy();
                currentConnection = null;
            }
        }, 2 * 60 * 1000); // 2 dakika (120 saniye)

        return;
    }

    // Kuyrukta şarkı varsa, mevcut timeout'u iptal et
    if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
    }

    const { url, voiceChannel } = queue.shift();
    const videoDetails = await getVideoTitle(url);

    if (!videoDetails) {
        return;
    }

    const { title, thumbnail, channelName, duration } = videoDetails;

    const fileName = sanitizeFileName(title ? `${title}.mp3` : 'audio.mp3');
    const filePath = path.join(songsDirectory, fileName);
    currentFilePath = filePath;
    nowPlaying = { url, title };

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`${title}`)
        .setURL(url)
        .setThumbnail(thumbnail)
        .addFields(
            { name: 'Müzik süresi:', value: `(${formattedDuration})`, inline: true },
            { name: 'Müziğin Kanalı:', value: `(${channelName})`, inline: true },
            { name: 'İyi dinle keraneci', value: 'Azerbaycan Music', inline: false }
        );

    lastMessage = await message.channel.send({ embeds: [embed] });

    if (fs.existsSync(filePath)) {
        await playAudioResource(filePath, message, url, voiceChannel, title);
    } else {
        exec(`yt-dlp -f bestaudio --no-warnings -o "${filePath}" "${url}"`, async (error, stdout, stderr) => {
            if (error) {
                console.error('yt-dlp işlemi sırasında hata oluştu:', error);
                const embed = new EmbedBuilder()
                    .setColor(16711680)
                    .setTitle('amk müziğini doğru düzgün aç bulamıyom')
                    .setDescription('Azerbaycan Music');
                return message.channel.send({ embeds: [embed] });
            }

            console.error('yt-dlp stderr:', stderr);

            const stats = fs.statSync(filePath);
            if (stats.size < 1000) {
                const embed = new EmbedBuilder()
                    .setColor(16711680)
                    .setTitle('başıma bir şey geldi yapamıyom ')
                    .setDescription('Azerbaycan Music');
                return message.channel.send({ embeds: [embed] });
            }

            await playAudioResource(filePath, message, url, voiceChannel, title);
        });
    }
}


async function playAudioResource(filePath, message, url, voiceChannel, title) {
    const audioResource = createAudioResource(filePath, {
        metadata: {
            title: title || 'YouTube Ses',
        },
        inlineVolume: true,
    });
    audioResource.volume.setVolume(volumeLevel);

    if (currentPlayer) {
        currentPlayer.stop();
    }

    if (currentConnection) {
        currentConnection.destroy();
    }

    currentConnection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
    });

    currentConnection.on(VoiceConnectionStatus.Ready, () => {
        currentPlayer = createAudioPlayer();

        currentPlayer.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => {
                if (isRepeatMode()) {
                    queue.push({ url, voiceChannel, title });
                }
                currentFilePath = null;
                nowPlaying = null;
                playNextSong(message);
            }, 100);
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
}

async function handleQueueCommand(message) {
    let queueDescription = '';

    const userDisplayName = message.member.displayName; 
    const userAvatarURL = message.author.displayAvatarURL();

    if (nowPlaying) {
        queueDescription += ` **şu an Çalınıyor:** [${nowPlaying.title}](${nowPlaying.url})\n\n`;
    }

    if (queue.length === 0) {
        queueDescription += 'kuyrukta şarkı yok.';
    } else {
        for (let i = 0; i < queue.length; i++) {
            queueDescription += `${i + 1}. [${queue[i].title}](${queue[i].url})\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setColor('#8D9191')
        .setTitle('Müzik Kuyruğu')
        .setDescription(queueDescription)
        .setAuthor({ name: userDisplayName, iconURL: userAvatarURL })
        .setFooter({ text: 'Azerbaycan Music' });

    message.channel.send({ embeds: [embed] });
}

function resetQueueAndStop() {
    queue = [];
    isPlaying = false;
    nowPlaying = null;
    if (currentPlayer) {
        currentPlayer.stop();
    }
    if (currentConnection) {
        currentConnection.destroy();
    }
    if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
    }
}

function setVolumeLevel(level) {
    volumeLevel = level;
}

function getVolumeLevel() {
    return volumeLevel;
}

module.exports = {
    name: 'play',
    description: 'Play audio from a YouTube link or search for a song.',
    async execute(message, args) {
        const input = args.join(' ');
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(16711680)
                .setDescription('❌  sese gir de geleq');
            return message.channel.send({ embeds: [embed] });
        }

        if (input.startsWith('http')) {
            const url = input;
            const videoDetails = await getVideoTitle(url);
            if (!videoDetails) {
                const embed = new EmbedBuilder()
                    .setColor(16711680)
                    .setDescription('❌  url yanlış ya da ben malım kardeş');
                return message.channel.send({ embeds: [embed] });
            }

            const { title, thumbnail, channelName, duration } = videoDetails;

            queue.push({ url, voiceChannel, title });

            if (!isPlaying) {
                isPlaying = true;
                playNextSong(message);
            } else {
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Müzik sıraya eklendi')
                .setThumbnail(thumbnail)
                .addFields(
                    { name: `${title}`, value: 'Azerbaycan Music', inline: false }
                );

                return message.channel.send({ embeds: [embed] });
            }
        } else {
            const url = await searchVideo(input);
            if (!url) {
                const embed = new EmbedBuilder()
                    .setColor(16711680)
                    .setDescription('❌  şarkı bulunamadı.');
                return message.channel.send({ embeds: [embed] });
            }

            const videoDetails = await getVideoTitle(url);
            if (!videoDetails) {
                const embed = new EmbedBuilder()
                    .setColor(16711680)
                    .setDescription('❌  başlık alınamadı.');
                return message.channel.send({ embeds: [embed] });
            }

            const { title, thumbnail, channelName, duration } = videoDetails;

            queue.push({ url, voiceChannel, title });
            if (!isPlaying) {
                isPlaying = true;
                playNextSong(message);
            } else {
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Müzik sıraya eklendi')
                .setThumbnail(thumbnail)
                .addFields(
                    { name: `${title}`, value: 'Azerbaycan Music', inline: false }
                );

                return message.channel.send({ embeds: [embed] });
            }
        }
    },
    queue,
    volumeLevel,
    getVolumeLevel,
    handleQueueCommand,
    setVolumeLevel,
    resetQueueAndStop,
    nowPlaying,
    getCurrentPlayer: () => currentPlayer,
    getCurrentFilePath: () => currentFilePath,
    playNextSong
};