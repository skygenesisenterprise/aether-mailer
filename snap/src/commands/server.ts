import { Command } from '../types/commands.js';
import { ServerStatus, HealthCheck } from '../types/api.js';
import apiClient from '../utils/api.js';
import logger from '../utils/logger.js';
import Formatter from '../utils/format.js';
import configManager from '../utils/config.js';

const statusCommand: Command = {
  name: 'status',
  description: 'Check server status',
  usage: 'mailer status [options]',
  options: [
    { name: 'format', alias: 'f', description: 'Output format (table|json)', defaultValue: 'table' },
    { name: 'verbose', alias: 'v', description: 'Detailed status information' },
    { name: 'watch', alias: 'w', description: 'Watch status changes continuously' },
  ],
  async action(args, options) {
    try {
      const fetchStatus = async () => {
        const response = await apiClient.get<ServerStatus>('/api/status');

        if (!response.success) {
          logger.error(response.error || 'Failed to fetch status');
          process.exit(1);
        }

        const format = options.format || options.f || configManager.get('cli.defaultFormat');
        const output = Formatter.format(response.data, format);
        
        if (options.watch || options.w) {
          console.clear();
          logger.log(`Server Status (${new Date().toLocaleTimeString()})\n`);
        }
        
        logger.log(output);
      };

      await fetchStatus();

      if (options.watch || options.w) {
        setInterval(fetchStatus, 5000);
      }
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

const healthCommand: Command = {
  name: 'health',
  description: 'Perform health checks',
  usage: 'mailer health [options]',
  options: [
    { name: 'check', alias: 'c', description: 'Specific service (database|redis|smtp|imap)' },
    { name: 'timeout', alias: 't', description: 'Health check timeout in seconds', defaultValue: 30 },
    { name: 'quiet', alias: 'q', description: 'Only exit code, no output' },
  ],
  async action(args, options) {
    try {
      const service = options.check || options.c;
      const endpoint = service ? `/api/health/${service}` : '/api/health';

      const response = await apiClient.get<HealthCheck[]>(endpoint);

      if (!response.success) {
        logger.error(response.error || 'Health check failed');
        process.exit(1);
      }

      if (options.quiet || options.q) {
        const allHealthy = Array.isArray(response.data) 
          ? response.data.every((check: HealthCheck) => check.status === 'healthy')
          : response.data && (response.data as any).status === 'healthy';
        process.exit(allHealthy ? 0 : 1);
      }

      logger.log(Formatter.json(response.data));
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

export const serverCommand: Command = {
  name: 'server',
  description: 'Server management commands',
  usage: 'mailer server <subcommand> [options]',
  subcommands: {
    status: statusCommand,
    health: healthCommand,
  },
  async action(args, options) {
    await statusCommand.action(args, options);
  },
};

export default serverCommand;
