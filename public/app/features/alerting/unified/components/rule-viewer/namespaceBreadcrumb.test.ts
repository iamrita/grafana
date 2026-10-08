import { FolderDTO } from 'app/types/folders';

import { buildNamespaceBreadcrumb } from './RuleViewer';

describe('buildNamespaceBreadcrumb', () => {
  it('uses the fallback name when the folder is unknown', () => {
    expect(buildNamespaceBreadcrumb('Payments')).toMatchObject({
      text: 'Payments',
    });
  });

  it('nests ancestor folders with the nearest parent first', () => {
    const folder = {
      title: 'API',
      url: '/dashboards/f/api',
      parents: [
        { title: 'Company', uid: 'company', url: '/dashboards/f/company' },
        { title: 'Payments', uid: 'payments', url: '/dashboards/f/payments' },
      ],
    } as FolderDTO;

    const breadcrumb = buildNamespaceBreadcrumb('API', folder);

    expect(breadcrumb.text).toBe('API');
    expect(breadcrumb.parentItem?.text).toBe('Payments');
    expect(breadcrumb.parentItem?.parentItem?.text).toBe('Company');
    expect(breadcrumb.parentItem?.parentItem?.parentItem).toBeUndefined();
  });
});
