import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { isNotNull, Option } from '../utils';

export type InventoryDirection = 'left' | 'right';

@Component({
  selector: 'pg-inventory',
  template: `
    <!-- section content -->
    <header class="relative h-[60px]">
      <div
        class="flex relative w-full items-center justify-between pl-6 pt-4 mr-1.5 text-white uppercase"
      >
        <ng-content select="[pgInventoryTitle]"></ng-content>

        <div class="z-50">
          <ng-content select="[pgInventoryCreateButton]"></ng-content>
        </div>
      </div>
    </header>

    <div class="bp-skin-moba-divider"></div>

    <section
      class="max-w-[280px] p-4 flex flex-col gap-2 flex-1 self-center z-50 pb-8"
    >
      <div class="flex-1">
        <ng-content select="[pgInventoryBody]"></ng-content>
      </div>

      <div class="flex justify-center gap-6 relative top-3">
        <button
          class="bp-skin-moba-navigation-left-arrow"
          (click)="onPreviousPage()"
          [disabled]="pgPage === 1"
        ></button>
        <button
          class="bp-skin-moba-navigation-right-arrow"
          (click)="onNextPage()"
          [disabled]="pgPageSize * pgPage >= pgTotal"
        ></button>
      </div>
    </section>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class InventoryComponent {
  @HostBinding('class') class =
    'flex flex-col relative z-40 bp-skin-moba-sidebar';

  @Input() pgPageSize = 24;
  @Input() pgPage = 1;
  @Input() pgTotal = 0;
  @Output() pgSetPage = new EventEmitter<number>();

  direction: InventoryDirection = 'right';
  oppositeDirection: InventoryDirection = 'left';

  @Input() set pgDirection(value: Option<InventoryDirection>) {
    if (isNotNull(value)) {
      this._setDirection(value);
    }
  }

  private _setDirection(direction: InventoryDirection) {
    this.direction = direction;
    this.oppositeDirection = direction === 'left' ? 'right' : 'left';
  }

  onPreviousPage() {
    this.pgSetPage.emit(this.pgPage - 1);
  }

  onNextPage() {
    this.pgSetPage.emit(this.pgPage + 1);
  }
}
