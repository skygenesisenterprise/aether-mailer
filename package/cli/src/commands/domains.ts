import { Command } from '../types/commands.js';
import { Domain, CreateDomainRequest } from '../types/api.js';
import apiClient from '../utils/api.js';
import logger from '../utils/logger.js';
import Formatter from '../utils/format.js';
import Validator from '../utils/validation.js';
import configManager from '../utils/config.js';

const listCommand: Command = {
  name: 'list',
  description: 'List all configured domains',
  usage: 'mailer domains list [options]',
  options: [
    { name: 'format', alias: 'f', description: 'Output format (table|json)', defaultValue: 'table' },
    { name: 'status', alias: 's', description: 'Filter by status (active|inactive)' },
  ],
  async action(args, options) {
    try {
      const params = new URLSearchParams();
      if (options.status || options.s) params.append('status', options.status || options.s);

      const response = await apiClient.get<Domain[]>(`/api/domains?${params.toString()}`);

      if (!response.success) {
        logger.error(response.error || 'Failed to fetch domains');
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
  description: 'Create a new domain',
  usage: 'mailer domains create <domain> [options]',
  options: [
    { name: 'description', alias: 'd', description: 'Domain description' },
    { name: 'active', alias: 'a', description: 'Domain status (true|false)', defaultValue: true },
    { name: 'quota', alias: 'q', description: 'Default user quota in MB', defaultValue: 1000 },
  ],
  async action(args, options) {
    try {
      const domain = args[0];
      Validator.validateRequired(domain, 'Domain');
      Validator.validateDomain(domain);

      const request: CreateDomainRequest = {
        name: domain,
        description: options.description || options.d,
        active: Validator.toBoolean(options.active !== undefined ? options.active : options.a !== undefined ? options.a : true),
        defaultQuota: Number(options.quota || options.q || 1000),
      };

      const response = await apiClient.post<Domain>('/api/domains', request);

      if (!response.success) {
        logger.error(response.error || 'Failed to create domain');
        process.exit(1);
      }

      logger.success(`Domain created: ${response.data?.name}`);
      logger.log(Formatter.json(response.data));
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

export const domainsCommand: Command = {
  name: 'domains',
  description: 'Manage email domains',
  usage: 'mailer domains <subcommand> [options]',
  subcommands: {
    list: listCommand,
    create: createCommand,
  },
  async action(args, options) {
    logger.error('Please specify a subcommand: list, create');
    logger.log('Run "mailer domains --help" for more information');
    process.exit(1);
  },
};

export default domainsCommand;
