import { Request as ExpressRequest } from 'express';

export function getQueryPart(req: ExpressRequest): string {
  const queryDelimiterIndex = req.url.indexOf('?');
  return queryDelimiterIndex > -1
    ? `${req.url.substring(queryDelimiterIndex)}`
    : '';
}
