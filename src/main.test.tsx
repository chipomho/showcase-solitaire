import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('main', () => {
  afterEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  it('renders the game into #root, replaying the deal in the address bar', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState(null, '', '/?deal=77');

    await import('./main');

    expect(await screen.findByText('#77')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Klondike' })).toBeInTheDocument();
  });

  it('fails loudly when the page has nowhere to render', async () => {
    await expect(import('./main')).rejects.toThrow('no #root element');
  });
});
