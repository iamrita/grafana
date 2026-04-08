import { render, screen } from '@testing-library/react';

import { WelcomeBanner } from './Welcome';

describe('WelcomeBanner', () => {
  it('renders welcome title and help heading', () => {
    render(<WelcomeBanner />);
    expect(screen.getByRole('heading', { level: 1, name: /welcome to grafana/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /need help/i })).toBeInTheDocument();
  });

  it('renders help links with utm tracking on hrefs', () => {
    render(<WelcomeBanner />);
    const docLink = screen.getByRole('link', { name: 'Documentation' });
    expect(docLink.getAttribute('href')).toContain('https://grafana.com/docs/grafana/latest');
    expect(docLink.getAttribute('href')).toContain('utm_source=grafana_gettingstarted');

    expect(screen.getByRole('link', { name: 'Tutorials' }).getAttribute('href')).toContain(
      'utm_source=grafana_gettingstarted'
    );
    expect(screen.getByRole('link', { name: 'Community' }).getAttribute('href')).toContain(
      'utm_source=grafana_gettingstarted'
    );
    expect(screen.getByRole('link', { name: 'Public Slack' }).getAttribute('href')).toContain(
      'utm_source=grafana_gettingstarted'
    );
  });
});
