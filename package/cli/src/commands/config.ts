import { Command } from '../types/commands.js';
import configManager from '../utils/config.js';
import logger from '../utils/logger.js';
import Formatter from '../utils/format.js';

const getCommand: Command = {
  name: 'get',
  description: 'Get configuration value',
  usage: 'mailer config get <key> [options]',
  options: [
    { name: 'format', alias: 'f', description: 'Output format (text|json)', defaultValue: 'text' },
  ],
  async action(args, options) {
    try {
      const key = args[0];

      if (!key || key === 'list') {
        const config = configManager.getAll();
        const format = options.format || options.f || 'json';
        logger.log(Formatter.format(config, format));
        return;
      }

      const value = configManager.get(key);

      if (value === undefined) {
        logger.error(`Configuration key not found: ${key}`);
        process.exit(1);
      }

      const format = options.format || options.f || 'text';
      if (format === 'json') {
        logger.log(Formatter.json({ [key]: value }));
      } else {
        logger.log(String(value));
      }
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

const setCommand: Command = {
  name: 'set',
  description: 'Set configuration value',
  usage: 'mailer config set <key> <value> [options]',
  options: [
    { name: 'type', alias: 't', description: 'Value type (string|number|boolean|json)' },
    { name: 'restart', alias: 'r', description: 'Restart server after config change' },
  ],
  async action(args, options) {
    try {
      const key = args[0];
      let value: any = args[1];

      if (!key || !value) {
        logger.error('Both key and value are required');
        process.exit(1);
      }

      const type = options.type || options.t;
      if (type === 'number') {
        value = Number(value);
      } else if (type === 'boolean') {
        value = value === 'true';
      } else if (type === 'json') {
        value = JSON.parse(value);
      }

      configManager.set(key, value);
      logger.success(`Configuration updated: ${key} = ${value}`);

      if (options.restart || options.r) {
        logger.info('Server restart required for changes to take effect');
      }
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

export const configCommand: Command = {
  name: 'config',
  description: 'Configuration management',
  usage: 'mailer config <subcommand> [options]',
  subcommands: {
    get: getCommand,
    set: setCommand,
  },
  async action(args, options) {
    logger.error('Please specify a subcommand: get, set');
    logger.log('Run "mailer config --help" for more information');
    process.exit(1);
  },
};

export default configCommand;
