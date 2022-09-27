import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Output } from '@angular/core';

@Component({
  selector: 'pg-modal',
  template: `
    <!-- close button -->
    <button
      class="bp-skin-moba-button-close outline-0 absolute right-3 top-3 z-40"
      (click)="onClose()"
    ></button>

    <!-- modal content -->
    <div class="z-30 w-full relative">
      <ng-content></ng-content>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class ModalComponent {
  @HostBinding('class') class =
    'flex bp-skin-moba-modal shadow-xl relative px-12 pt-14';

  @Output() pgCloseModal = new EventEmitter();

  onClose() {
    this.pgCloseModal.emit();
  }
}
