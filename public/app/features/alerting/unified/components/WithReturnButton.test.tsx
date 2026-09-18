import { render, screen } from 'test/test-utils';

import { useReturnToPrevious } from '@grafana/runtime';

import { WithReturnButton } from './WithReturnButton';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  useReturnToPrevious: jest.fn(),
}));

describe('WithReturnButton', () => {
  it('uses a translated default title when none is provided', async () => {
    const returnToPrevious = jest.fn();
    jest.mocked(useReturnToPrevious).mockReturnValue(returnToPrevious);

    const { user } = render(<WithReturnButton component={<button type="button">Open dashboard</button>} />);

    await user.click(screen.getByRole('button', { name: 'Open dashboard' }));
    expect(returnToPrevious).toHaveBeenCalledWith('previous page');
  });

  it('forwards an explicit title', async () => {
    const returnToPrevious = jest.fn();
    jest.mocked(useReturnToPrevious).mockReturnValue(returnToPrevious);

    const { user } = render(
      <WithReturnButton title="CPU alert" component={<button type="button">Open dashboard</button>} />
    );

    await user.click(screen.getByRole('button', { name: 'Open dashboard' }));
    expect(returnToPrevious).toHaveBeenCalledWith('CPU alert');
  });
});
