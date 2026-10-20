import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

export function tableau(column: number): HTMLElement {
  return screen.getByRole('list', { name: `Tableau ${column}` });
}

/** Waste and foundations are labelled with their size, e.g. "Waste, 3 cards". */
export function stack(name: string): HTMLElement {
  return screen.getByRole('group', { name: new RegExp(`^${name},`) });
}

export function stock(): HTMLElement {
  return screen.getByRole('button', { name: /^Stock,/ });
}

/** What a pile shows, bottom to top: card names, or "Face-down card". */
export function cardNames(list: HTMLElement): (string | null)[] {
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.firstElementChild?.getAttribute('aria-label') ?? null);
}

/** The nth face-up card of a tableau pile, counting from the bottom; -1 is the top card. */
export function faceUpCard(column: number, n: number): HTMLElement {
  const card = within(tableau(column)).getAllByRole('button').at(n);
  if (card === undefined) {
    throw new Error(`Tableau ${column} has no face-up card at ${n}`);
  }
  return card;
}

export function topCard(column: number): HTMLElement {
  return faceUpCard(column, -1);
}

export function dropZone(element: HTMLElement): HTMLElement {
  const zone = element.closest<HTMLElement>('[data-drop-target]');
  if (zone === null) {
    throw new Error('Element is not inside a pile');
  }
  return zone;
}

export function heldCards(): string[] {
  return screen
    .queryAllByRole('button', { pressed: true })
    .map((button) => button.getAttribute('aria-label') ?? '');
}

/**
 * Decides what document.elementFromPoint reports. Our drags press at x = 10 and
 * release at x = 200, so "left of 100" is the card's own pile and the rest is `target`.
 */
export function layOutScreen(source: Element, target: Element | null): void {
  vi.spyOn(document, 'elementFromPoint').mockImplementation((x) => (x < 100 ? source : target));
}

/** Presses `card`, travels well past the drag threshold and lets go over `target`. */
export async function dragCard(user: UserEvent, card: HTMLElement, target: Element | null): Promise<void> {
  layOutScreen(card, target);
  await user.pointer([
    { keys: '[MouseLeft>]', target: card, coords: { clientX: 10, clientY: 10 } },
    { coords: { clientX: 40, clientY: 40 } },
    { coords: { clientX: 200, clientY: 200 } },
    { keys: '[/MouseLeft]' },
  ]);
}
