import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom has no layout engine, so it has neither pointer capture nor hit testing.
// Capture becomes a no-op; tests that drop cards decide what lies under the pointer
// by stubbing elementFromPoint (see ./table.ts). By default nothing does.
Element.prototype.setPointerCapture = () => undefined;
Element.prototype.releasePointerCapture = () => undefined;
Element.prototype.hasPointerCapture = () => false;
document.elementFromPoint = () => null;
