import { CommandInteraction } from "discord.js";
import { MusicSubscription } from "../music/subscription";

export async function skip(interaction: CommandInteraction, subscription?: MusicSubscription): Promise<void> {
    if (subscription) {
        // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
        // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
        // will be loaded and played.
        subscription.audioPlayer.stop();
        await interaction.reply('Skipped song!');
    } else {
        await interaction.reply('Not playing in this server!');
    }
}