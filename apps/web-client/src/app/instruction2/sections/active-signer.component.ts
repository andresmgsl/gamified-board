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
import { openEditSignerModal } from '../components';

export interface AddSignerNodeDto {
  payload: Entity<{
    kind: 'signer';
    data: {
      name: string;
      thumbnailUrl: string;
      isMutable: boolean;
    };
  }>;
  options: {
    position: {
      x: number;
      y: number;
    };
  };
}

export interface ActiveSignerData {
  thumbnailUrl: string;
}

interface ViewModel {
  canAdd: boolean;
  isAdding: boolean;
  active: Option<ActiveSignerData>;
}

const initialState: ViewModel = {
  canAdd: false,
  isAdding: false,
  active: null,
};

@Component({
  selector: 'pg-active-signer',
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
export class ActiveSignerComponent
  extends ComponentStore<ViewModel>
  implements OnInit
{
  private readonly _dialog = inject(Dialog);

  private readonly _mouseMove = new Subject<MouseEvent>();

  readonly active$ = this.select(({ active }) => active);
  readonly canAdd$ = this.select(({ canAdd }) => canAdd);
  readonly isAdding$ = this.select(({ isAdding }) => isAdding);

  @Input() set pgActive(active: Option<ActiveSignerData>) {
    this.patchState({ active });
  }
  @Input() set pgClickEvent(event: Option<ClickEvent>) {
    if (isNotNull(event)) {
      this._handleDrawerClick(event);
    }
  }
  @Output() pgAddNode = new EventEmitter<AddSignerNodeDto>();
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

          return openEditSignerModal(this._dialog, {
            signer: null,
          }).closed.pipe(
            tap((signer) => {
              this.patchState({ isAdding: false });

              if (signer) {
                this.pgDeactivate.emit();
                this.pgAddNode.emit({
                  payload: {
                    id: generateId(),
                    kind: 'signer',
                    data: {
                      name: signer.name,
                      isMutable: signer.isMutable,
                      thumbnailUrl: active.thumbnailUrl,
                    },
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
