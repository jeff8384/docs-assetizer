// ANSI color codes for terminal output
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';

const PREFIX = '[docs-assetizer]';

export const logger = {
  info(msg: string): void {
    console.log(`${CYAN}${PREFIX}${RESET} ${msg}`);
  },

  warn(msg: string): void {
    console.warn(`${YELLOW}${PREFIX} WARN${RESET} ${msg}`);
  },

  error(msg: string): void {
    console.error(`${RED}${PREFIX} ERROR${RESET} ${msg}`);
  },

  success(msg: string): void {
    console.log(`${GREEN}${PREFIX} OK${RESET} ${msg}`);
  },
};
