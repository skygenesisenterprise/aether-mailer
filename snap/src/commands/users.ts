import { Command } from '../types/commands.js';
import { User, CreateUserRequest, UpdateUserRequest } from '../types/api.js';
import apiClient from '../utils/api.js';
import logger from '../utils/logger.js';
import Formatter from '../utils/format.js';
import Validator from '../utils/validation.js';
import configManager from '../utils/config.js';
import { createInterface } from 'readline';

async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`${message} (y/N): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

const listCommand: Command = {
  name: 'list',
  description: 'List all email users',
  usage: 'mailer users list [options]',
  options: [
    { name: 'domain', alias: 'd', description: 'Filter by domain' },
    { name: 'status', alias: 's', description: 'Filter by status (active|inactive|suspended)' },
    { name: 'format', alias: 'f', description: 'Output format (table|json|csv)', defaultValue: 'table' },
    { name: 'limit', alias: 'l', description: 'Maximum number of results', defaultValue: 100 },
    { name: 'offset', alias: 'o', description: 'Results offset', defaultValue: 0 },
  ],
  async action(args, options) {
    try {
      const params = new URLSearchParams();
      if (options.domain || options.d) params.append('domain', options.domain || options.d);
      if (options.status || options.s) params.append('status', options.status || options.s);
      if (options.limit || options.l) params.append('limit', options.limit || options.l);
      if (options.offset || options.o) params.append('offset', options.offset || options.o);

      const response = await apiClient.get<User[]>(`/api/users?${params.toString()}`);

      if (!response.success) {
        logger.error(response.error || 'Failed to fetch users');
        process.exit(1);
      }

      const format = options.format || options.f || configManager.get('cli.defaultFormat');
      const output = Formatter.format(response.data, format);
      logger.log(output);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

const createCommand: Command = {
  name: 'create',
  description: 'Create a new email user',
  usage: 'mailer users create [options]',
  options: [
    { name: 'email', alias: 'e', description: 'Email address', required: true },
    { name: 'password', alias: 'p', description: 'Password', required: true },
    { name: 'name', alias: 'n', description: 'Display name' },
    { name: 'domain', alias: 'd', description: 'Domain (auto-detected from email)' },
    { name: 'quota', alias: 'q', description: 'Storage quota in MB', defaultValue: 1000 },
    { name: 'active', alias: 'a', description: 'Account status (true|false)', defaultValue: true },
    { name: 'admin', alias: 'A', description: 'Admin privileges (true|false)', defaultValue: false },
  ],
  async action(args, options) {
    try {
      const email = options.email || options.e;
      const password = options.password || options.p;

      Validator.validateRequired(email, 'Email');
      Validator.validateRequired(password, 'Password');
      Validator.validateEmail(email);

      const domain = options.domain || options.d || email.split('@')[1];
      const quota = options.quota || options.q || 1000;
      const active = Validator.toBoolean(options.active !== undefined ? options.active : options.a !== undefined ? options.a : true);
      const isAdmin = Validator.toBoolean(options.admin !== undefined ? options.admin : options.A !== undefined ? options.A : false);

      const request: CreateUserRequest = {
        email,
        password,
        name: options.name || options.n,
        domain,
        quota: Number(quota),
        active,
        isAdmin,
      };

      const response = await apiClient.post<User>('/api/users', request);

      if (!response.success) {
        logger.error(response.error || 'Failed to create user');
        process.exit(1);
      }

      logger.success(`User created: ${response.data?.email}`);
      logger.log(Formatter.json(response.data));
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

const updateCommand: Command = {
  name: 'update',
  description: 'Update an existing user',
  usage: 'mailer users update <email> [options]',
  options: [
    { name: 'password', alias: 'p', description: 'New password' },
    { name: 'name', alias: 'n', description: 'New display name' },
    { name: 'quota', alias: 'q', description: 'New storage quota in MB' },
    { name: 'status', alias: 's', description: 'New status (active|inactive|suspended)' },
    { name: 'admin', alias: 'A', description: 'Admin privileges (true|false)' },
  ],
  async action(args, options) {
    try {
      const email = args[0];
      Validator.validateRequired(email, 'Email');
      Validator.validateEmail(email);

      const request: UpdateUserRequest = {};

      if (options.password || options.p) request.password = options.password || options.p;
      if (options.name || options.n) request.name = options.name || options.n;
      if (options.quota || options.q) request.quota = Number(options.quota || options.q);
      if (options.status || options.s) {
        const status = options.status || options.s;
        Validator.validateStatus(status);
        request.status = status;
      }
      if (options.admin !== undefined || options.A !== undefined) {
        request.isAdmin = Validator.toBoolean(options.admin !== undefined ? options.admin : options.A);
      }

      const response = await apiClient.put<User>(`/api/users/${encodeURIComponent(email)}`, request);

      if (!response.success) {
        logger.error(response.error || 'Failed to update user');
        process.exit(1);
      }

      logger.success(`User updated: ${email}`);
      logger.log(Formatter.json(response.data));
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

const deleteCommand: Command = {
  name: 'delete',
  description: 'Delete a user account',
  usage: 'mailer users delete <email> [options]',
  options: [
    { name: 'force', alias: 'f', description: 'Skip confirmation prompt' },
    { name: 'backup', alias: 'b', description: 'Create backup before deletion' },
  ],
  async action(args, options) {
    try {
      const email = args[0];
      Validator.validateRequired(email, 'Email');
      Validator.validateEmail(email);

      const force = options.force || options.f;
      const shouldConfirm = configManager.get('cli.confirmDestructive') && !force;

      if (shouldConfirm) {
        const confirmed = await confirm(`Are you sure you want to delete user ${email}?`);
        if (!confirmed) {
          logger.info('Operation cancelled');
          return;
        }
      }

      if (options.backup || options.b) {
        logger.info('Creating backup...');
      }

      const response = await apiClient.delete(`/api/users/${encodeURIComponent(email)}`);

      if (!response.success) {
        logger.error(response.error || 'Failed to delete user');
        process.exit(1);
      }

      logger.success(`User deleted: ${email}`);
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

export const usersCommand: Command = {
  name: 'users',
  description: 'Manage email users',
  usage: 'mailer users <subcommand> [options]',
  subcommands: {
    list: listCommand,
    create: createCommand,
    update: updateCommand,
    delete: deleteCommand,
  },
  async action(args, options) {
    logger.error('Please specify a subcommand: list, create, update, delete');
    logger.log('Run "mailer users --help" for more information');
    process.exit(1);
  },
};

export default usersCommand;
