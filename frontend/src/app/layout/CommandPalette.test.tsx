import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '@/app/layout/CommandPalette';
import { routeCatalog } from '@/services/selectors';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('CommandPalette', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.documentElement.style.overflow = '';
    usePlatformStore.setState({ commandPaletteOpen: true });
  });

  it('locks scrolling while open and restores it when dismissed', async () => {
    const user = userEvent.setup();

    const { container } = renderWithProviders(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.touchAction).toBe('none');
    expect(document.documentElement.style.overflow).toBe('hidden');

    const backdrop = container.firstChild;

    if (!(backdrop instanceof HTMLElement)) {
      throw new Error('Expected command palette backdrop to render');
    }

    await user.click(backdrop);

    expect(usePlatformStore.getState().commandPaletteOpen).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.touchAction).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup();

    const { container } = renderWithProviders(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    const backdrop = container.firstChild;

    if (!(backdrop instanceof HTMLElement)) {
      throw new Error('Expected command palette backdrop to render');
    }

    await user.click(backdrop);

    expect(usePlatformStore.getState().commandPaletteOpen).toBe(false);
  });

  it('supports arrow key navigation and enter from the input', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-activedescendant', 'command-option-executive');

    await user.keyboard('{ArrowDown}');

    expect(input).toHaveAttribute('aria-activedescendant', 'command-option-agents');

    await user.keyboard('{Enter}');

    expect(usePlatformStore.getState().commandPaletteOpen).toBe(false);
  });

  it('filters results and resets selection to the first matching command', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, routeCatalog.governance.title);

    expect(input).toHaveAttribute('aria-activedescendant', 'command-option-governance');
    expect(screen.getByRole('option', { name: /ai governance & explainability console/i })).toBeInTheDocument();
  });
});
