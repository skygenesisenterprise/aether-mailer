import { Command } from '../types/commands.js';
import { Metrics } from '../types/api.js';
import apiClient from '../utils/api.js';
import logger from '../utils/logger.js';
import Formatter from '../utils/format.js';
import configManager from '../utils/config.js';

export const metricsCommand: Command = {
  name: 'metrics',
  description: 'Display system metrics',
  usage: 'mailer metrics [options]',
  options: [
    { name: 'type', alias: 't', description: 'Metric type (system|email|users|all)', defaultValue: 'all' },
    { name: 'format', alias: 'f', description: 'Output format (table|json|prometheus)', defaultValue: 'table' },
    { name: 'duration', alias: 'd', description: 'Time range (1h|6h|24h|7d)', defaultValue: '1h' },
    { name: 'watch', alias: 'w', description: 'Watch metrics in real-time' },
  ],
  async action(args, options) {
    try {
      const fetchMetrics = async () => {
        const params = new URLSearchParams();
        if (options.type || options.t) params.append('type', options.type || options.t);
        if (options.duration || options.d) params.append('duration', options.duration || options.d);

        const response = await apiClient.get<Metrics>(`/api/metrics?${params.toString()}`);

        if (!response.success) {
          logger.error(response.error || 'Failed to fetch metrics');
          process.exit(1);
        }

        const format = options.format || options.f || configManager.get('cli.defaultFormat');
        
        if (options.watch || options.w) {
          console.clear();
          logger.log(`System Metrics (${new Date().toLocaleTimeString()})\n`);
        }

        const output = Formatter.format(response.data, format);
        logger.log(output);
      };

      await fetchMetrics();

      if (options.watch || options.w) {
        setInterval(fetchMetrics, 5000);
      }
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

export default metricsCommand;
