import { Snowflake } from "discord-api-types";
import { CommandInteraction, TextBasedChannels, TextChannel } from "discord.js";
import { Twitter } from "..";
import { doShit } from "../twitter/stream";

export async function subscribe(
    interaction: CommandInteraction,
    twitter: Map<Snowflake, Twitter>,
    channel: TextBasedChannels,
): Promise<void> {
    if (!interaction.guildId) {
        return;
    }

    await interaction.deferReply();

    const client = twitter.get(interaction.guildId);
    const usernames = [ ...(client?.atList ?? []), interaction.options.get('to')?.value?.toString() ?? '' ];
    
    if (!client) {
        twitter.set(interaction.guildId, {
            atList: usernames,
            hasStream: false,
        });
    } else {
        twitter.set(interaction.guildId, {
            hasStream: client.hasStream,
            atList: usernames,
        });
    }

    await doShit(interaction, usernames, twitter, channel);

    interaction.editReply('done');
}