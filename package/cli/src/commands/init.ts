import { Command } from '../types/commands.js';
import configManager from '../utils/config.js';
import logger from '../utils/logger.js';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

export const initCommand: Command = {
  name: 'init',
  description: 'Initialize Aether Mailer CLI in the current project',
  usage: 'mailer init [options]',
  options: [
    { name: 'force', alias: 'f', description: 'Force re-initialization' },
  ],
  async action(args, options) {
    try {
      const projectRoot = configManager.getProjectRoot();
      const configDir = configManager.getProjectConfigDir();

      logger.info(`Initializing Aether Mailer CLI in: ${projectRoot}`);

      if (existsSync(configDir) && !options.force && !options.f) {
        logger.warn('Project already initialized. Use --force to re-initialize.');
        return;
      }

      configManager.initProjectConfig();

      const gitignorePath = join(projectRoot, '.gitignore');
      if (existsSync(gitignorePath)) {
        const gitignoreContent = require('fs').readFileSync(gitignorePath, 'utf-8');
        if (!gitignoreContent.includes('.mailer')) {
          writeFileSync(gitignorePath, gitignoreContent + '\n# Aether Mailer CLI\n.mailer/\n');
          logger.info('Added .mailer/ to .gitignore');
        }
      }

      logger.success('✓ Project initialized successfully!');
      logger.log('\nConfiguration directory created at:');
      logger.log(`  ${configDir}`);
      logger.log('\nYou can now use the CLI commands:');
      logger.log('  mailer status');
      logger.log('  mailer users list');
      logger.log('  mailer config get');
      logger.log('\nTo configure the server URL:');
      logger.log('  mailer config set server.url http://localhost:8080');
    } catch (error: any) {
      logger.error(error.message);
      process.exit(1);
    }
  },
};

export default initCommand;
