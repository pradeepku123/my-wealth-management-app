import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="stat-card h-100">
      <div class="stat-top">
        <div class="stat-icon-wrap" [ngClass]="iconBgClass">
          <i [class]="'bi ' + icon + ' ' + iconColorClass"></i>
        </div>
        <h6 class="stat-label">{{ title }}</h6>
      </div>
      <div class="stat-value">{{ value }}</div>

      @if (trend !== undefined && trend !== null) {
        <div class="stat-trend" [class.up]="trend >= 0" [class.down]="trend < 0">
          <i [class]="trend >= 0 ? 'bi bi-arrow-up-right' : 'bi bi-arrow-down-right'"></i>
          <span>{{ trend | number:'1.2-2' }}%</span>
          <span class="trend-label">total return</span>
        </div>
      }

      @if (subtitle) {
        <p class="stat-subtitle">{{ subtitle }}</p>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      padding: 1.4rem;
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      transition: var(--transition-base);
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: -30px; right: -20px;
        width: 120px; height: 120px;
        border-radius: 50%;
        background: var(--primary-color);
        opacity: 0.04;
        pointer-events: none;
      }

      &:hover {
        border-color: var(--border-highlight);
        transform: translateY(-2px);
        box-shadow: var(--shadow-glow);
      }
    }

    .stat-top {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .stat-icon-wrap {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;

      i { font-size: 1.1rem; }
    }

    .stat-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin: 0;
    }

    .stat-value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.65rem;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.03em;
      line-height: 1;
      margin-bottom: 0.75rem;
    }

    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 99px;

      &.up {
        background: var(--success-bg);
        color: var(--accent-color);
      }
      &.down {
        background: var(--danger-bg);
        color: var(--danger-color);
      }

      .trend-label {
        color: var(--text-muted);
        font-weight: 400;
        margin-left: 0.15rem;
      }
    }

    .stat-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0.5rem 0 0;
    }
  `]
})
export class StatCardComponent {
    @Input() title: string = '';
    @Input() value: string = '';
    @Input() icon: string = 'bi-graph-up';
    @Input() iconBgClass: string = 'bg-primary-subtle';
    @Input() iconColorClass: string = 'text-primary';
    @Input() trend?: number;
    @Input() subtitle?: string;
}
