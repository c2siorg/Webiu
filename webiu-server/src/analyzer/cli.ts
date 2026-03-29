import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { AppModule } from '../app.module';
import { AnalyzerService } from './analyzer.service';

interface CliArgs {
  repos: string[];
  outputPath: string;
  forceRefresh: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const repos: string[] = [];
  let outputPath = 'docs/examples/analyzer-report.json';
  let forceRefresh = true;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--repos') {
      const value = argv[i + 1] || '';
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((repo) => repos.push(repo));
      i += 1;
      continue;
    }

    if (arg === '--output') {
      outputPath = argv[i + 1] || outputPath;
      i += 1;
      continue;
    }

    if (arg === '--no-force-refresh') {
      forceRefresh = false;
      continue;
    }
  }

  return { repos, outputPath, forceRefresh };
}

async function run(): Promise<void> {
  const { repos, outputPath, forceRefresh } = parseArgs(process.argv.slice(2));
  if (repos.length === 0) {
    throw new Error(
      'No repositories provided. Use --repos with comma-separated GitHub URLs.',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const analyzerService = app.get(AnalyzerService);
    const result = await analyzerService.analyzeRepositories(repos, {
      forceRefresh,
      persist: true,
    });

    const resolvedPath = resolve(process.cwd(), outputPath);
    mkdirSync(dirname(resolvedPath), { recursive: true });
    writeFileSync(resolvedPath, JSON.stringify(result, null, 2));

    console.log(`Analyzer report saved to ${resolvedPath}`);
    console.log(`Reports generated: ${result.reports.length}`);
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error?.message || String(error));
  process.exit(1);
});
