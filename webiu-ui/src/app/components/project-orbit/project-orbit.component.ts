import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../page/projects/project.model';

@Component({
  selector: 'app-project-orbit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="network-container">
      <svg viewBox="0 0 1000 340" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <!-- Define Glow Filters -->
        <defs>
          <filter id="glow-issues" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-forks" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-stars" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-lang" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Static Connection Path Underlays -->
        <path d="M 500 170 Q 350 110 200 80" class="connection-line" />
        <path d="M 500 170 Q 350 230 200 260" class="connection-line" />
        <path d="M 500 170 Q 650 110 800 80" class="connection-line" />
        <path d="M 500 170 Q 650 230 800 260" class="connection-line" />

        <!-- Animated Pulse Overlay Lines -->
        <path d="M 500 170 Q 350 110 200 80" class="pulse-line pulse-issues" />
        <path d="M 500 170 Q 350 230 200 260" class="pulse-line pulse-forks" />
        <path d="M 500 170 Q 650 110 800 80" class="pulse-line pulse-stars" />
        <path d="M 500 170 Q 650 230 800 260" class="pulse-line pulse-lang" />

        <!-- Center Node: Repository Core -->
        <foreignObject x="380" y="110" width="240" height="120">
          <div class="float-wrapper float-core">
            <div class="node-card core-card">
              <div class="core-icon">
                <i class="fab fa-github"></i>
              </div>
              <div class="core-info">
                <h4 class="project-title" [title]="projectName">{{ projectName }}</h4>
                <span class="core-tag">Repository Core</span>
              </div>
            </div>
          </div>
        </foreignObject>

        <!-- Node 1: Open Issues -->
        <foreignObject x="100" y="35" width="200" height="90">
          <div class="float-wrapper float-issues">
            <div class="node-card issues-card">
              <div class="card-icon">
                <i class="fas fa-exclamation-circle"></i>
              </div>
              <div class="card-stats">
                <span class="stat-value">{{ project?.open_issues_count ?? 0 }}</span>
                <span class="stat-label">Open Issues</span>
              </div>
            </div>
          </div>
        </foreignObject>

        <!-- Node 2: Forks -->
        <foreignObject x="100" y="215" width="200" height="90">
          <div class="float-wrapper float-forks">
            <div class="node-card forks-card">
              <div class="card-icon">
                <i class="fas fa-code-branch"></i>
              </div>
              <div class="card-stats">
                <span class="stat-value">{{ project?.forks_count ?? 0 }}</span>
                <span class="stat-label">Forks</span>
              </div>
            </div>
          </div>
        </foreignObject>

        <!-- Node 3: Stars -->
        <foreignObject x="700" y="35" width="200" height="90">
          <div class="float-wrapper float-stars">
            <div class="node-card stars-card">
              <div class="card-icon">
                <i class="fas fa-star"></i>
              </div>
              <div class="card-stats">
                <span class="stat-value">{{ project?.stargazers_count ?? 0 }}</span>
                <span class="stat-label">Stars</span>
              </div>
            </div>
          </div>
        </foreignObject>

        <!-- Node 4: Primary Language -->
        <foreignObject x="700" y="215" width="200" height="90">
          <div class="float-wrapper float-lang">
            <div class="node-card lang-card">
              <div class="card-icon">
                <i class="fas fa-code"></i>
              </div>
              <div class="card-stats">
                <span class="stat-value">{{ project?.language || 'N/A' }}</span>
                <span class="stat-label">Language</span>
              </div>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 340px;
        position: relative;
        overflow: hidden;
        border-radius: var(--radius-lg);
        background: radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.75) 100%),
                    linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px) 0 0 / 20px 20px,
                    linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px) 0 0 / 20px 20px;
        border: 1px solid var(--border);
        box-sizing: border-box;
      }

      .network-container {
        width: 100%;
        height: 100%;
        padding: 10px;
        box-sizing: border-box;
      }

      svg {
        display: block;
        overflow: visible;
      }

      /* Connection lines */
      .connection-line {
        stroke: rgba(255, 255, 255, 0.06);
        stroke-width: 2;
        fill: none;
      }

      /* Pulse animations traveling along curves */
      .pulse-line {
        stroke-width: 2.5;
        fill: none;
        stroke-dasharray: 8 60;
        animation: pulse-flow 4s linear infinite;
      }

      .pulse-issues {
        stroke: #ff6b6b;
        filter: url(#glow-issues);
        animation-duration: 3.5s;
      }

      .pulse-forks {
        stroke: #ffbe0b;
        filter: url(#glow-forks);
        animation-duration: 4.5s;
        animation-delay: 0.5s;
      }

      .pulse-stars {
        stroke: #ffd166;
        filter: url(#glow-stars);
        animation-duration: 4s;
        animation-delay: 1s;
      }

      .pulse-lang {
        stroke: #06d6a0;
        filter: url(#glow-lang);
        animation-duration: 5s;
        animation-delay: 1.5s;
      }

      @keyframes pulse-flow {
        from {
          stroke-dashoffset: 0;
        }
        to {
          stroke-dashoffset: -136;
        }
      }

      /* Floating animations for the wrappers */
      .float-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .float-core {
        animation: float-core-anim 7s ease-in-out infinite;
      }

      .float-issues {
        animation: float-node-anim 6s ease-in-out infinite;
      }

      .float-forks {
        animation: float-node-anim 6.5s ease-in-out infinite 0.7s;
      }

      .float-stars {
        animation: float-node-anim 7.2s ease-in-out infinite 0.3s;
      }

      .float-lang {
        animation: float-node-anim 5.8s ease-in-out infinite 1.1s;
      }

      @keyframes float-core-anim {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
        }
        50% {
          transform: translateY(-3px) rotate(0.5deg);
        }
      }

      @keyframes float-node-anim {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-5px);
        }
      }

      /* HTML elements inside SVG foreignObject */
      .node-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 18px;
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: #f8fafc;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        height: calc(100% - 2px);
        width: calc(100% - 2px);
        box-sizing: border-box;
        cursor: default;
      }

      .node-card:hover {
        transform: scale(1.04) translateY(-2px);
        background: rgba(30, 41, 59, 0.6);
        border-color: rgba(255, 255, 255, 0.16);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
      }

      /* Core Node styling */
      .core-card {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%);
        border-color: rgba(99, 102, 241, 0.3);
        box-shadow: 0 4px 25px rgba(99, 102, 241, 0.12);
        justify-content: center;
        text-align: center;
        gap: 16px;
      }

      .core-card:hover {
        border-color: rgba(99, 102, 241, 0.5);
        box-shadow: 0 8px 35px rgba(99, 102, 241, 0.25);
      }

      .core-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: #818cf8;
        filter: drop-shadow(0 0 8px rgba(129, 140, 248, 0.4));
      }

      .core-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        overflow: hidden;
      }

      .project-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #ffffff;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 140px;
      }

      .core-tag {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        font-weight: 500;
      }

      /* Metric card icons and themes */
      .card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 8px;
        font-size: 18px;
        flex-shrink: 0;
        transition: transform 0.3s ease;
      }

      .node-card:hover .card-icon {
        transform: scale(1.1);
      }

      .card-stats {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        line-height: 1.1;
        color: #ffffff;
      }

      .stat-label {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 500;
        white-space: nowrap;
      }

      /* Node-specific colors */
      .issues-card {
        border-left: 3px solid #ff6b6b;
      }
      .issues-card .card-icon {
        background: rgba(255, 107, 107, 0.12);
        color: #ff6b6b;
      }
      .issues-card:hover {
        box-shadow: 0 8px 30px rgba(255, 107, 107, 0.15);
      }

      .forks-card {
        border-left: 3px solid #ffbe0b;
      }
      .forks-card .card-icon {
        background: rgba(255, 190, 11, 0.12);
        color: #ffbe0b;
      }
      .forks-card:hover {
        box-shadow: 0 8px 30px rgba(255, 190, 11, 0.15);
      }

      .stars-card {
        border-left: 3px solid #ffd166;
      }
      .stars-card .card-icon {
        background: rgba(255, 209, 102, 0.12);
        color: #ffd166;
      }
      .stars-card:hover {
        box-shadow: 0 8px 30px rgba(255, 209, 102, 0.15);
      }

      .lang-card {
        border-left: 3px solid #06d6a0;
      }
      .lang-card .card-icon {
        background: rgba(6, 214, 160, 0.12);
        color: #06d6a0;
      }
      .lang-card:hover {
        box-shadow: 0 8px 30px rgba(6, 214, 160, 0.15);
      }
    `,
  ],
})
export class ProjectOrbitComponent {
  @Input() projectName = 'Repository';
  @Input() project?: Project;
}
