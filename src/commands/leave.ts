import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";

export async function leave(
    interaction: CommandInteraction,
    subscriptions: Map<Snowflake, MusicSubscription>,
    subscription?: MusicSubscription
): Promise<void> {
    if (subscription) {
        subscription.voiceConnection.destroy();
        subscriptions.delete(interaction.guildId ?? '');
        await interaction.reply({ content: `Left channel!`, ephemeral: true });
    } else {
        await interaction.reply('Not playing in this server!');
    }
}