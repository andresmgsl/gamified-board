import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'pg-dock',
  template: `
    <!-- modal content -->
    <div class="z-50 w-full relative">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class DockComponent {
  @HostBinding('class') class = 'p-10 pb-5 bp-skin-moba-dock-center relative';
}
