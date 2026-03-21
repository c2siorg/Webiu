import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface DetectedTechnology {
  name: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface TechStackResult {
  org: string;
  repo: string;
  technologies: DetectedTechnology[];
  detectedAt: string;
  pushedAt: string;
}

const TECH_PATTERNS: Record<string, Record<string, string[]>> = {
  'package.json': {
    React: ['react', 'react-dom'],
    Angular: ['@angular/core'],
    Vue: ['vue'],
    Next: ['next'],
    NestJS: ['@nestjs/core'],
    Express: ['express'],
    TypeScript: ['typescript'],
    TailwindCSS: ['tailwindcss'],
    GraphQL: ['graphql', '@apollo/client'],
    Jest: ['jest'],
  },
  'requirements.txt': {
    Django: ['django'],
    Flask: ['flask'],
    FastAPI: ['fastapi'],
    Pandas: ['pandas'],
    TensorFlow: ['tensorflow'],
    PyTorch: ['torch'],
    NumPy: ['numpy'],
    SQLAlchemy: ['sqlalchemy'],
    Celery: ['celery'],
    Pytest: ['pytest'],
  },
};

const MANIFEST_FILES = [
  'package.json',
  'requirements.txt',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'Cargo.toml',
  'Gemfile',
  'composer.json',
  'Dockerfile',
  'docker-compose.yml',
];

const LANGUAGE_MAP: Record<string, string> = {
  'go.mod': 'Go',
  'pom.xml': 'Java',
  'build.gradle': 'Java',
  'Cargo.toml': 'Rust',
  Gemfile: 'Ruby',
  'composer.json': 'PHP',
  Dockerfile: 'Docker',
  'docker-compose.yml': 'Docker Compose',
};

@Injectable()
export class TechStackDetectorService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly logger = new Logger(TechStackDetectorService.name);

  private getHeaders(token: string) {
    return {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }

  async detectTechStack(
    org: string,
    repo: string,
    pushedAt: string,
    token: string,
  ): Promise<TechStackResult> {
    const technologies: DetectedTechnology[] = [];

    // Step 1: Get root file tree
    let rootContents: any[] = [];
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${org}/${repo}/contents`,
        { headers: this.getHeaders(token) },
      );
      rootContents = response.data;
    } catch (err) {
      this.logger.warn(
        `Failed to fetch contents for ${org}/${repo}: ${err?.response?.status ?? err.message}`,
      );
      return {
        org,
        repo,
        technologies: [],
        detectedAt: new Date().toISOString(),
        pushedAt,
      };
    }

    const fileNames = rootContents
      .filter((f) => f.type === 'file')
      .map((f) => f.name);

    // Step 2: Detect from manifest file presence
    for (const file of MANIFEST_FILES) {
      if (fileNames.includes(file) && LANGUAGE_MAP[file]) {
        technologies.push({
          name: LANGUAGE_MAP[file],
          confidence: 'medium',
          source: file,
        });
      }
    }

    // Step 3: Analyze package.json
    if (fileNames.includes('package.json')) {
      try {
        const pkgFile = rootContents.find((f) => f.name === 'package.json');
        const pkgResponse = await axios.get(pkgFile.download_url);
        const pkg = pkgResponse.data;
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        };

        for (const [tech, patterns] of Object.entries(
          TECH_PATTERNS['package.json'],
        )) {
          if (patterns.some((p) => allDeps[p])) {
            technologies.push({
              name: tech,
              confidence: 'high',
              source: 'package.json',
            });
          }
        }

        if (!technologies.find((t) => t.name === 'Node.js')) {
          technologies.push({
            name: 'Node.js',
            confidence: 'high',
            source: 'package.json',
          });
        }
      } catch (err) {
        this.logger.warn(
          `Failed to parse package.json for ${org}/${repo}: ${err.message}`,
        );
      }
    }

    // Step 4: Analyze requirements.txt
    if (fileNames.includes('requirements.txt')) {
      try {
        const reqFile = rootContents.find((f) => f.name === 'requirements.txt');
        const reqResponse = await axios.get(reqFile.download_url);
        const content: string = reqResponse.data;
        const lines = content.toLowerCase().split('\n');

        for (const [tech, patterns] of Object.entries(
          TECH_PATTERNS['requirements.txt'],
        )) {
          if (patterns.some((p) => lines.some((l) => l.startsWith(p)))) {
            technologies.push({
              name: tech,
              confidence: 'high',
              source: 'requirements.txt',
            });
          }
        }

        if (!technologies.find((t) => t.name === 'Python')) {
          technologies.push({
            name: 'Python',
            confidence: 'high',
            source: 'requirements.txt',
          });
        }
      } catch (err) {
        this.logger.warn(
          `Failed to parse requirements.txt for ${org}/${repo}: ${err.message}`,
        );
      }
    }

    // Step 5: Detect Go
    if (fileNames.includes('go.mod')) {
      if (!technologies.find((t) => t.name === 'Go')) {
        technologies.push({
          name: 'Go',
          confidence: 'high',
          source: 'go.mod',
        });
      }
    }

    // Step 6: Deduplicate
    const seen = new Set<string>();
    const unique = technologies.filter((t) => {
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      return true;
    });

    return {
      org,
      repo,
      technologies: unique,
      detectedAt: new Date().toISOString(),
      pushedAt,
    };
  }
}
