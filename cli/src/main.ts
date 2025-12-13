#!/usr/bin/env node

import { CLI } from './cli.js';
import { usersCommand } from './commands/users.js';
import { domainsCommand } from './commands/domains.js';
import { serverCommand } from './commands/server.js';
import { logsCommand } from './commands/logs.js';
import { metricsCommand } from './commands/metrics.js';
import { configCommand } from './commands/config.js';
import { backupCommand } from './commands/backup.js';
import { initCommand } from './commands/init.js';
import configManager from './utils/config.js';
import logger from './utils/logger.js';

const VERSION = '0.1.0';

async function main() {
  const config = configManager.getAll();
  logger.setColors(config.output.colors);
  logger.setLogLevel(config.cli.logLevel as any);

  const cli = new CLI('mailer', VERSION);

  cli.register(initCommand);
  cli.register(usersCommand);
  cli.register(domainsCommand);
  cli.register(serverCommand);
  cli.register(logsCommand);
  cli.register(metricsCommand);
  cli.register(configCommand);
  cli.register(backupCommand);

  const args = process.argv.slice(2);
  await cli.run(args);
}

main().catch(error => {
  logger.error(error.message);
  process.exit(1);
});
