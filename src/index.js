#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { installCommand } from './commands/install.js';
import { uninstallCommand } from './commands/uninstall.js';

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
  .option('--backend <url>', 'URL do backend (padrão: env BACKEND_URL ou http://localhost:3000)')
  .option('--service', 'Instala como serviço em vez de rodar em primeiro plano', false)
  .action(installCommand);

program
  .command('uninstall <repo>')
  .description('Remove o runner do GitHub e limpa os arquivos locais')
  .option('--backend <url>', 'URL do backend (padrão: env BACKEND_URL ou http://localhost:3000)')
  .action(uninstallCommand);

program.parse();
