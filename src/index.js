#!/usr/bin/env node
import { Command } from 'commander';
import { installCommand } from './commands/install.js';

const program = new Command();

program
  .name('meu-runner')
  .description('CLI para instalação automatizada de GitHub Actions self-hosted runner')
  .version('1.0.0');

program
  .command('install <repo>')
  .description('Instala e configura um GitHub Actions self-hosted runner')
  .option('--name <name>', 'Nome do runner', `runner-${Date.now()}`)
  .option('--workdir <path>', 'Diretório de trabalho', '_work')
  .option('--backend <url>', 'URL do backend', 'http://localhost:3000')
  .action(installCommand);

program.parse();
