import { render, screen } from 'test/test-utils';

import { PromAlertingRuleState } from 'app/types/unified-alerting-dto';

import { AlertRuleListItem } from './AlertRuleListItem';

describe('AlertRuleListItem', () => {
  const MOCK_NOW = new Date('2024-05-23T12:00:00');

  beforeEach(() => {
    jest.useFakeTimers({ now: MOCK_NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows how long a firing rule has been firing', () => {
    const lastEvaluation = new Date(MOCK_NOW.valueOf() - (2 * 60 + 34) * 1000).toISOString();

    render(
      <AlertRuleListItem
        name="CPU high"
        href="/alerting/1/view"
        state={PromAlertingRuleState.Firing}
        lastEvaluation={lastEvaluation}
        evaluationInterval="5m"
        showLocation={false}
      />
    );

    expect(screen.getByText('Firing for')).toBeInTheDocument();
    expect(screen.getByText('2m34s')).toBeInTheDocument();
    expect(screen.getByText(/next evaluation in/i)).toBeInTheDocument();
  });

  it('shows next evaluation only when the rule is not firing', () => {
    const lastEvaluation = new Date(MOCK_NOW.valueOf() - 60 * 1000).toISOString();

    render(
      <AlertRuleListItem
        name="CPU high"
        href="/alerting/1/view"
        state={PromAlertingRuleState.Pending}
        lastEvaluation={lastEvaluation}
        evaluationInterval="5m"
        showLocation={false}
      />
    );

    expect(screen.queryByText('Firing for')).not.toBeInTheDocument();
    expect(screen.getByText(/Next evaluation/i)).toBeInTheDocument();
  });
});
