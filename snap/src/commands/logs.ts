import { Command } from '../types/commands.js';
import { LogEntry } from '../types/api.js';
import apiClient from '../utils/api.js';
import logger from '../utils/logger.js';
import Formatter from '../utils/format.js';

export const logsCommand: Command = {
  name: 'logs',
  description: 'View system logs',
  usage: 'mailer logs [options]',
  options: [
    { name: 'service', alias: 's', description: 'Service to filter (api|smtp|imap|all)', defaultValue: 'all' },
    { name: 'level', alias: 'l', description: 'Log level (error|warn|info|debug)', defaultValue: 'info' },
    { name: 'tail', alias: 't', description: 'Number of lines to show', defaultValue: 100 },
    { name: 'follow', alias: 'f', description: 'Follow log output' },
    { name: 'since', alias: 'S', description: 'Show logs since timestamp (ISO 8601)' },
    { name: 'format', alias: 'F', description: 'Output format (text|json)', defaultValue: 'text' },
  ],
  async action(args, options) {
    try {
      const params = new URLSearchParams();
      if (options.service || options.s) params.append('service', options.service || options.s);
      if (options.level || options.l) params.append('level', options.level || options.l);
      if (options.tail || options.t) params.append('tail', options.tail || options.t);
      if (options.since || options.S) params.append('since', options.since || options.S);

      const fetchLogs = async () => {
        const response = await apiClient.get<LogEntry[]>(`/api/logs?${params.toString()}`);

        if (!response.success) {
          logger.error(response.error || 'Failed to fetch logs');
          process.exit(1);
        }

        const format = options.format || options.F || 'text';
        
        if (format === 'json') {
          logger.log(Formatter.json(response.data));
        } else {
          if (Array.isArray(response.data)) {
            response.data.forEach((entry: LogEntry) => {
              const timestamp = new Date(entry.timestamp).toISOString();
              logger.log(`[${timestamp}] [${entry.level.toUpperCase()}] [${entry.service}] ${entry.message}`);
            });
          }
        }
      };

      await fetchLogs();

      if (options.follow || options.f) {
        setInterval(fetchLogs, 2000);
      }
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

export default logsCommand;
