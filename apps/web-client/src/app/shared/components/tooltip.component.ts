import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { Position } from '../utils';

@Component({
  selector: 'pg-tooltip',
  template: `
    <!-- modal content -->
    <div class="z-20 relative">
      <header
        class="p-2 bg-white bg-opacity-10 bp-skin-tooltip-header bp-font-game-title"
      >
        <ng-content select="[pgTooltipHeader]"></ng-content>
      </header>

      <section>
        <ng-content select="[pgTooltipContent]"></ng-content>
      </section>

      <footer>
        <ng-content select="[pgTooltipFooter]"></ng-content>
      </footer>

      <div
        *ngIf="pgPosition === 'right'"
        class="absolute -left-4 -translate-y-1/2 top-1/2  w-4 h-4 -rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#121212">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'left'"
        class="absolute -right-4 -translate-y-1/2 top-1/2  w-4 h-4 rotate-90"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#121212">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'top'"
        class="absolute -bottom-4 -translate-x-1/2 left-1/2  w-4 h-4 rotate-180"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#121212">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>

      <div
        *ngIf="pgPosition === 'bottom'"
        class="absolute -top-4 -translate-x-1/2 left-1/2  w-4 h-4 rotate"
      >
        <svg id="triangle" viewBox="0 0 100 100" fill="#121212">
          <polygon points="50 15, 100 100, 0 100" />
        </svg>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
  exportAs: 'tooltip',
})
export class TooltipComponent {
  @HostBinding('class') class = 'bp-skin-tooltip-bg block text-white';
  @Input() pgPosition: Position = 'left';
}
