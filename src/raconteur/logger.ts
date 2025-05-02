import chalk from 'chalk';

export class Logger {
  static info(message: string): void {
    console.log(chalk.blue(message));
  }

  static success(message: string): void {
    console.log(chalk.green(`✅ ${message}`));
  }

  static warning(message: string): void {
    console.log(chalk.yellow(`⚠️ ${message}`));
  }

  static error(message: string, error?: Error): void {
    console.error(chalk.red(`❌ ${message}`));
    if (error?.stack) {
      console.error(chalk.red(error.stack));
    }
  }

  static progress(message: string): void {
    console.log(chalk.cyan(`🔄 ${message}`));
  }
}