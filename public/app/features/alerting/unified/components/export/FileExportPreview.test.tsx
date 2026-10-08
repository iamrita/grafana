import { Props } from 'react-virtualized-auto-sizer';
import { render, screen } from 'test/test-utils';

import { FileExportPreview } from './FileExportPreview';

jest.mock('react-virtualized-auto-sizer', () => {
  return ({ children }: Props) =>
    children({
      height: 600,
      scaledHeight: 600,
      scaledWidth: 1,
      width: 1,
    });
});

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  CodeEditor: ({ value }: { value: string }) => <textarea data-testid="code-editor" value={value} readOnly />,
}));

describe('FileExportPreview', () => {
  it('shows an empty state and disables export actions when there is no content', () => {
    render(<FileExportPreview format="yaml" textDefinition="   " downloadFileName="alert" onClose={() => undefined} />);

    expect(screen.getByText('Nothing to export')).toBeInTheDocument();
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('renders the export when content is present', () => {
    render(
      <FileExportPreview format="yaml" textDefinition="groups: []" downloadFileName="alert" onClose={() => undefined} />
    );

    expect(screen.getByTestId('code-editor')).toHaveValue('groups: []');
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });
});
