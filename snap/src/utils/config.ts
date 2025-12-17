import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";
import { MailerConfig, DEFAULT_CONFIG } from "../types/config.js";

function findProjectRoot(): string {
  let currentDir = process.cwd();
  const root = resolve("/");

  while (currentDir !== root) {
    if (existsSync(join(currentDir, "package.json"))) {
      return currentDir;
    }
    currentDir = resolve(currentDir, "..");
  }

  return process.cwd();
}

const PROJECT_ROOT = findProjectRoot();
const PROJECT_CONFIG_DIR = join(PROJECT_ROOT, ".mailer");
const PROJECT_CONFIG_FILE = join(PROJECT_CONFIG_DIR, "config.json");
const GLOBAL_CONFIG_DIR = join(homedir(), ".mailer");
const GLOBAL_CONFIG_FILE = join(GLOBAL_CONFIG_DIR, "config.json");
const LOCAL_CONFIG_FILE = ".mailer.local.json";

// Snap-specific paths
const SNAP_CONFIG_DIR = process.env.SNAP_DATA
  ? join(process.env.SNAP_DATA, ".mailer")
  : PROJECT_CONFIG_DIR;
const SNAP_CONFIG_FILE = join(SNAP_CONFIG_DIR, "config.json");

export class ConfigManager {
  private config: MailerConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): MailerConfig {
    let config = { ...DEFAULT_CONFIG };

    // In snap environment, prioritize snap config
    if (process.env.SNAP_DATA && existsSync(SNAP_CONFIG_FILE)) {
      try {
        const snapConfig = JSON.parse(readFileSync(SNAP_CONFIG_FILE, "utf-8"));
        config = this.mergeConfig(config, snapConfig);
      } catch (error) {
        console.warn("Failed to load snap config, using defaults");
      }
    }

    if (existsSync(GLOBAL_CONFIG_FILE)) {
      try {
        const fileConfig = JSON.parse(
          readFileSync(GLOBAL_CONFIG_FILE, "utf-8"),
        );
        config = this.mergeConfig(config, fileConfig);
      } catch (error) {
        console.warn("Failed to load global config, using defaults");
      }
    }

    if (existsSync(PROJECT_CONFIG_FILE)) {
      try {
        const projectConfig = JSON.parse(
          readFileSync(PROJECT_CONFIG_FILE, "utf-8"),
        );
        config = this.mergeConfig(config, projectConfig);
      } catch (error) {
        console.warn("Failed to load project config");
      }
    }

    if (existsSync(LOCAL_CONFIG_FILE)) {
      try {
        const localConfig = JSON.parse(
          readFileSync(LOCAL_CONFIG_FILE, "utf-8"),
        );
        config = this.mergeConfig(config, localConfig);
      } catch (error) {
        console.warn("Failed to load local config");
      }
    }

    const envConfig = this.loadFromEnv();
    config = this.mergeConfig(config, envConfig);

    return config;
  }

  private loadFromEnv(): Partial<MailerConfig> {
    const envConfig: any = {};

    if (process.env.MAILER_SERVER_URL) {
      envConfig.server = {
        ...envConfig.server,
        url: process.env.MAILER_SERVER_URL,
      };
    }
    if (process.env.MAILER_SERVER_TOKEN) {
      envConfig.server = {
        ...envConfig.server,
        token: process.env.MAILER_SERVER_TOKEN,
      };
    }
    if (process.env.MAILER_SERVER_TIMEOUT) {
      envConfig.server = {
        ...envConfig.server,
        timeout: parseInt(process.env.MAILER_SERVER_TIMEOUT),
      };
    }
    if (process.env.MAILER_DEFAULT_FORMAT) {
      envConfig.cli = {
        ...envConfig.cli,
        defaultFormat: process.env.MAILER_DEFAULT_FORMAT,
      };
    }
    if (process.env.MAILER_LOG_LEVEL) {
      envConfig.cli = {
        ...envConfig.cli,
        logLevel: process.env.MAILER_LOG_LEVEL,
      };
    }
    if (process.env.MAILER_COLORS) {
      envConfig.output = {
        ...envConfig.output,
        colors: process.env.MAILER_COLORS === "true",
      };
    }
    if (process.env.NO_COLOR) {
      envConfig.output = { ...envConfig.output, colors: false };
    }

    return envConfig;
  }

  private mergeConfig(base: any, override: any): any {
    const result = { ...base };
    for (const key in override) {
      if (typeof override[key] === "object" && !Array.isArray(override[key])) {
        result[key] = this.mergeConfig(base[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
    return result;
  }

  get(key?: string): any {
    if (!key) return this.config;

    const keys = key.split(".");
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  set(key: string, value: any): void {
    const keys = key.split(".");
    let current: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
    this.saveConfig();
  }

  saveConfig(useProjectConfig = true): void {
    try {
      const configDir = useProjectConfig
        ? PROJECT_CONFIG_DIR
        : GLOBAL_CONFIG_DIR;
      const configFile = useProjectConfig
        ? PROJECT_CONFIG_FILE
        : GLOBAL_CONFIG_FILE;

      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      writeFileSync(configFile, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  getProjectRoot(): string {
    return PROJECT_ROOT;
  }

  getProjectConfigDir(): string {
    return PROJECT_CONFIG_DIR;
  }

  initProjectConfig(): void {
    if (!existsSync(PROJECT_CONFIG_DIR)) {
      mkdirSync(PROJECT_CONFIG_DIR, { recursive: true });
    }
    if (!existsSync(PROJECT_CONFIG_FILE)) {
      writeFileSync(
        PROJECT_CONFIG_FILE,
        JSON.stringify(DEFAULT_CONFIG, null, 2),
      );
    }
  }

  getAll(): MailerConfig {
    return this.config;
  }
}

export const configManager = new ConfigManager();
export default configManager;
