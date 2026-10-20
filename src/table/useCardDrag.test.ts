import { describe, expect, it, vi } from 'vitest';
import { DRAG_THRESHOLD, dragReducer, dropTargetAt, type DragAction, type DragState, type Grab } from './useCardDrag';

const grab: Grab = { pointerId: 1, from: 'tableau-3', index: 2, originX: 100, originY: 100, offsetX: 5, offsetY: 8 };
const idle: DragState = { phase: 'idle' };
const pressed: DragState = { phase: 'pressed', grab };
const dragging: DragState = { phase: 'dragging', grab, x: 150, y: 160, over: 'tableau-5' };

function move(x: number, y: number, pointerId = 1): DragAction {
  return { type: 'move', pointerId, x, y, over: 'waste' };
}

describe('dragReducer', () => {
  it('presses only from idle', () => {
    expect(dragReducer(idle, { type: 'press', grab })).toEqual(pressed);
    expect(dragReducer(dragging, { type: 'press', grab: { ...grab, pointerId: 2 } })).toBe(dragging);
  });

  it('treats a press that barely moves as a click in the making', () => {
    expect(dragReducer(pressed, move(100 + DRAG_THRESHOLD - 1, 100))).toBe(pressed);
  });

  it('starts dragging once the pointer passes the threshold', () => {
    expect(dragReducer(pressed, move(100, 100 + DRAG_THRESHOLD))).toEqual({
      phase: 'dragging',
      grab,
      x: 100,
      y: 100 + DRAG_THRESHOLD,
      over: 'waste',
    });
  });

  it('follows every move once dragging, however small', () => {
    expect(dragReducer(dragging, move(151, 160))).toMatchObject({ phase: 'dragging', x: 151, y: 160 });
  });

  it('ignores moves when idle, and moves from other pointers', () => {
    expect(dragReducer(idle, move(300, 300))).toBe(idle);
    expect(dragReducer(dragging, move(300, 300, 7))).toBe(dragging);
  });

  it('releases only for the pointer that pressed', () => {
    expect(dragReducer(dragging, { type: 'release', pointerId: 1 })).toEqual(idle);
    expect(dragReducer(pressed, { type: 'release', pointerId: 1 })).toEqual(idle);
    expect(dragReducer(dragging, { type: 'release', pointerId: 7 })).toBe(dragging);
    expect(dragReducer(idle, { type: 'release', pointerId: 1 })).toBe(idle);
  });

  it('refuses an action it does not know', () => {
    const bogus = { type: 'hover' } as unknown as DragAction;
    expect(() => dragReducer(idle, bogus)).toThrow('Unhandled value');
  });
});

describe('dropTargetAt', () => {
  function pointAt(element: Element | null) {
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(element);
  }

  it('finds the pile that contains the element under the pointer', () => {
    document.body.innerHTML = '<div data-drop-target="foundation-2"><span><b id="inner"></b></span></div>';
    pointAt(document.getElementById('inner'));
    expect(dropTargetAt(1, 1)).toBe('foundation-2');
  });

  it('finds nothing off the table, outside the window, or on an unknown pile', () => {
    document.body.innerHTML = '<p id="banner"></p><div data-drop-target="moon"><i id="odd"></i></div>';
    pointAt(document.getElementById('banner'));
    expect(dropTargetAt(1, 1)).toBeNull();
    pointAt(null);
    expect(dropTargetAt(-50, -50)).toBeNull();
    pointAt(document.getElementById('odd'));
    expect(dropTargetAt(1, 1)).toBeNull();
  });
});
