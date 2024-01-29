const { Client, GatewayIntentBits } = require('discord.js');
const { gtts } = require('node-gtts');
const openai = require('openai');
const ytdl = require('ytdl-core');

// Configure OpenAI API
openai.api_key = 'YOUR_OPENAI_API_KEY';

// Configure Discord Bot
const botToken = 'YOUR_DISCORD_BOT_TOKEN';
const prefix = '!';

// Define intents
const intents = new GatewayIntentBits(GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent);

// Create Discord Client instance
const bot = new Client({ intents });

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}`);
});

bot.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(prefix)) {
        const [command, ...args] = message.content.slice(prefix.length).split(' ');

        if (command === 'tts') {
            const text = args.join(' ');
            const speech = new gtts(text, 'en');
            speech.save('tts.mp3', function () {
                const voiceChannel = message.member.voice.channel;
                if (voiceChannel) {
                    voiceChannel.join().then(connection => {
                        const dispatcher = connection.play('./tts.mp3');
                        dispatcher.on('finish', () => voiceChannel.leave());
                    });
                } else {
                    message.reply('You need to be in a voice channel to use this command.');
                }
            });
        } else if (command === 'openai') {
            const prompt = args.join(' ');
            const response = await openai.Completion.create({
                engine: 'davinci',
                prompt,
                max_tokens: 150,
            });
            message.channel.send(response.choices[0].text);
        } else if (command === 'avatar') {
            const user = message.mentions.users.first() || message.author;
            message.channel.send(user.displayAvatarURL({ dynamic: true }));
        } else if (command === 'download') {
            const url = args[0];
            if (!url) {
                return message.reply('Please provide a valid YouTube URL.');
            }
            const voiceChannel = message.member.voice.channel;
            if (voiceChannel) {
                const connection = await voiceChannel.join();
                const stream = ytdl(url, { filter: 'audioonly' });
                const dispatcher = connection.play(stream);
                dispatcher.on('finish', () => voiceChannel.leave());
            } else {
                message.reply('You need to be in a voice channel to use this command.');
            }
        }
    }
});

bot.login(botToken);
