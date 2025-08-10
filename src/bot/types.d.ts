// Minimal augmentation so discord.js builders callbacks infer correctly
import 'discord.js';
declare module 'discord.js' {
    interface SlashCommandBuilder {
        addStringOption(run: (option: SlashCommandStringOption) => SlashCommandStringOption): this;
        addIntegerOption(run: (option: SlashCommandIntegerOption) => SlashCommandIntegerOption): this;
        addChannelOption(run: (option: SlashCommandChannelOption) => SlashCommandChannelOption): this;
        addSubcommand(run: (sub: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder): this;
    }
}
