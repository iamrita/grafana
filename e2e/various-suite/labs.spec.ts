import { e2e } from '../utils';

describe('Labs feature flags', () => {
  beforeEach(() => {
    e2e.flows.login(Cypress.env('USERNAME'), Cypress.env('PASSWORD'));
  });

  it('loads Labs page and lists feature flags from the registry', () => {
    e2e.pages.Labs.visit();
    e2e.pages.Labs.container().should('be.visible');
    cy.contains('Browser-only overrides').should('be.visible');
    cy.contains('adHocFilterDefaultValues', { timeout: 10000 }).should('be.visible');
  });

  it('filters flags by search', () => {
    e2e.pages.Labs.visit();
    cy.contains('adHocFilterDefaultValues', { timeout: 10000 }).should('be.visible');
    e2e.pages.Labs.search().should('be.visible').type('adHocFilterDefaultValues');
    e2e.pages.Labs.flagRow('adHocFilterDefaultValues').should('be.visible');
  });

  it('filters by GA stage', () => {
    e2e.pages.Labs.visit();
    cy.contains('alertingBulkActionsInUI', { timeout: 10000 }).should('exist');
    cy.get('label').contains('GA').click();
    cy.contains('alertingBulkActionsInUI').should('be.visible');
    e2e.pages.Labs.flagRow('adHocFilterDefaultValues').should('not.exist');
  });

  it('persists a toggle to localStorage', () => {
    cy.wrap(null).then(() => {
      window.localStorage.removeItem('grafana.featureToggles');
    });
    e2e.pages.Labs.visit();
    cy.contains('adHocFilterDefaultValues', { timeout: 10000 }).should('be.visible');
    e2e.pages.Labs.flagRow('adHocFilterDefaultValues').find('[role="switch"]').click();
    cy.window().its('localStorage').invoke('getItem', 'grafana.featureToggles').should('include', 'adHocFilterDefaultValues');
  });
});
