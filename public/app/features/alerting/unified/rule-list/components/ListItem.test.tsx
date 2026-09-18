import { render, screen } from 'test/test-utils';

import { ListItem } from './ListItem';

describe('ListItem', () => {
  it('lets the metadata row extend past the actions column', () => {
    render(
      <ul>
        <ListItem
          title="High CPU"
          description="summary"
          meta={[<span key="location">folder / group</span>]}
          metaRight={[<span key="interval">1m</span>]}
          actions={<button type="button">More</button>}
        />
      </ul>
    );

    expect(screen.getByText('High CPU')).toBeInTheDocument();
    expect(screen.getByText('folder / group')).toBeInTheDocument();
    expect(screen.getByText('1m')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
  });
});
