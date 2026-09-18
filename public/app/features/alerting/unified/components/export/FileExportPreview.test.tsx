import { render, screen } from 'test/test-utils';

import { FileExportPreview } from './FileExportPreview';

describe('FileExportPreview', () => {
  it('shows an empty state and hides copy/download actions', () => {
    const onClose = jest.fn();

    render(<FileExportPreview format="yaml" textDefinition="   " downloadFileName="rules" onClose={onClose} />);

    expect(screen.getByText('Nothing to export')).toBeInTheDocument();
    expect(screen.getByText('No content is available for this export.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy code/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('shows copy and download actions when content exists', () => {
    render(
      <FileExportPreview format="yaml" textDefinition="groups: []" downloadFileName="rules" onClose={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });
});
