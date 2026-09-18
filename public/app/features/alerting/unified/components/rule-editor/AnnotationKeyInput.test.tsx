import { selectOptionInTest } from 'test/helpers/selectOptionInTest';
import { render, screen } from 'test/test-utils';

import { selectors } from '@grafana/e2e-selectors';

import { Annotation } from '../../utils/constants';

import { AnnotationKeyInput } from './AnnotationKeyInput';

describe('AnnotationKeyInput', () => {
  it('lets the user pick a known annotation key', async () => {
    const onChange = jest.fn();
    render(
      <AnnotationKeyInput
        value=""
        existingKeys={[Annotation.summary]}
        onChange={onChange}
        aria-label="Annotation name"
      />
    );

    await selectOptionInTest(screen.getByLabelText('Annotation name'), 'Description');

    expect(onChange).toHaveBeenCalledWith(Annotation.description);
  });

  it('hides annotation keys that are already in use', async () => {
    const { user } = render(
      <AnnotationKeyInput
        value=""
        existingKeys={[Annotation.summary, Annotation.description]}
        onChange={jest.fn()}
        aria-label="Annotation name"
      />
    );

    await user.click(screen.getByLabelText('Annotation name'));

    expect(screen.getByText('Runbook URL')).toBeInTheDocument();
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('accepts a custom annotation name without a + Add new option', async () => {
    const onChange = jest.fn();
    const { user } = render(
      <AnnotationKeyInput value="" existingKeys={[]} onChange={onChange} aria-label="Annotation name" />
    );

    const input = screen.getByLabelText('Annotation name');
    await user.click(input);
    await user.type(input, 'owner');

    expect(screen.queryByText('+ Add new')).not.toBeInTheDocument();

    await user.click(screen.getByTestId(selectors.components.Select.option));

    expect(onChange).toHaveBeenCalledWith('owner');
  });

  it('shows the current custom value as the selected option', () => {
    render(<AnnotationKeyInput value="owner" existingKeys={[]} onChange={jest.fn()} aria-label="Annotation name" />);

    expect(screen.getByText('owner')).toBeInTheDocument();
  });
});
