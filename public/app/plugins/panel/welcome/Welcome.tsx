import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { TextLink, useStyles2 } from '@grafana/ui';

const helpOptions = [
  { value: 0, label: 'Documentation', href: 'https://grafana.com/docs/grafana/latest' },
  { value: 1, label: 'Tutorials', href: 'https://grafana.com/tutorials' },
  { value: 2, label: 'Community', href: 'https://community.grafana.com' },
  { value: 3, label: 'Public Slack', href: 'http://slack.grafana.com' },
];

export const WelcomeBanner = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <Trans i18nKey="welcome.welcome-banner.welcome-to-grafana">Welcome to Grafana</Trans>
      </h1>
      <div className={styles.help}>
        <h2 className={styles.helpText}>
          <Trans i18nKey="welcome.welcome-banner.need-help">Need help?</Trans>
        </h2>
        <div className={styles.helpLinks}>
          {helpOptions.map((option, index) => (
            <TextLink
              key={`${option.label}-${index}`}
              href={`${option.href}?utm_source=grafana_gettingstarted`}
              external
              inline={false}
            >
              {option.label}
            </TextLink>
          ))}
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const bannerPink = theme.visualization.getColorByName('pink');

  return {
    container: css({
      display: 'flex',
      backgroundColor: bannerPink,
      color: theme.colors.getContrastText(bannerPink),
      backgroundSize: 'cover',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing(0, 3),

      [theme.breakpoints.down('lg')]: {
        backgroundPosition: '0px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
      },

      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(0, 1),
      },
    }),
    title: css({
      marginBottom: 0,
      ...theme.typography.h1,
      fontSize: theme.typography.pxToRem(32),
      lineHeight: 40 / 32,

      [theme.breakpoints.down('lg')]: {
        marginBottom: theme.spacing(1),
      },

      [theme.breakpoints.down('md')]: {
        fontSize: theme.typography.h1.fontSize,
        lineHeight: theme.typography.h1.lineHeight,
      },
      [theme.breakpoints.down('sm')]: {
        fontSize: theme.typography.h2.fontSize,
        lineHeight: theme.typography.h2.lineHeight,
      },
    }),
    help: css({
      display: 'flex',
      alignItems: 'baseline',
    }),
    helpText: css({
      ...theme.typography.h2,
      marginRight: theme.spacing(2),
      marginBottom: 0,

      [theme.breakpoints.down('md')]: {
        fontSize: theme.typography.h3.fontSize,
        lineHeight: theme.typography.h3.lineHeight,
      },

      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    }),
    helpLinks: css({
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(2),
      textWrap: 'nowrap',
      fontSize: theme.typography.h5.fontSize,
      lineHeight: theme.typography.h5.lineHeight,

      [theme.breakpoints.down('sm')]: {
        gap: theme.spacing(1),
      },
    }),
  };
};
