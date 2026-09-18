import { useMemo } from 'react';

import { SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Select } from '@grafana/ui';

import { Annotation, annotationLabels } from '../../utils/constants';

interface Props {
  onChange: (value: string) => void;
  existingKeys: string[];
  value?: string;
  width?: number;
  className?: string;
  'aria-label'?: string;
}

const knownAnnotationKeys = Object.values(Annotation) as string[];

export function AnnotationKeyInput({
  value,
  existingKeys,
  'aria-label': ariaLabel,
  onChange,
  width,
  className,
}: Props) {
  const options = useMemo((): Array<SelectableValue<string>> => {
    const available = Object.values(Annotation)
      .filter((key) => !existingKeys.includes(key))
      .map((key) => ({ value: key, label: annotationLabels[key] }));

    if (value && !knownAnnotationKeys.includes(value) && !available.some((option) => option.value === value)) {
      return [...available, { value, label: value }];
    }

    return available;
  }, [existingKeys, value]);

  return (
    <Select
      aria-label={ariaLabel}
      width={width}
      className={className}
      options={options}
      value={value}
      allowCustomValue
      placeholder={t('alerting.annotation-key-input.placeholder', 'Select or enter an annotation name')}
      onChange={(option) => onChange(option?.value ?? '')}
    />
  );
}
