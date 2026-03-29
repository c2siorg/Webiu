import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import {
  AnalyzerPersistedState,
  AnalyzerReport,
  AnalyzerSyncRun,
} from './types';

const DEFAULT_STORE_PATH = '.analyzer/reports.json';

@Injectable()
export class AnalyzerStoreService {
  private readonly logger = new Logger(AnalyzerStoreService.name);
  private readonly storePath: string;
  private state: AnalyzerPersistedState;

  constructor(private configService: ConfigService) {
    const configured =
      this.configService.get<string>('ANALYZER_STORE_PATH') || DEFAULT_STORE_PATH;
    this.storePath = resolve(process.cwd(), configured);
    this.state = this.loadState();
  }

  getReports(): AnalyzerReport[] {
    return this.state.reports;
  }

  getReport(owner: string, repo: string): AnalyzerReport | undefined {
    return this.state.reports.find(
      (report) => report.owner === owner && report.repo === repo,
    );
  }

  saveReport(report: AnalyzerReport): void {
    const index = this.state.reports.findIndex(
      (existing) =>
        existing.owner === report.owner && existing.repo === report.repo,
    );

    if (index >= 0) {
      this.state.reports[index] = report;
    } else {
      this.state.reports.push(report);
    }

    this.persist();
  }

  setRepoCursor(fullName: string, isoTimestamp: string): void {
    this.state.repoSyncCursor[fullName] = isoTimestamp;
    this.persist();
  }

  getRepoCursor(fullName: string): string | undefined {
    return this.state.repoSyncCursor[fullName];
  }

  getSyncHistory(limit = 20): AnalyzerSyncRun[] {
    return this.state.syncHistory.slice(-limit).reverse();
  }

  createSyncRun(total: number): AnalyzerSyncRun {
    const syncRun: AnalyzerSyncRun = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      startedAt: new Date().toISOString(),
      status: 'running',
      repositoriesTotal: total,
      repositoriesSucceeded: 0,
      repositoriesFailed: 0,
      errors: [],
    };

    this.state.syncHistory.push(syncRun);
    this.persist();
    return syncRun;
  }

  updateSyncRun(syncRun: AnalyzerSyncRun): void {
    const index = this.state.syncHistory.findIndex((run) => run.id === syncRun.id);
    if (index >= 0) {
      this.state.syncHistory[index] = syncRun;
      this.persist();
    }
  }

  private loadState(): AnalyzerPersistedState {
    try {
      if (!existsSync(this.storePath)) {
        mkdirSync(dirname(this.storePath), { recursive: true });
        const initialState: AnalyzerPersistedState = {
          reports: [],
          syncHistory: [],
          repoSyncCursor: {},
        };
        writeFileSync(this.storePath, JSON.stringify(initialState, null, 2));
        return initialState;
      }

      const raw = readFileSync(this.storePath, 'utf-8');
      const parsed = JSON.parse(raw) as AnalyzerPersistedState;

      return {
        reports: parsed.reports || [],
        syncHistory: parsed.syncHistory || [],
        repoSyncCursor: parsed.repoSyncCursor || {},
      };
    } catch (error) {
      this.logger.error(`Failed to read analyzer store at ${this.storePath}`);
      this.logger.error(error?.message || String(error));
      return {
        reports: [],
        syncHistory: [],
        repoSyncCursor: {},
      };
    }
  }

  private persist(): void {
    try {
      mkdirSync(dirname(this.storePath), { recursive: true });
      writeFileSync(this.storePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      this.logger.error(`Failed to persist analyzer store at ${this.storePath}`);
      this.logger.error(error?.message || String(error));
    }
  }
}
