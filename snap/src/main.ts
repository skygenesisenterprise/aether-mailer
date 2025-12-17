#!/usr/bin/env node

import { CLI } from "./cli.js";
import { usersCommand } from "./commands/users.js";
import { domainsCommand } from "./commands/domains.js";
import { serverCommand } from "./commands/server.js";
import { logsCommand } from "./commands/logs.js";
import { metricsCommand } from "./commands/metrics.js";
import { configCommand } from "./commands/config.js";
import { backupCommand } from "./commands/backup.js";
import { initCommand } from "./commands/init.js";
import configManager from "./utils/config.js";
import logger from "./utils/logger.js";

const VERSION = "0.1.0";

async function main() {
  const config = configManager.getAll();
  logger.setColors(config.output.colors);
  logger.setLogLevel(config.cli.logLevel as any);

  const cli = new CLI("mailer-snap", VERSION);

  // Register top-level commands
  cli.register(initCommand);
  cli.register(usersCommand);
  cli.register(domainsCommand);
  cli.register(serverCommand);
  cli.register(logsCommand);
  cli.register(metricsCommand);
  cli.register(configCommand);
  cli.register(backupCommand);

  // Snap-specific commands
  cli.register({
    name: "snap",
    description: "Snap-specific operations",
    usage: "mailer-snap snap <subcommand> [options]",
    options: [
      {
        name: "info",
        description: "Show snap information",
        alias: "i",
        required: false,
        defaultValue: false,
      },
      {
        name: "services",
        description: "Show snap services status",
        alias: "s",
        required: false,
        defaultValue: false,
      },
    ],
    subcommands: {
      info: {
        name: "info",
        description: "Display snap environment information",
        usage: "mailer-snap snap info",
        options: [],
        async action(_args: string[], _options: any) {
          logger.log("Snap Environment Information:");
          logger.log("=============================");

          // Display snap environment variables if available
          const snapData = process.env.SNAP_DATA;
          const snapCommon = process.env.SNAP_COMMON;
          const snapVersion = process.env.SNAP_VERSION;

          logger.log(`Snap Data: ${snapData || "Not available"}`);
          logger.log(`Snap Common: ${snapCommon || "Not available"}`);
          logger.log(`Snap Version: ${snapVersion || "Not available"}`);
          logger.log(`Node Version: ${process.version}`);
          logger.log(`Platform: ${process.platform}`);
          logger.log(`Architecture: ${process.arch}`);
        },
      },
      services: {
        name: "services",
        description: "Show status of snap services",
        usage: "mailer-snap snap services",
        options: [],
        async action(_args: string[], _options: any) {
          logger.log("Snap Services Status:");
          logger.log("=====================");

          // Check if running in snap environment
          if (process.env.SNAP_NAME) {
            logger.log(`✓ Running in snap: ${process.env.SNAP_NAME}`);
            logger.log("Services:");
            logger.log("  - aether-mailer.server: Checking...");
            logger.log("  - aether-mailer.cli: Active (current)");
            logger.log("  - aether-mailer.monitoring: Not configured");
          } else {
            logger.log("⚠ Not running in snap environment");
            logger.log("This command is intended for snap installations");
          }
        },
      },
      env: {
        name: "env",
        description: "Show snap environment variables",
        usage: "mailer-snap snap env",
        options: [],
        async action(_args: string[], _options: any) {
          logger.log("Snap Environment Variables:");
          logger.log("===========================");

          const snapVars = [
            "SNAP_NAME",
            "SNAP_VERSION",
            "SNAP_REVISION",
            "SNAP_ARCH",
            "SNAP_DATA",
            "SNAP_COMMON",
            "SNAP_USER_DATA",
            "SNAP_USER_COMMON",
            "SNAP_COOKIE",
          ];

          snapVars.forEach((varName) => {
            const value = process.env[varName];
            logger.log(`${varName}: ${value || "Not set"}`);
          });
        },
      },
    },
    async action(args: string[], options: any) {
      if (options.info) {
        const infoCmd = this.subcommands?.info;
        if (infoCmd) await infoCmd.action(args, options);
      } else if (options.services) {
        const servicesCmd = this.subcommands?.services;
        if (servicesCmd) await servicesCmd.action(args, options);
      } else {
        logger.log("Use 'mailer-snap snap --help' for available subcommands");
        logger.log("Available subcommands: info, services, env");
      }
    },
  });

  // Register direct aliases for common commands
  cli.register({
    name: "status",
    description: "Check server status",
    usage: "mailer-snap status [options]",
    options: serverCommand.options,
    async action(args: string[], options: any) {
      const statusSubcommand = serverCommand.subcommands?.status;
      if (statusSubcommand) {
        await statusSubcommand.action(args, options);
      }
    },
  });

  cli.register({
    name: "health",
    description: "Perform health checks",
    usage: "mailer-snap health [options]",
    options: serverCommand.options,
    async action(args: string[], options: any) {
      const healthSubcommand = serverCommand.subcommands?.health;
      if (healthSubcommand) {
        await healthSubcommand.action(args, options);
      }
    },
  });

  const args = process.argv.slice(2);
  await cli.run(args);
}

main().catch((error) => {
  logger.error(error.message);
  process.exit(1);
});
