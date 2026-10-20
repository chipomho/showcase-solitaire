import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import {
  cardNames,
  dragCard,
  dropZone,
  faceUpCard,
  heldCards,
  layOutScreen,
  stack,
  stock,
  tableau,
  topCard,
} from '../test/table';

function setUp() {
  const user = userEvent.setup();
  render(<App initialDealNumber={4242} />);
  return { user, status: screen.getByRole('status') };
}

function nameOf(element: HTMLElement): string {
  return element.getAttribute('aria-label') ?? '';
}

describe('dragging with a pointer', () => {
  it('drops a card on another pile and turns over the card it uncovered', async () => {
    const { user, status } = setUp();
    const [base] = cardNames(tableau(1));
    const moving = topCard(7);
    const name = nameOf(moving);

    await dragCard(user, moving, tableau(1));

    expect(cardNames(tableau(1))).toEqual([base, name]);
    const left = cardNames(tableau(7));
    expect(left).toHaveLength(6);
    expect(left.at(-1)).not.toBe('Face-down card');
    expect(status).toHaveTextContent(`Moved ${name} to tableau 1.`);
  });

  it('carries the cards on top along, and can empty a pile and fill an empty one', async () => {
    const { user, status } = setUp();
    await dragCard(user, topCard(7), tableau(1));
    const pair = cardNames(tableau(1));

    await dragCard(user, faceUpCard(1, 0), tableau(2));

    expect(cardNames(tableau(2)).slice(-2)).toEqual(pair);
    expect(status).toHaveTextContent(`Moved ${pair.join(' and ')} to tableau 2.`);
    const emptied = screen.getByRole('button', { name: 'Empty tableau 1' });

    await dragCard(user, topCard(5), emptied);
    expect(cardNames(tableau(1))).toHaveLength(1);
  });

  it('shows the cards in hand under the pointer and highlights the pile beneath', async () => {
    const { user } = setUp();
    await dragCard(user, topCard(7), tableau(1));
    const lower = faceUpCard(1, 0);
    const upper = faceUpCard(1, 1);
    layOutScreen(upper, tableau(4));

    await user.pointer([
      { keys: '[MouseLeft>]', target: upper, coords: { clientX: 10, clientY: 10 } },
      { coords: { clientX: 30, clientY: 12 } },
    ]);
    const preview = screen.getByTestId('drag-preview');
    expect(preview.style.transform).toBe('translate3d(20px, 2px, 0)');
    expect(within(preview).getAllByRole('listitem', { hidden: true })).toHaveLength(1);
    expect(upper).toHaveAttribute('data-lifted');
    expect(lower).not.toHaveAttribute('data-lifted');
    // Over its own pile: nothing to highlight.
    expect(document.querySelector('[data-drop-hover]')).toBeNull();

    await user.pointer({ coords: { clientX: 250, clientY: 300 } });
    expect(preview.style.transform).toBe('translate3d(240px, 290px, 0)');
    expect(dropZone(tableau(4))).toHaveAttribute('data-drop-hover');

    await user.pointer({ keys: '[/MouseLeft]' });
    expect(screen.queryByTestId('drag-preview')).not.toBeInTheDocument();
    expect(document.querySelector('[data-drop-hover]')).toBeNull();
  });

  it.each([
    ['outside the window', () => null],
    ['somewhere that is not a pile', () => screen.getByRole('complementary')],
    ['back on its own pile', () => tableau(6)],
    ['on the stock, which only deals', () => stock()],
  ])('changes nothing when a card is dropped %s', async (_, target) => {
    const { user } = setUp();
    const before = [1, 2, 3, 4, 5, 6, 7].map((column) => cardNames(tableau(column)));

    await dragCard(user, topCard(6), target());

    expect([1, 2, 3, 4, 5, 6, 7].map((column) => cardNames(tableau(column)))).toEqual(before);
    expect(screen.queryByTestId('drag-preview')).not.toBeInTheDocument();
    // The click that ends the drag must not pick the card up.
    expect(heldCards()).toEqual([]);
  });

  it('does not start a drag from a right-button press', async () => {
    const { user } = setUp();
    const card = topCard(3);
    layOutScreen(card, tableau(1));
    await user.pointer([
      { keys: '[MouseRight>]', target: card, coords: { clientX: 10, clientY: 10 } },
      { coords: { clientX: 200, clientY: 200 } },
    ]);
    expect(screen.queryByTestId('drag-preview')).not.toBeInTheDocument();
    await user.pointer({ keys: '[/MouseRight]' });
    expect(cardNames(tableau(1))).toHaveLength(1);
  });

  it('works by touch, and other pointers cannot hijack the drag', async () => {
    const { user } = setUp();
    const card = topCard(7);
    const other = topCard(2);
    const name = nameOf(card);
    layOutScreen(card, tableau(1));

    await user.pointer([
      { keys: '[TouchA>]', target: card, coords: { clientX: 10, clientY: 10 } },
      { pointerName: 'TouchA', target: card, coords: { clientX: 40, clientY: 40 } },
      // A second finger is not the primary pointer.
      { keys: '[TouchB>]', target: other, coords: { clientX: 60, clientY: 60 } },
      // The mouse is primary for its kind, but a drag is already under way.
      { keys: '[MouseLeft>]', target: other, coords: { clientX: 70, clientY: 70 } },
      { pointerName: 'mouse', target: card, coords: { clientX: 300, clientY: 300 } },
      { keys: '[/MouseLeft]', target: card, coords: { clientX: 300, clientY: 300 } },
    ]);
    expect(screen.getByTestId('drag-preview').style.transform).toBe('translate3d(30px, 30px, 0)');
    expect(cardNames(tableau(1))).toHaveLength(1);

    await user.pointer([
      { keys: '[/TouchB]', target: other },
      { pointerName: 'TouchA', target: card, coords: { clientX: 200, clientY: 200 } },
      { keys: '[/TouchA]', target: card },
    ]);
    expect(cardNames(tableau(1)).at(-1)).toBe(name);
  });

  it('abandons the drag when the browser cancels the pointer', async () => {
    const { user } = setUp();
    const card = topCard(4);
    layOutScreen(card, tableau(1));
    await user.pointer([
      { keys: '[MouseLeft>]', target: card, coords: { clientX: 10, clientY: 10 } },
      { coords: { clientX: 200, clientY: 200 } },
    ]);
    expect(screen.getByTestId('drag-preview')).toBeInTheDocument();

    fireEvent.pointerCancel(card, { pointerId: 1 });

    expect(screen.queryByTestId('drag-preview')).not.toBeInTheDocument();
    expect(cardNames(tableau(1))).toHaveLength(1);
  });
});

describe('moving cards with clicks or the keyboard', () => {
  it('picks a card up with a click and puts it down on the pile clicked next', async () => {
    const { user, status } = setUp();
    const card = topCard(3);
    const name = nameOf(card);

    await user.click(card);
    expect(heldCards()).toEqual([name]);
    expect(card).toHaveAttribute('data-held');
    expect(status).toHaveTextContent(`Picked up ${name}. Choose a pile, or press Escape to cancel.`);

    await user.click(topCard(5));
    expect(cardNames(tableau(5)).at(-1)).toBe(name);
    expect(heldCards()).toEqual([]);
    expect(status).toHaveTextContent(`Moved ${name} to tableau 5.`);
  });

  it('works from the keyboard alone, and focus follows the moved card', async () => {
    const { user } = setUp();
    const name = nameOf(topCard(2));

    topCard(2).focus();
    await user.keyboard('{Enter}');
    expect(heldCards()).toEqual([name]);

    topCard(6).focus();
    await user.keyboard(' ');
    expect(cardNames(tableau(6)).at(-1)).toBe(name);
    expect(screen.getByRole('button', { name })).toHaveFocus();
  });

  it('still answers the keyboard straight after a drag', async () => {
    const { user } = setUp();
    await dragCard(user, topCard(4), tableau(4));
    topCard(4).focus();
    await user.keyboard('{Enter}');
    expect(heldCards()).toEqual([nameOf(topCard(4))]);
  });

  it('marks every card that travels with the one picked up', async () => {
    const { user } = setUp();
    await dragCard(user, topCard(7), tableau(1));
    const lower = faceUpCard(1, 0);
    const upper = faceUpCard(1, 1);

    await user.click(upper);
    expect(lower).not.toHaveAttribute('data-held');
    await user.keyboard('{Escape}');

    await user.click(lower);
    expect(heldCards()).toEqual([nameOf(lower)]);
    expect(upper).toHaveAttribute('data-held');
    expect(screen.getByRole('status')).toHaveTextContent(`Picked up ${nameOf(lower)} and ${nameOf(upper)}.`);
  });

  it('puts the cards back on Escape or on a second click on the same pile', async () => {
    const { user, status } = setUp();
    await user.keyboard('{Escape}');
    expect(status).toHaveTextContent('');

    await user.click(topCard(3));
    await user.keyboard('a');
    expect(heldCards()).toHaveLength(1);
    await user.keyboard('{Escape}');
    expect(heldCards()).toEqual([]);
    expect(status).toHaveTextContent('Put the cards back.');

    await user.click(topCard(3));
    await user.click(topCard(3));
    expect(heldCards()).toEqual([]);
    expect(cardNames(tableau(3))).toHaveLength(3);
  });

  it('puts held cards on an empty pile, and ignores empty piles otherwise', async () => {
    const { user } = setUp();
    await user.click(screen.getByRole('button', { name: 'Empty foundation 1' }));
    expect(stack('Foundation 1')).toHaveAccessibleName('Foundation 1, 0 cards');

    const name = nameOf(topCard(1));
    await user.click(topCard(1));
    await user.click(screen.getByRole('button', { name: 'Empty foundation 1' }));

    expect(stack('Foundation 1')).toHaveAccessibleName('Foundation 1, 1 card');
    expect(within(stack('Foundation 1')).getByRole('button', { name })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Empty tableau 1' })).toBeInTheDocument();

    // Onto a pile that already has a card, from the keyboard: focus still follows.
    const next = nameOf(topCard(2));
    topCard(2).focus();
    await user.keyboard('{Enter}');
    within(stack('Foundation 1')).getByRole('button', { name }).focus();
    await user.keyboard('{Enter}');
    expect(stack('Foundation 1')).toHaveAccessibleName('Foundation 1, 2 cards');
    expect(within(stack('Foundation 1')).getByRole('button', { name: next })).toHaveFocus();
  });
});

describe('the stock and the waste', () => {
  it('draws the top card of the stock face up onto the waste', async () => {
    const { user, status } = setUp();
    await user.click(stock());

    expect(stock()).toHaveAccessibleName('Stock, 23 cards. Draw a card.');
    const waste = stack('Waste');
    expect(waste).toHaveAccessibleName('Waste, 1 card');
    const drawn = within(waste).getByRole('button');
    expect(status).toHaveTextContent(`Drew the ${nameOf(drawn)}.`);
  });

  it('turns the waste back over once the stock runs out, in the original order', async () => {
    const { user } = setUp();
    await user.click(stock());
    const first = nameOf(within(stack('Waste')).getByRole('button'));
    for (let i = 1; i < 24; i += 1) {
      await user.click(stock());
    }
    expect(stock()).toHaveAccessibleName('Stock, empty. Turn the waste back over.');
    expect(stack('Waste')).toHaveAccessibleName('Waste, 24 cards');

    await user.click(stock());
    expect(screen.getByRole('status')).toHaveTextContent('Turned the waste back over onto the stock.');
    expect(stack('Waste')).toHaveAccessibleName('Waste, 0 cards');

    await user.click(stock());
    expect(nameOf(within(stack('Waste')).getByRole('button'))).toBe(first);
  });

  it('lets the waste card be dragged away, revealing the one underneath', async () => {
    const { user } = setUp();
    await user.click(stock());
    const under = nameOf(within(stack('Waste')).getByRole('button'));
    await user.click(stock());
    const top = within(stack('Waste')).getByRole('button');
    const name = nameOf(top);

    await dragCard(user, top, stack('Foundation 3'));

    expect(nameOf(within(stack('Waste')).getByRole('button'))).toBe(under);
    expect(nameOf(within(stack('Foundation 3')).getByRole('button'))).toBe(name);

    await dragCard(user, within(stack('Foundation 3')).getByRole('button'), tableau(3));
    expect(cardNames(tableau(3)).at(-1)).toBe(name);
  });

  it('drops whatever was picked up when the stock is used', async () => {
    const { user } = setUp();
    await user.click(topCard(4));
    await user.click(stock());
    expect(heldCards()).toEqual([]);
  });
});
