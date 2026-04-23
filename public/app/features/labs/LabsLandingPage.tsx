import { Trans, t } from '@grafana/i18n';
import { Alert } from '@grafana/ui';
import { NavLandingPageCard } from 'app/core/components/NavLandingPage/NavLandingPageCard';
import { Page } from 'app/core/components/Page/Page';

export default function LabsLandingPage() {
  return (
    <Page navId="labs">
      <Page.Contents>
        <Alert title="" severity="warning">
          <Trans i18nKey="labs.landing.warning">
            Labs includes experimental capabilities. They may change or be removed without notice.
          </Trans>
        </Alert>
        <section
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            paddingTop: 16,
          }}
        >
          <NavLandingPageCard
            text={t('labs.landing.card-feature-flags-title', 'Feature flags')}
            description={t(
              'labs.landing.card-feature-flags-desc',
              'Browse a curated set of feature toggles and apply browser-only overrides where supported.'
            )}
            url="/labs/feature-flags"
          />
        </section>
      </Page.Contents>
    </Page>
  );
}
