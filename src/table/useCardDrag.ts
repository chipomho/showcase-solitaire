import { useReducer, useRef, type MouseEvent, type PointerEvent } from 'react';
import { assertNever } from '../game/assertNever';
import { parsePileId, type PileId } from '../game/piles';

/** How far a pointer must travel, in CSS pixels, before a press becomes a drag. */
export const DRAG_THRESHOLD = 4;

export interface Grab {
  readonly pointerId: number;
  readonly from: PileId;
  readonly index: number;
  readonly originX: number;
  readonly originY: number;
  /** Where inside the card the pointer took hold, so the card doesn't jump under it. */
  readonly offsetX: number;
  readonly offsetY: number;
}

export type DragState =
  | { readonly phase: 'idle' }
  | { readonly phase: 'pressed'; readonly grab: Grab }
  | {
      readonly phase: 'dragging';
      readonly grab: Grab;
      readonly x: number;
      readonly y: number;
      readonly over: PileId | null;
    };

export type DragAction =
  | { readonly type: 'press'; readonly grab: Grab }
  | {
      readonly type: 'move';
      readonly pointerId: number;
      readonly x: number;
      readonly y: number;
      readonly over: PileId | null;
    }
  | { readonly type: 'release'; readonly pointerId: number };

const IDLE: DragState = { phase: 'idle' };

export function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case 'press':
      return state.phase === 'idle' ? { phase: 'pressed', grab: action.grab } : state;
    case 'move': {
      if (state.phase === 'idle' || action.pointerId !== state.grab.pointerId) {
        return state;
      }
      const { grab } = state;
      const travelled = Math.hypot(action.x - grab.originX, action.y - grab.originY);
      if (state.phase === 'pressed' && travelled < DRAG_THRESHOLD) {
        return state;
      }
      return { phase: 'dragging', grab, x: action.x, y: action.y, over: action.over };
    }
    case 'release':
      return state.phase !== 'idle' && action.pointerId === state.grab.pointerId ? IDLE : state;
    default:
      return assertNever(action);
  }
}

/** The pile under a viewport point. The drag preview is `pointer-events: none`, so it never gets in the way. */
export function dropTargetAt(x: number, y: number): PileId | null {
  const element = document.elementFromPoint(x, y);
  const pile = element?.closest<HTMLElement>('[data-drop-target]');
  return parsePileId(pile?.dataset.dropTarget);
}

export interface CardPointerHandlers {
  onPointerDown(event: PointerEvent<HTMLElement>): void;
  onPointerMove(event: PointerEvent<HTMLElement>): void;
  onPointerUp(event: PointerEvent<HTMLElement>): void;
  onPointerCancel(event: PointerEvent<HTMLElement>): void;
}

/**
 * Pointer-event drag and drop for cards. Pointer capture keeps every move and the release
 * on the card that was pressed, which is what makes one code path work for mouse, pen and touch.
 */
export function useCardDrag(onDrop: (from: PileId, index: number, to: PileId) => void) {
  const [drag, dispatch] = useReducer(dragReducer, IDLE);
  const endedWithDrag = useRef(false);

  function pointerHandlers(from: PileId, index: number): CardPointerHandlers {
    return {
      onPointerDown(event) {
        if (event.button !== 0 || !event.isPrimary || drag.phase !== 'idle') {
          return;
        }
        endedWithDrag.current = false;
        const card = event.currentTarget;
        card.setPointerCapture(event.pointerId);
        const bounds = card.getBoundingClientRect();
        dispatch({
          type: 'press',
          grab: {
            pointerId: event.pointerId,
            from,
            index,
            originX: event.clientX,
            originY: event.clientY,
            offsetX: event.clientX - bounds.left,
            offsetY: event.clientY - bounds.top,
          },
        });
      },
      onPointerMove(event) {
        if (drag.phase === 'idle') {
          return;
        }
        dispatch({
          type: 'move',
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          over: dropTargetAt(event.clientX, event.clientY),
        });
      },
      onPointerUp(event) {
        if (drag.phase === 'dragging' && event.pointerId === drag.grab.pointerId) {
          endedWithDrag.current = true;
          const to = dropTargetAt(event.clientX, event.clientY);
          if (to !== null && to !== drag.grab.from) {
            onDrop(drag.grab.from, drag.grab.index, to);
          }
        }
        dispatch({ type: 'release', pointerId: event.pointerId });
      },
      onPointerCancel(event) {
        dispatch({ type: 'release', pointerId: event.pointerId });
      },
    };
  }

  /**
   * A drag that ends where it began still produces a click on the card. Keyboard clicks
   * report `detail === 0` and are never swallowed; the flag resets on the next press.
   */
  function isClickAfterDrag(event: MouseEvent<HTMLElement>): boolean {
    return event.detail > 0 && endedWithDrag.current;
  }

  return { drag, pointerHandlers, isClickAfterDrag };
}
