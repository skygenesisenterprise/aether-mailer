import { Command } from '../types/commands.js';
import { Backup } from '../types/api.js';
import apiClient from '../utils/api.js';
import logger from '../utils/logger.js';
import Formatter from '../utils/format.js';
import Validator from '../utils/validation.js';

const createCommand: Command = {
  name: 'create',
  description: 'Create a new backup',
  usage: 'mailer backup create [options]',
  options: [
    { name: 'type', alias: 't', description: 'Backup type (full|incremental)', defaultValue: 'full' },
    { name: 'compress', alias: 'c', description: 'Compress backup', defaultValue: true },
    { name: 'path', alias: 'p', description: 'Custom backup path' },
  ],
  async action(args, options) {
    try {
      const type = options.type || options.t || 'full';
      Validator.validateRequired(type, 'Backup type');

      const request = {
        type,
        compress: Validator.toBoolean(options.compress !== undefined ? options.compress : options.c !== undefined ? options.c : true),
        path: options.path || options.p,
      };

      logger.info('Creating backup...');
      const response = await apiClient.post<Backup>('/api/backup', request);

      if (!response.success) {
        logger.error(response.error || 'Failed to create backup');
        process.exit(1);
      }

      logger.success(`Backup created: ${response.data?.id}`);
      logger.log(Formatter.json(response.data));
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

const listCommand: Command = {
  name: 'list',
  description: 'List available backups',
  usage: 'mailer backup list [options]',
  options: [
    { name: 'format', alias: 'f', description: 'Output format (table|json)', defaultValue: 'table' },
  ],
  async action(args, options) {
    try {
      const response = await apiClient.get<Backup[]>('/api/backup');

      if (!response.success) {
        logger.error(response.error || 'Failed to fetch backups');
        process.exit(1);
      }

      const format = options.format || options.f || 'table';
      const output = Formatter.format(response.data, format);
      logger.log(output);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

const restoreCommand: Command = {
  name: 'restore',
  description: 'Restore from backup',
  usage: 'mailer backup restore <id> [options]',
  async action(args, options) {
    try {
      const backupId = args[0];
      Validator.validateRequired(backupId, 'Backup ID');

      logger.info(`Restoring from backup: ${backupId}...`);
      const response = await apiClient.post(`/api/backup/${backupId}/restore`, {});

      if (!response.success) {
        logger.error(response.error || 'Failed to restore backup');
        process.exit(1);
      }

      logger.success('Backup restored successfully');
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

const deleteCommand: Command = {
  name: 'delete',
  description: 'Delete a backup',
  usage: 'mailer backup delete <id> [options]',
  async action(args, options) {
    try {
      const backupId = args[0];
      Validator.validateRequired(backupId, 'Backup ID');

      const response = await apiClient.delete(`/api/backup/${backupId}`);

      if (!response.success) {
        logger.error(response.error || 'Failed to delete backup');
        process.exit(1);
      }

      logger.success(`Backup deleted: ${backupId}`);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

export const backupCommand: Command = {
  name: 'backup',
  description: 'Backup management',
  usage: 'mailer backup <subcommand> [options]',
  subcommands: {
    create: createCommand,
    list: listCommand,
    restore: restoreCommand,
    delete: deleteCommand,
  },
  async action(args, options) {
    logger.error('Please specify a subcommand: create, list, restore, delete');
    logger.log('Run "mailer backup --help" for more information');
    process.exit(1);
  },
};

export default backupCommand;
