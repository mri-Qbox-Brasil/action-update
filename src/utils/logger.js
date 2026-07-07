const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

export function log(message) {
  console.log(`${colors.cyan}[meu-runner]${colors.reset} ${message}`);
}

export function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

export function warn(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

export function error(message) {
  console.error(`${colors.red}✗${colors.reset} ${message}`);
}

export function info(message) {
  console.log(`${colors.gray}ℹ${colors.reset} ${message}`);
}
