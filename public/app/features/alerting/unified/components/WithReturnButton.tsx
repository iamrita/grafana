import { type JSX, cloneElement, useCallback } from 'react';

import { t } from '@grafana/i18n';
import { useReturnToPrevious } from '@grafana/runtime';

interface WithReturnButtonProps {
  component: JSX.Element;
  title?: string;
}

export const WithReturnButton = ({ component, title }: WithReturnButtonProps) => {
  const returnToPrevious = useReturnToPrevious();
  const returnTitle = title ?? t('alerting.with-return-button.previous-page', 'previous page');

  const returnToThisURL = useCallback(() => {
    returnToPrevious(returnTitle);
  }, [returnToPrevious, returnTitle]);

  return cloneElement(component, { onClick: returnToThisURL });
};
