import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { useStyles2 } from '@grafana/ui';

import { AnnotationKeyInput } from './AnnotationKeyInput';

interface CustomAnnotationHeaderFieldProps {
  field: { onChange: (value: string) => void; onBlur: () => void; value: string; name: string };
  existingKeys: string[];
}

const CustomAnnotationHeaderField = ({ field, existingKeys }: CustomAnnotationHeaderFieldProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div>
      <span className={styles.annotationTitle}>
        <Trans i18nKey="alerting.custom-annotation-header-field.custom-annotation-name-and-content">
          Custom annotation name and content
        </Trans>
      </span>
      <div className={styles.customAnnotationInput}>
        <AnnotationKeyInput
          value={field.value}
          onChange={field.onChange}
          existingKeys={existingKeys}
          aria-label={t('alerting.custom-annotation-header-field.aria-label', 'Custom annotation name')}
        />
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  annotationTitle: css({
    color: theme.colors.text.primary,
    marginBottom: '3px',
  }),

  customAnnotationInput: css({
    marginTop: '5px',
    width: '100%',
  }),
});

export default CustomAnnotationHeaderField;
