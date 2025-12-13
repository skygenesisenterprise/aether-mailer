import { OutputFormat } from '../types/commands.js';

export class Formatter {
  static table(data: any[], columns?: string[]): string {
    if (!data || data.length === 0) {
      return 'No data to display';
    }

    const keys = columns || Object.keys(data[0]);
    const columnWidths: Record<string, number> = {};

    keys.forEach(key => {
      columnWidths[key] = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
    });

    const separator = keys.map(key => '-'.repeat(columnWidths[key])).join(' | ');
    const header = keys.map(key => key.padEnd(columnWidths[key])).join(' | ');

    const rows = data.map(row =>
      keys.map(key => String(row[key] || '').padEnd(columnWidths[key])).join(' | ')
    );

    return [header, separator, ...rows].join('\n');
  }

  static json(data: any, pretty = true): string {
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  static csv(data: any[], columns?: string[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const keys = columns || Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map(row =>
      keys.map(key => {
        const value = String(row[key] || '');
        return value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );

    return [header, ...rows].join('\n');
  }

  static text(data: any): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }
    return String(data);
  }

  static prometheus(metrics: any): string {
    const lines: string[] = [];

    const flatten = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const metricName = prefix ? `${prefix}_${key}` : key;
        if (typeof value === 'object' && value !== null) {
          flatten(value, metricName);
        } else if (typeof value === 'number') {
          lines.push(`${metricName} ${value}`);
        }
      }
    };

    flatten(metrics);
    return lines.join('\n');
  }

  static format(data: any, format: OutputFormat, columns?: string[]): string {
    switch (format) {
      case 'table':
        return Array.isArray(data) ? this.table(data, columns) : this.text(data);
      case 'json':
        return this.json(data);
      case 'csv':
        return Array.isArray(data) ? this.csv(data, columns) : '';
      case 'prometheus':
        return this.prometheus(data);
      case 'text':
      default:
        return this.text(data);
    }
  }

  static bytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  static duration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  static timestamp(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  }
}

export default Formatter;
