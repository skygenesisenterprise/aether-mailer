import { Command } from "./types/commands.js";
import logger from "./utils/logger.js";

export class CLI {
  private commands: Map<string, Command> = new Map();
  private version: string;
  private name: string;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }

  register(command: Command): void {
    this.commands.set(command.name, command);
  }

  private parseArgs(args: string[]): {
    command: string;
    subcommand?: string;
    args: string[];
    options: any;
  } {
    const options: any = {};
    const positional: string[] = [];
    let command = "";
    let subcommand: string | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith("--")) {
        const key = arg.slice(2);
        const nextArg = args[i + 1];

        if (nextArg && !nextArg.startsWith("-")) {
          options[key] = nextArg;
          i++;
        } else {
          options[key] = true;
        }
      } else if (arg.startsWith("-") && arg.length === 2) {
        const key = arg.slice(1);
        const nextArg = args[i + 1];

        if (nextArg && !nextArg.startsWith("-")) {
          options[key] = nextArg;
          i++;
        } else {
          options[key] = true;
        }
      } else {
        positional.push(arg);
      }
    }

    if (positional.length > 0) {
      command = positional[0];
      if (positional.length > 1) {
        subcommand = positional[1];
        positional.splice(0, 2);
      } else {
        positional.splice(0, 1);
      }
    }

    return { command, subcommand, args: positional, options };
  }

  private showHelp(command?: Command): void {
    if (command) {
      logger.log(`\nUsage: ${command.usage}\n`);
      logger.log(`Description: ${command.description}\n`);

      if (command.options && command.options.length > 0) {
        logger.log("Options:");
        command.options.forEach((opt) => {
          const alias = opt.alias ? `, -${opt.alias}` : "";
          const required = opt.required ? " (required)" : "";
          const defaultVal =
            opt.defaultValue !== undefined
              ? ` [default: ${opt.defaultValue}]`
              : "";
          logger.log(
            `  --${opt.name}${alias}  ${opt.description}${required}${defaultVal}`,
          );
        });
        logger.log("");
      }

      if (command.subcommands) {
        logger.log("Subcommands:");
        Object.entries(command.subcommands).forEach(([name, subcmd]) => {
          logger.log(`  ${name}  ${subcmd.description}`);
        });
        logger.log("");
      }
    } else {
      logger.log(`\n${this.name} v${this.version}\n`);
      logger.log(`Usage: ${this.name} <command> [options]\n`);
      logger.log("Commands:");
      this.commands.forEach((cmd) => {
        logger.log(`  ${cmd.name.padEnd(15)} ${cmd.description}`);
      });
      logger.log("\nOptions:");
      logger.log("  --help, -h     Show help");
      logger.log("  --version, -v  Show version\n");
    }
  }

  async run(args: string[]): Promise<void> {
    try {
      if (args.includes("--version") || args.includes("-v")) {
        logger.log(`${this.name} v${this.version}`);
        return;
      }

      if (args.includes("--help") || args.includes("-h") || args.length === 0) {
        this.showHelp();
        return;
      }

      const parsed = this.parseArgs(args);
      const command = this.commands.get(parsed.command);

      if (!command) {
        logger.error(`Unknown command: ${parsed.command}`);
        logger.log(`Run "${this.name} --help" for usage information`);
        process.exit(1);
      }

      if (parsed.options.help || parsed.options.h) {
        this.showHelp(command);
        return;
      }

      if (parsed.subcommand && command.subcommands) {
        const subcommand = command.subcommands[parsed.subcommand];
        if (!subcommand) {
          logger.error(`Unknown subcommand: ${parsed.subcommand}`);
          this.showHelp(command);
          process.exit(1);
        }

        await subcommand.action(parsed.args, parsed.options);
      } else {
        await command.action(parsed.args, parsed.options);
      }
    } catch (error: any) {
      logger.error(error.message || "An error occurred");
      if (error.stack && process.env.DEBUG) {
        logger.debug(error.stack);
      }
      process.exit(1);
    }
  }
}

export default CLI;
