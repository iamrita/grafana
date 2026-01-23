import { from, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AnnotationEvent, DataSourceApi } from '@grafana/data';
import { createMonitoringLogger } from '@grafana/runtime';
import { shouldUseLegacyRunner } from 'app/features/annotations/standardAnnotationSupport';

import { AnnotationQueryRunner, AnnotationQueryRunnerOptions } from './types';
import { handleAnnotationQueryRunnerError } from './utils';

const logger = createMonitoringLogger('query.state.legacyannotationqueryrunner');

export class LegacyAnnotationQueryRunner implements AnnotationQueryRunner {
  canRun(datasource?: DataSourceApi): boolean {
    if (!datasource) {
      return false;
    }

    if (shouldUseLegacyRunner(datasource)) {
      return true;
    }

    return Boolean(datasource.annotationQuery && !datasource.annotations);
  }

  run({ annotation, datasource, dashboard, range }: AnnotationQueryRunnerOptions): Observable<AnnotationEvent[]> {
    if (!this.canRun(datasource)) {
      return of([]);
    }

    if (datasource?.annotationQuery === undefined) {
      logger.logWarning('Datasource does not have an annotation query', {
        datasourceName: datasource?.name,
        datasourceType: datasource?.type,
      });
      return of([]);
    }

    const annotationQuery = datasource.annotationQuery({ range, rangeRaw: range.raw, annotation, dashboard });
    if (annotationQuery === undefined) {
      logger.logWarning('Annotation query returned undefined', {
        datasourceName: datasource?.name,
        datasourceType: datasource?.type,
      });
      return of([]);
    }

    return from(annotationQuery).pipe(catchError(handleAnnotationQueryRunnerError));
  }
}
