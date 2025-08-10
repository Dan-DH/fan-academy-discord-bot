
import { registerCommand } from '../commands/register';
import { unregisterCommand } from '../commands/unregister';
import { configCommand } from '../commands/config';

import {
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

type AnySlash =
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;

export const allCommands = [
    registerCommand,
    unregisterCommand,
    configCommand,
] as const satisfies ReadonlyArray<AnySlash>;

