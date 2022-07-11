import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Output,
  ViewChild,
} from '@angular/core';

import { Directive } from '@angular/core';
import {
  animationFrameScheduler,
  defer,
  interval,
  map,
  Subject,
  Subscription,
  takeWhile,
} from 'rxjs';

export const ease = (x: number) => {
  return x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
};

export const duration = (t: number) =>
  defer(() => {
    const t0 = Date.now();
    return interval(0, animationFrameScheduler).pipe(
      map(() => Date.now()),
      map((t1) => t1 - t0),
      map((dt: number) => dt / t),
      takeWhile((n) => n <= 1)
    );
  });

export const distance = (x: number, t: number) =>
  duration(t).pipe(map((t: number) => ease(t) * x));

interface Position {
  x: number;
  y: number;
}

@Directive({ selector: '[pgMouseMove]' })
export class MouseMoveDirective {
  private readonly _mouseMove = new Subject<Position>();

  @Output() readonly mouseMove = this._mouseMove.asObservable();

  @HostListener('mousemove', ['$event']) onMouseMove(value: MouseEvent) {
    this._mouseMove.next({ x: value.x, y: value.y });
  }
}

@Directive({ selector: '[pgHover]' })
export class HoverDirective {
  private readonly _hover = new Subject<void>();

  @Output() readonly hover = this._hover.asObservable();

  @HostListener('mouseover', []) onMouseMove() {
    this._hover.next();
  }
}

@Component({
  selector: 'pg-row',
  template: ` <ng-content></ng-content> `,
})
export class RowComponent {
  @HostBinding('class') class =
    'block w-full h-64 bg-blue-300 border border-blue-500 bg-bp-bricks ';
}

const BOARD_SIZE = 8000;

@Component({
  selector: 'pg-root',
  template: `
    <div id="viewport">
      <div
        class="fixed w-12 h-12 bg-red-500 bg-opacity-5 z-10"
        (mouseenter)="onMoveLeft(); onMoveTop()"
        (mouseleave)="onStopMoveLeft(); onStopMoveTop()"
      ></div>
      <div
        class="fixed w-12 h-12 bg-red-500 bg-opacity-5 z-10 right-0"
        (mouseenter)="onMoveRight(); onMoveTop()"
        (mouseleave)="onStopMoveRight(); onStopMoveTop()"
      ></div>
      <div
        class="fixed w-12 h-12 bg-red-500 bg-opacity-5 z-10 bottom-0"
        (mouseenter)="onMoveLeft(); onMoveBottom()"
        (mouseleave)="onStopMoveLeft(); onStopMoveBottom()"
      ></div>
      <div
        class="fixed w-12 h-12 bg-red-500 bg-opacity-5 z-10 right-0 bottom-0"
        (mouseenter)="onMoveRight(); onMoveBottom()"
        (mouseleave)="onStopMoveRight(); onStopMoveBottom()"
      ></div>

      <div
        class="fixed w-12 h-screen bg-white bg-opacity-5"
        (mouseenter)="onMoveLeft()"
        (mouseleave)="onStopMoveLeft()"
      ></div>
      <div
        class="fixed w-12 h-screen bg-white bg-opacity-5 right-0"
        (mouseenter)="onMoveRight()"
        (mouseleave)="onStopMoveRight()"
      ></div>
      <div
        class="fixed w-screen h-12 bg-white bg-opacity-5"
        (mouseenter)="onMoveTop()"
        (mouseleave)="onStopMoveTop()"
      ></div>
      <div
        class="fixed w-screen h-12 bg-white bg-opacity-5 bottom-0"
        (mouseenter)="onMoveBottom()"
        (mouseleave)="onStopMoveBottom()"
      ></div>
    </div>

    <div id="board" #board>
      <pg-row class="text-2xl text-white uppercase">row 1</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 2</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 3</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 4</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 5</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 6</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 7</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 8</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 9</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 10</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 11</pg-row>
      <pg-row class="text-2xl text-white uppercase">row 12</pg-row>
    </div>
  `,
  styles: [
    `
      #board {
        width: 8000px;
      }
    `,
  ],
})
export class AppComponent {
  @HostBinding('class') class = 'block';
  @ViewChild('board') boardRef: ElementRef | null = null;

  moveRightSubscription: Subscription | null = null;
  moveLeftSubscription: Subscription | null = null;
  moveTopSubscription: Subscription | null = null;
  moveBottomSubscription: Subscription | null = null;

  onMoveRight() {
    // 8000 total of the board
    // 1500 inner width (window size)
    // 8000 - 1500 = 2500 max to the left
    // 32 current left scroll
    // 2500 - 32 = 2468 x distance
    const MAX_LEFT_SIZE = BOARD_SIZE - window.innerWidth;
    const CURRENT_SCROLL_LEFT = window.scrollX;
    const MAX_DISTANCE = MAX_LEFT_SIZE - CURRENT_SCROLL_LEFT;

    this.moveRightSubscription = distance(MAX_DISTANCE, 1000)
      .pipe(map((x) => CURRENT_SCROLL_LEFT + x))
      .subscribe((left) => {
        window.scroll({
          left,
        });
      });
  }

  onStopMoveRight() {
    this.moveRightSubscription?.unsubscribe();
  }

  onMoveLeft() {
    const CURRENT_SCROLL_LEFT = window.scrollX;

    this.moveLeftSubscription = distance(CURRENT_SCROLL_LEFT, 1000)
      .pipe(map((x) => CURRENT_SCROLL_LEFT - x))
      .subscribe((left) => {
        window.scroll({
          left,
        });
      });
  }

  onStopMoveLeft() {
    this.moveLeftSubscription?.unsubscribe();
  }

  onMoveTop() {
    const CURRENT_SCROLL_TOP = window.scrollY;

    this.moveTopSubscription = distance(CURRENT_SCROLL_TOP, 1000)
      .pipe(map((x) => CURRENT_SCROLL_TOP - x))
      .subscribe((top) => {
        window.scroll({
          top,
        });
      });
  }

  onStopMoveTop() {
    this.moveTopSubscription?.unsubscribe();
  }

  onMoveBottom() {
    // 8000 total of the board
    // 1500 inner width (window size)
    // 8000 - 1500 = 2500 max to the left
    // 32 current left scroll
    // 2500 - 32 = 2468 x distance
    const MAX_TOP_SIZE = BOARD_SIZE - window.innerHeight;
    const CURRENT_SCROLL_TOP = window.scrollY;
    const MAX_DISTANCE = MAX_TOP_SIZE - CURRENT_SCROLL_TOP;

    this.moveBottomSubscription = distance(MAX_DISTANCE, 1000)
      .pipe(map((x) => CURRENT_SCROLL_TOP + x))
      .subscribe((top) => {
        window.scroll({
          top,
        });
      });
  }

  onStopMoveBottom() {
    this.moveBottomSubscription?.unsubscribe();
  }
}