import Discord, { Interaction, Snowflake } from 'discord.js';
import { MusicSubscription } from './music/subscription';
import { EventEmitter } from 'events';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import twitter from 'twitter';
import { play } from './commands/play';
import { skip } from './commands/skip';
import { queue } from './commands/queue';
import { pause } from './commands/pause';
import { unpause } from './commands/unpause';
import { leave } from './commands/leave';
import { subscribe } from './commands/subscribe';
import { unsubscribe } from './commands/unsubscribe';

import { token } from './auth.json';

export const event = new EventEmitter();

const client = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });

client.on('ready', () => console.log('Ready!'));

// This contains the setup code for creating slash commands in a guild. The owner of the bot can send "!deploy" to create them.
client.on('messageCreate', async (message) => {
	if (!message.guild) return;
	if (!client.application?.owner) await client.application?.fetch();

	if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application?.owner?.id) {
		await message.guild.commands.set([
			{
				name: 'play',
				description: 'Plays a song',
				options: [
					{
						name: 'song',
						type: ApplicationCommandOptionTypes.STRING,
						description: 'The URL of the song to play',
						required: true,
					},
				],
			},
			{
				name: 'skip',
				description: 'Skip to the next song in the queue',
			},
			{
				name: 'queue',
				description: 'See the music queue',
			},
			{
				name: 'pause',
				description: 'Pauses the song that is currently playing',
			},
			{
				name: 'resume',
				description: 'Resume playback of the current song',
			},
			{
				name: 'leave',
				description: 'Leave the voice channel',
			},
			{
				name: 'sub',
				description: 'Subscribe to tweets',
				options: [
					{
						name: 'to',
						type: ApplicationCommandOptionTypes.STRING,
						description: 'the person to sub to',
						required: true,
					},
				],
			},
			{
				name: 'unsub',
				description: 'Unsubscribe to tweets',
				options: [
					{
						name: 'to',
						type: ApplicationCommandOptionTypes.STRING,
						description: 'the person to unsub frpm',
						required: true,
					},
				],
			}
		]);

		await message.reply('Deployed!');
	}
});

export class Twitter {
	atList: string[] = [];
	hasStream: boolean = false;
}

/**
 * Maps guild IDs to music subscriptions, which exist if the bot has an active VoiceConnection to the guild.
 */
const subscriptions = new Map<Snowflake, MusicSubscription>();
const twitterMap = new Map<Snowflake, Twitter>();

// Handles slash command interactions
client.on('interactionCreate', async (interaction: Interaction) => {
	if (!interaction.isCommand() || !interaction.guildId) return;
	let subscription = subscriptions.get(interaction.guildId);

	if (interaction.commandName === 'play') {
		await play(interaction, subscriptions, subscription);
	} else if (interaction.commandName === 'skip') {
		await skip(interaction, subscription);
	} else if (interaction.commandName === 'queue') {
		await queue(interaction, subscription);
	} else if (interaction.commandName === 'pause') {
		await pause(interaction, subscription);
	} else if (interaction.commandName === 'resume') {
		await unpause(interaction, subscription);
	} else if (interaction.commandName === 'leave') {
		await leave(interaction, subscriptions, subscription);
	} else if (interaction.commandName === 'sub') {
		if (!interaction.channel) return await interaction.reply('No channel found!');
		await subscribe(interaction, twitterMap, interaction.channel);
	} else if (interaction.commandName === 'unsub') {
		await unsubscribe(interaction, subscriptions, subscription);
	} else {
		await interaction.reply('Unknown command');
	}
});

client.on('error', console.warn);

void client.login(token);