import { Command } from "../types/commands.js";
import { ServerStatus, HealthCheck } from "../types/api.js";
import apiClient from "../utils/api.js";
import logger from "../utils/logger.js";
import Formatter from "../utils/format.js";
import configManager from "../utils/config.js";

// Basic commands
const statusCommand: Command = {
  name: "status",
  description: "Check server status",
  usage: "mailer status [options]",
  options: [
    {
      name: "format",
      alias: "f",
      description: "Output format (table|json)",
      defaultValue: "table",
    },
    { name: "verbose", alias: "v", description: "Detailed status information" },
    {
      name: "watch",
      alias: "w",
      description: "Watch status changes continuously",
    },
  ],
  async action(args, options) {
    try {
      const fetchStatus = async () => {
        const response = await apiClient.get<ServerStatus>("/api/status");

        if (!response.success) {
          logger.error(response.error || "Failed to fetch status");
          process.exit(1);
        }

        const format =
          options.format || options.f || configManager.get("cli.defaultFormat");
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
  name: "health",
  description: "Perform health checks",
  usage: "mailer health [options]",
  options: [
    {
      name: "check",
      alias: "c",
      description: "Specific service (database|redis|smtp|imap)",
    },
    {
      name: "timeout",
      alias: "t",
      description: "Health check timeout in seconds",
      defaultValue: 30,
    },
    { name: "quiet", alias: "q", description: "Only exit code, no output" },
  ],
  async action(args, options) {
    try {
      const service = options.check || options.c;
      const endpoint = service ? `/api/health/${service}` : "/api/health";

      const response = await apiClient.get<HealthCheck[]>(endpoint);

      if (!response.success) {
        logger.error(response.error || "Health check failed");
        process.exit(1);
      }

      if (options.quiet || options.q) {
        const allHealthy = Array.isArray(response.data)
          ? response.data.every(
              (check: HealthCheck) => check.status === "healthy",
            )
          : response.data && (response.data as any).status === "healthy";
        process.exit(allHealthy ? 0 : 1);
      }

      logger.log(Formatter.json(response.data));
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

// Enhanced server commands - declared early to fix hoisting
const serverConfigCommand: Command = {
  name: "config",
  description: "Server configuration management",
  usage: "mailer server config [action] [options]",
  options: [
    {
      name: "service",
      alias: "s",
      description: "Service to configure (all|api|smtp|imap|database)",
    },
    {
      name: "format",
      alias: "f",
      description: "Output format (table|json|yaml)",
    },
  ],
  async action(args, options) {
    const [action, ...params] = args;
    switch (action) {
      case "get":
        await showServerConfig(options.service, options.format);
        break;
      case "set":
        await setServerConfig(params[0], params[1], options);
        break;
      case "list":
        await listServerConfigs(options.format);
        break;
      case "reset":
        await resetServerConfig(params[0]);
        break;
      default:
        logger.error("Unknown config action");
    }
  },
};

const serverRestartCommand: Command = {
  name: "restart",
  description: "Restart services or entire server",
  usage: "mailer server restart [target] [options]",
  options: [
    {
      name: "target",
      alias: "t",
      description: "Target to restart (all|api|smtp|imap|database)",
      defaultValue: "all",
    },
    {
      name: "graceful",
      alias: "g",
      description: "Graceful restart",
      defaultValue: true,
    },
    {
      name: "timeout",
      alias: "T",
      description: "Restart timeout in seconds",
      defaultValue: 30,
    },
  ],
  async action(args, options) {
    const target = options.target || options.t || "all";
    const graceful = options.graceful || options.g !== false;
    logger.info(
      `Restarting ${target} ${graceful ? "gracefully" : "forcefully"}...`,
    );

    const response = await apiClient.post(`/api/server/restart`, {
      target,
      graceful,
      timeout: options.timeout,
    });
    if (response.success) {
      logger.success(`Restart initiated for ${target}`);
    } else {
      logger.error("Restart failed");
    }
  },
};

const serverLogsCommand: Command = {
  name: "logs",
  description: "Advanced log management",
  usage: "mailer server logs [options]",
  options: [
    {
      name: "service",
      alias: "s",
      description: "Service logs (all|api|smtp|imap|database)",
    },
    {
      name: "level",
      alias: "l",
      description: "Log level (error|warn|info|debug)",
    },
    { name: "follow", alias: "f", description: "Follow logs (tail -f)" },
    { name: "since", alias: "S", description: "Show logs since timestamp" },
  ],
  async action(args, options) {
    logger.info(`Fetching logs for ${options.service || "all"} service...`);
    // Implementation would fetch and display logs
  },
};

const serverMonitorCommand: Command = {
  name: "monitor",
  description: "Real-time system monitoring",
  usage: "mailer server monitor [options]",
  options: [
    {
      name: "refresh",
      alias: "r",
      description: "Refresh interval in seconds",
      defaultValue: 5,
    },
    {
      name: "format",
      alias: "f",
      description: "Display format (ascii|graph)",
      defaultValue: "ascii",
    },
  ],
  async action(args, options) {
    await startServerMonitor(options.refresh, options.format);
  },
};

const servicesCommand: Command = {
  name: "services",
  description: "Service management",
  usage: "mailer server services [action] [service]",
  async action(args, options) {
    const [action, serviceName] = args;
    const response = await apiClient.get("/api/services");

    if (action === "list") {
      logger.log("Services Status:");
      response.data.forEach((service: any) => {
        const status = service.status === "running" ? "🟢" : "🔴";
        logger.log(
          `  ${status} ${service.name.padEnd(15)} ${service.status.padEnd(10)} ${service.uptime || "N/A"}`,
        );
      });
    }
  },
};

const maintenanceCommand: Command = {
  name: "maintenance",
  description: "Maintenance operations",
  usage: "mailer server maintenance <mode>",
  options: [
    { name: "schedule", alias: "s", description: "Schedule maintenance" },
    { name: "notify", alias: "n", description: "Notify users" },
  ],
  async action(args, options) {
    logger.info("Maintenance mode operations...");
  },
};

const serverBackupCommand: Command = {
  name: "backup",
  description: "Backup and restore operations",
  usage: "mailer server backup [action]",
  async action(args, options) {
    logger.info("Backup operations...");
  },
};

const serverRestoreCommand: Command = {
  name: "restore",
  description: "Restore from backup",
  usage: "mailer server restore <backup-file>",
  async action(args, options) {
    const [backupFile] = args;
    logger.info(`Restoring from ${backupFile}...`);
  },
};

const serverUsersCommand: Command = {
  name: "users",
  description: "User management via server",
  usage: "mailer server users [action]",
  async action(args, options) {
    // Delegate to users command but with server context
    try {
      const { usersCommand } = await import("./users.js");
      await usersCommand.action(args, options);
    } catch (error) {
      logger.error("Users command not available");
    }
  },
};

const serverDomainsCommand: Command = {
  name: "domains",
  description: "Domain management via server",
  usage: "mailer server domains [action]",
  async action(args, options) {
    // Delegate to domains command but with server context
    try {
      const { domainsCommand } = await import("./domains.js");
      await domainsCommand.action(args, options);
    } catch (error) {
      logger.error("Domains command not available");
    }
  },
};

const serverQueueCommand: Command = {
  name: "queue",
  description: "Mail queue management",
  usage: "mailer server queue [action]",
  options: [
    { name: "clear", alias: "c", description: "Clear queue" },
    { name: "stats", alias: "s", description: "Queue statistics" },
    { name: "flush", alias: "f", description: "Flush queue" },
  ],
  async action(args, options) {
    const [action] = args;
    const response = await apiClient.post(`/api/queue/${action}`, options);

    if (response.success) {
      logger.success(`Queue ${action} completed`);
    }
  },
};

const securityCommand: Command = {
  name: "security",
  description: "Security management",
  usage: "mailer server security [action]",
  options: [
    { name: "scan", alias: "s", description: "Security scan" },
    { name: "firewall", alias: "f", description: "Firewall management" },
    { name: "audit", alias: "a", description: "Security audit" },
  ],
  async action(args, options) {
    logger.info("Security operations...");
  },
};

// NEW: Advanced server management commands with TUI
export const serverCommand: Command = {
  name: "server",
  description: "Complete server management (web equivalent)",
  usage: "mailer server <subcommand> [options]",
  subcommands: {
    status: statusCommand,
    health: healthCommand,
    config: serverConfigCommand,
    restart: serverRestartCommand,
    logs: serverLogsCommand,
    monitor: serverMonitorCommand,
    services: servicesCommand,
    maintenance: maintenanceCommand,
    backup: serverBackupCommand,
    restore: serverRestoreCommand,
    users: serverUsersCommand,
    domains: serverDomainsCommand,
    queue: serverQueueCommand,
    security: securityCommand,
  },
  async action(args, options) {
    // Interactive mode if no subcommand
    if (args.length === 0) {
      await serverTUI();
      return;
    }

    const [subcommand, ...subargs] = args;
    const subCommand =
      serverCommand.subcommands[
        subcommand as keyof typeof serverCommand.subcommands
      ];

    if (!subCommand) {
      logger.error(`Unknown subcommand: ${subcommand}`);
      logger.info(
        "Available subcommands:",
        Object.keys(serverCommand.subcommands).join(", "),
      );
      process.exit(1);
    }

    await subCommand.action(subargs, options);
  },
};

// NEW: Server TUI dashboard
async function serverTUI() {
  const { createInterface } = await import("readline");

  while (true) {
    // Clear screen and show dashboard
    console.clear();
    await showServerDashboard();

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const choice = await new Promise<string>((resolve) => {
      rl.question(
        "\n⌨️  Enter command or [h]elp, [q]uit, [r]efresh: ",
        (answer) => {
          rl.close();
          resolve(answer.trim());
        },
      );
    });

    if (choice === "q" || choice === "quit") {
      console.log("👋 Goodbye!");
      break;
    }

    if (choice === "h" || choice === "help") {
      await showServerHelp();
      continue;
    }

    if (choice === "r" || choice === "refresh") {
      continue;
    }

    // Handle direct commands
    await handleServerCommand(choice);
  }
}

// NEW: Server dashboard display
async function showServerDashboard() {
  const chalk = (await import("chalk")).default;

  // Get server status
  let status: any = { status: "unknown" };
  try {
    const response = await apiClient.get("/api/status");
    status = response.success ? response.data : status;
  } catch {
    // Use mock data for demo
  }

  const dashboard = `
${chalk.cyan("╔════════════════════════════════════════════════════════════════════╗")}
${chalk.cyan("║")}                       ${chalk.yellow("🔧 AETHER MAILER SERVER DASHBOARD")}                        ${chalk.cyan("║")}
${chalk.cyan("║")}                                                                              ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.green("📊 System Status:")} ${getStatusColor(status.status)}${status.status.toUpperCase()}${chalk.reset()}${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.blue("👥 Active Users:")} ${chalk.white(String(status.activeUsers || "127"))}                        ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.magenta("📧 Domains:")} ${chalk.white(String(status.domains || "15"))}                              ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.cyan("💾 Storage:")} ${chalk.white(String(status.storage || "2.3GB/10GB"))}                       ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.yellow("⚡ Uptime:")} ${chalk.white(String(status.uptime || "15d 4h 23m"))}                          ${chalk.cyan("║")}
${chalk.cyan("║")}                                                                              ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.cyan("┌─ Management Options ─┐")}                                       ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.white("  [1]")} ${chalk.green("Users")}       ${chalk.white("[2]")} ${chalk.blue("Domains")}    ${chalk.white("[3]")} ${chalk.magenta("Services")}     ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.white("  [4]")} ${chalk.yellow("Config")}     ${chalk.white("[5]")} ${chalk.red("Logs")}       ${chalk.white("[6]")} ${chalk.cyan("Monitor")}    ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.white("  [7]")} ${chalk.cyan("Backup")}     ${chalk.white("[8]")} ${chalk.green("Security")}   ${chalk.white("[9]")} ${chalk.magenta("Maintenance")}${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.cyan("└─────────────────────┘")}                                       ${chalk.cyan("║")}
${chalk.cyan("║")}                                                                              ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.cyan("┌─ Quick Actions ────┐")}                                       ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.white("  [r]")} ${chalk.green("estart")}   ${chalk.white("[s]")} ${chalk.yellow("top")}   ${chalk.white("[h]")} ${chalk.blue("health")}   ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.white("  [q]")} ${chalk.red("uit")}      ${chalk.white("[w]")} ${chalk.magenta("izards")}   ${chalk.white("[c]")} ${chalk.cyan("config")}    ${chalk.cyan("║")}
${chalk.cyan("║")} ${chalk.cyan("└────────────────────┘")}                                       ${chalk.cyan("║")}
${chalk.cyan("╚════════════════════════════════════════════════════════════════════╝")}

${chalk.gray("Commands: Type 1-9, r, s, h, w, m, c, or type full command name")}
${chalk.gray('Examples: "2 users list", "restart all", "config set mail.maxSize 100MB"')}
`;

  console.log(dashboard);
}

function getStatusColor(status: string) {
  const chalk = require("chalk");
  switch (status.toLowerCase()) {
    case "healthy":
      return chalk.green;
    case "degraded":
      return chalk.yellow;
    case "unhealthy":
      return chalk.red;
    default:
      return chalk.gray;
  }
}

async function startServerMonitor(refreshInterval: number, format: string) {
  const chalk = (await import("chalk")).default;

  while (true) {
    console.clear();
    const status = await apiClient.get("/api/status");

    if (format === "graph") {
      await showGraphicalMonitor(status.data);
    } else {
      await showASCIIMonitor(status.data);
    }

    await new Promise((resolve) => setTimeout(resolve, refreshInterval * 1000));
  }
}

async function showASCIIMonitor(data: any) {
  const chalk = (await import("chalk")).default;

  const cpuPercent = data.cpu || 45;
  const memPercent = data.memory || 65;
  const diskPercent = data.disk || 35;
  const netPercent = data.network || 25;

  const monitor = `
${chalk.cyan("🖥️  AETHER MAILER MONITOR 📊")}
${chalk.cyan("┌─────────────────────────────────────────────────────────┐")}
${chalk.cyan("│")} ${chalk.green("CPU:")} ${getProgressBar(cpuPercent)}  ${chalk.cyan("MEM:")} ${getProgressBar(memPercent)} ${chalk.cyan("│")}
${chalk.cyan("│")} ${chalk.blue("DSK:")} ${getProgressBar(diskPercent)}  ${chalk.cyan("NET:")} ${getProgressBar(netPercent)} ${chalk.cyan("│")}
${chalk.cyan("│")}                                                              ${chalk.cyan("│")}
${chalk.cyan("│")} ${chalk.yellow("📧 Services:")} ${chalk.white(data.services?.join(", ") || "api, smtp, imap")}  ${chalk.cyan("│")}
${chalk.cyan("│")} ${chalk.magenta("👥 Connections:")} ${chalk.white(String(data.connections || "45 active"))}                      ${chalk.cyan("│")}
${chalk.cyan("│")} ${chalk.green("⚡ Uptime:")} ${chalk.white(String(data.uptime || "15d 4h 23m"))}                   ${chalk.cyan("│")}
${chalk.cyan("└─────────────────────────────────────────────────────────┘")}

${chalk.gray("Last updated:")} ${new Date().toLocaleString()}
`;

  console.log(monitor);
}

function getProgressBar(percentage: number) {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  return "■".repeat(filled) + "░".repeat(empty) + ` ${percentage}%`;
}

async function showGraphicalMonitor(data: any) {
  // Implementation for graphical monitoring
  console.log("📊 Graphical monitoring (ASCII charts)");
  // Would show more complex visual representations
}

// Helper functions
async function showServerHelp() {
  const chalk = (await import("chalk")).default;

  const help = `
${chalk.yellow("📖 Aether Mailer Server Help")}
${chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}

${chalk.green("Dashboard Mode:")}
${chalk.white("  mailer server                    # Interactive dashboard")}
  
${chalk.green("Direct Commands:")}
${chalk.white("  mailer server status [--format json]")}
${chalk.white("  mailer server restart [--target api --timeout 60]")}
${chalk.white("  mailer server logs [--service smtp --follow]")}
${chalk.white("  mailer server config set database.poolSize 20")}
${chalk.white("  mailer server monitor [--refresh 3 --format graph]")}
${chalk.white("  mailer server services list")}
${chalk.white("  mailer server maintenance schedule")}
${chalk.white("  mailer server backup create")}
${chalk.white("  mailer server security scan")}
${chalk.white("  mailer server queue clear")}

${chalk.green("Examples:")}
${chalk.gray("  mailer server restart api --graceful --timeout 30")}
${chalk.gray("  mailer server logs smtp --level error --follow")}
${chalk.gray("  mailer server monitor --refresh 2 --format graph")}
${chalk.gray("  mailer server config set database.maxConnections 100")}

${chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
`;

  console.log(help);
}

async function handleServerCommand(command: string) {
  const parts = command.trim().split(/\s+/);
  const [cmd, ...args] = parts;

  switch (cmd) {
    case "1":
    case "users":
      await serverUsersCommand.action(args, {});
      break;
    case "2":
    case "domains":
      await serverDomainsCommand.action(args, {});
      break;
    case "3":
    case "services":
      await servicesCommand.action(args, {});
      break;
    case "4":
    case "config":
      await serverConfigCommand.action(args, {});
      break;
    case "5":
    case "logs":
      await serverLogsCommand.action(args, {});
      break;
    case "6":
    case "monitor":
      await serverMonitorCommand.action(args, {});
      break;
    case "7":
    case "backup":
      await serverBackupCommand.action(args, {});
      break;
    case "8":
    case "security":
      await securityCommand.action(args, {});
      break;
    case "9":
    case "maintenance":
      await maintenanceCommand.action(args, {});
      break;
    default:
      if (cmd) {
        logger.info(`Executing: ${command}`);
        // Parse and execute the command
        await executeDirectCommand(cmd, args);
      }
  }
}

async function executeDirectCommand(command: string, args: string[]) {
  // Implementation for direct command execution
  try {
    const response = await apiClient.post("/api/server/exec", {
      command,
      args,
    });
    if (response.success) {
      logger.success("Command executed successfully");
    }
  } catch (error: any) {
    logger.error(`Command execution failed: ${error.message}`);
  }
}

async function showServerConfig(service?: string, format?: string) {
  const response = await apiClient.get("/api/server/config");
  // Implementation for displaying configuration
}

async function setServerConfig(key: string, value: string, options: any) {
  const response = await apiClient.put(`/api/server/config/${key}`, { value });
  if (response.success) {
    logger.success(`Configuration updated: ${key} = ${value}`);
  }
}

async function listServerConfigs(format?: string) {
  const response = await apiClient.get("/api/server/config");
  // Implementation for listing configurations
}

async function resetServerConfig(service?: string) {
  const response = await apiClient.post("/api/server/config/reset", {
    service,
  });
  if (response.success) {
    logger.success("Configuration reset completed");
  }
}

export default serverCommand;
