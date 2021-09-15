import { CommandInteraction } from "discord.js";
import { MusicSubscription } from "../music/subscription";

export async function pause(interaction: CommandInteraction, subscription?: MusicSubscription): Promise<void> {
    if (subscription) {
        subscription.audioPlayer.pause();
        await interaction.reply({ content: `Paused!`, ephemeral: true });
    } else {
        await interaction.reply('Not playing in this server!');
    }
}