import { HttpResponse, http } from 'msw';

import { grafanaRulerNamespace } from 'app/features/alerting/unified/mocks/grafanaRulerApi';
import { DashboardSearchHit, DashboardSearchItemType } from 'app/features/search/types';

export const FOLDER_TITLE_HAPPY_PATH = 'Folder A';

const createSearchHit = (
  hit: Partial<DashboardSearchHit> & Pick<DashboardSearchHit, 'title' | 'uid'>
): DashboardSearchHit => ({
  tags: [],
  type: DashboardSearchItemType.DashFolder,
  url: `/dashboards/f/${hit.uid}`,
  ...hit,
});

export const defaultSearchResponse: DashboardSearchHit[] = [
  createSearchHit({
    title: FOLDER_TITLE_HAPPY_PATH,
    uid: grafanaRulerNamespace.uid,
    id: 1,
    type: DashboardSearchItemType.DashFolder,
  }),
  createSearchHit({
    title: 'Folder B',
    uid: 'folder-b',
    id: 2,
    type: DashboardSearchItemType.DashFolder,
  }),
  createSearchHit({
    title: 'Folder / with slash',
    uid: 'b',
    id: 3,
    type: DashboardSearchItemType.DashFolder,
  }),
];

const filterSearchHits = (hits: DashboardSearchHit[], requestUrl: string) => {
  const url = new URL(requestUrl);
  const query = (url.searchParams.get('query') ?? '').toLowerCase();
  const types = url.searchParams.getAll('type');

  return hits.filter((hit) => {
    const matchesQuery = !query || hit.title.toLowerCase().includes(query);
    const matchesType = types.length === 0 || types.includes(hit.type);
    return matchesQuery && matchesType;
  });
};

export const searchHandler = (response = defaultSearchResponse) =>
  http.get(`/api/search`, ({ request }) => HttpResponse.json(filterSearchHits(response, request.url)));

/** @deprecated Move to or use inbuilt handlers from `@grafana/test-utils` instead */
const handlers = [searchHandler()];

export default handlers;
