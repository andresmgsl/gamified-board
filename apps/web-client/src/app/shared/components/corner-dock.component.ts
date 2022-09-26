import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostBinding,
  inject,
  Input,
  Renderer2,
} from '@angular/core';
import { isNotNull, Option } from '../utils';

export type DockDirection = 'right' | 'left';

@Component({
  selector: 'pg-corner-dock',
  template: `
    <!-- modal content -->
    <ng-content></ng-content>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class CornerDockComponent {
  private readonly _elementRef = inject(ElementRef);
  private readonly _renderer2 = inject(Renderer2);

  @HostBinding('class') class = 'block bp-skin-moba-dock-corner relative';

  direction: DockDirection = 'right';
  oppositeDirection: DockDirection = 'left';

  @Input() set pgDirection(value: Option<DockDirection>) {
    if (isNotNull(value)) {
      this._setDirection(value);
    }
  }

  private _setDirection(direction: DockDirection) {
    this.direction = direction;
    this.oppositeDirection = direction === 'left' ? 'right' : 'left';

    if (direction === 'left') {
      this._renderer2.addClass(this._elementRef.nativeElement, 'bg-right-top');
    } else {
      this._renderer2.addClass(this._elementRef.nativeElement, 'bg-left-top');
    }
  }
}
