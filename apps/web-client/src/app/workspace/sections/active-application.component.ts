import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { PushModule } from '@ngrx/component';
import { ComponentStore } from '@ngrx/component-store';
import {
  concatMap,
  EMPTY,
  exhaustMap,
  of,
  Subject,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ClickEvent } from '../../drawer/utils';
import { ActiveComponent } from '../../shared/components';
import {
  FollowCursorDirective,
  KeyListenerDirective,
} from '../../shared/directives';
import {
  Entity,
  generateId,
  isChildOf,
  isNotNull,
  isNull,
  Option,
} from '../../shared/utils';
import { openEditApplicationModal } from '../components';

export interface AddApplicationNodeDto {
  payload: Entity<{
    kind: 'application';
    data: {
      name: string;
      thumbnailUrl: string;
    };
  }>;
  options: {
    position: {
      x: number;
      y: number;
    };
  };
}

interface Active {
  thumbnailUrl: string;
}

interface ViewModel {
  canAdd: boolean;
  isAdding: boolean;
  active: Option<Active>;
}

const initialState: ViewModel = {
  canAdd: false,
  isAdding: false,
  active: null,
};

@Component({
  selector: 'pg-active-application',
  template: `
    <pg-active
      *ngIf="active$ | ngrxPush as active"
      [pgActive]="active"
      [pgCanAdd]="(canAdd$ | ngrxPush) ?? false"
      class="fixed z-10 pointer-events-none"
      pgFollowCursor
      [ngClass]="{ hidden: (isAdding$ | ngrxPush) }"
      pgKeyListener="Escape"
      (pgKeyDown)="onEscapePressed()"
    ></pg-active>
  `,
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    FollowCursorDirective,
    ActiveComponent,
    KeyListenerDirective,
  ],
})
export class ActiveApplicationComponent
  extends ComponentStore<ViewModel>
  implements OnInit
{
  private readonly _dialog = inject(Dialog);

  private readonly _mouseMove = new Subject<MouseEvent>();

  readonly active$ = this.select(({ active }) => active);
  readonly canAdd$ = this.select(({ canAdd }) => canAdd);
  readonly isAdding$ = this.select(({ isAdding }) => isAdding);

  @Input() set pgActive(active: Option<Active>) {
    this.patchState({ active });
  }
  @Input() set pgClickEvent(event: Option<ClickEvent>) {
    if (isNotNull(event)) {
      this._handleDrawerClick(event);
    }
  }
  @Output() pgAddNode = new EventEmitter<AddApplicationNodeDto>();
  @Output() pgDeactivate = new EventEmitter();

  private readonly _handleDrawerClick = this.effect<ClickEvent>(
    exhaustMap((event) => {
      return of(event).pipe(
        withLatestFrom(this.active$),
        concatMap(([, active]) => {
          if (isNull(active)) {
            return EMPTY;
          }

          this.patchState({ isAdding: true });

          return openEditApplicationModal(this._dialog, {
            application: null,
          }).closed.pipe(
            tap((application) => {
              this.patchState({ isAdding: false });

              if (application) {
                this.pgDeactivate.emit();
                this.pgAddNode.emit({
                  payload: {
                    kind: 'application',
                    data: {
                      name: application.name,
                      thumbnailUrl: active.thumbnailUrl,
                    },
                    id: generateId(),
                  },
                  options: {
                    position: event.payload,
                  },
                });
              }
            })
          );
        })
      );
    })
  );

  private readonly _handleMouseMove = this.effect<MouseEvent>(
    tap((event) => {
      this.patchState({
        canAdd: isChildOf(event.target as HTMLElement, (element) =>
          element.matches('#cy')
        ),
      });
    })
  );

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    this._mouseMove.next(event);
  }

  constructor() {
    super(initialState);
  }

  ngOnInit() {
    this._handleMouseMove(this._mouseMove.asObservable());
  }

  onEscapePressed() {
    this.pgDeactivate.emit();
  }
}
