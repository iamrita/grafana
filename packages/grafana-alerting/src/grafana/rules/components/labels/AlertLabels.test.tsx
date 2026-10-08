import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertLabels } from './AlertLabels';

describe('AlertLabels', () => {
  it('should toggle show / hide common labels', async () => {
    const labels = { foo: 'bar', bar: 'baz', baz: 'qux' };
    const another = { foo: 'bar', baz: 'qux', extra: 'z' };

    render(<AlertLabels labels={labels} displayCommonLabels labelSets={[labels, another]} />);
    expect(screen.getByText('+2 common labels')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Hide common labels')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('+2 common labels')).toBeInTheDocument();
    });
  });

  it('truncates labels and can reveal the rest', async () => {
    const labels = { a: '1', b: '2', c: '3', d: '4' };

    render(<AlertLabels labels={labels} maxItems={2} />);

    expect(screen.getByRole('listitem', { name: 'a: 1' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'b: 2' })).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { name: 'c: 3' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+2 more' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '+2 more' }));
    await waitFor(() => {
      expect(screen.getByRole('listitem', { name: 'c: 3' })).toBeInTheDocument();
    });
    expect(screen.getByRole('listitem', { name: 'd: 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show fewer' })).toBeInTheDocument();
  });
});
