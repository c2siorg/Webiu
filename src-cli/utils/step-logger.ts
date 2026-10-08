import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class StepLogger {
  private totalSteps: number;
  private currentStep: number = 0;
  private currentSpinner: Ora | null = null;

  constructor(totalSteps: number) {
    this.totalSteps = totalSteps;
  }

  /**
   * Starts a new aesthetic step with spinner and badge formatting.
   * e.g., [1/8] Cloning template source code...
   */
  startStep(title: string, detail?: string): Ora {
    this.currentStep++;
    const stepBadge = chalk.bgHex('#7B8CFF').black.bold(` ${this.currentStep}/${this.totalSteps} `);
    const stepTitle = chalk.bold.white(title);
    const detailText = detail ? chalk.gray(` (${detail})`) : '';

    const text = `${stepBadge} ${stepTitle}${detailText}`;

    if (this.currentSpinner) {
      this.currentSpinner.stop();
    }

    this.currentSpinner = ora({
      text,
      color: 'cyan',
      spinner: 'dots',
    }).start();

    return this.currentSpinner;
  }

  /**
   * Completes the current active step with a green checkmark.
   */
  succeedStep(message?: string): void {
    if (this.currentSpinner) {
      const stepBadge = chalk.bgHex('#10B981').black.bold(` ${this.currentStep}/${this.totalSteps} `);
      const text = message
        ? `${stepBadge} ${chalk.bold.green(message)}`
        : this.currentSpinner.text.replace(/^[^\s]+\s*/, `${stepBadge} `);

      this.currentSpinner.succeed(text);
      this.currentSpinner = null;
    }
  }

  /**
   * Marks the current active step as failed with a red cross.
   */
  failStep(message?: string): void {
    if (this.currentSpinner) {
      const stepBadge = chalk.bgHex('#EF4444').white.bold(` ${this.currentStep}/${this.totalSteps} `);
      const text = message
        ? `${stepBadge} ${chalk.bold.red(message)}`
        : this.currentSpinner.text.replace(/^[^\s]+\s*/, `${stepBadge} `);

      this.currentSpinner.fail(text);
      this.currentSpinner = null;
    }
  }

  /**
   * Updates sub-text on the active spinner.
   */
  updateText(text: string): void {
    if (this.currentSpinner) {
      const stepBadge = chalk.bgHex('#7B8CFF').black.bold(` ${this.currentStep}/${this.totalSteps} `);
      this.currentSpinner.text = `${stepBadge} ${chalk.bold.cyan(text)}`;
    }
  }
}
