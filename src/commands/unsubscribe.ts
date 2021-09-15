import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { removeRule } from "../twitter/stream";

export async function unsubscribe(
    interaction: CommandInteraction,
    subscriptions: Map<Snowflake, MusicSubscription>,
    subscription?: MusicSubscription
): Promise<void> {
    await interaction.deferReply();
    const username = interaction.options.get('to')?.value?.toString() ?? '';

    await removeRule(interaction, username);
    await interaction.editReply('Removed!');
}