import { CommandInteraction } from "discord.js";
import { MusicSubscription } from "../music/subscription";

export async function unpause(interaction: CommandInteraction, subscription?: MusicSubscription): Promise<void> {
    if (subscription) {
        subscription.audioPlayer.unpause();
        await interaction.reply({ content: `Unpaused!`, ephemeral: true });
    } else {
        await interaction.reply('Not playing in this server!');
    }
}