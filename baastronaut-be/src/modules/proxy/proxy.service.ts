import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as httpProxy from 'http-proxy';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { getQueryPart } from '../../utils/url-helpers';
import {
  isHttpMethodThatModifiesExistingData,
  isHttpMethodThatWritesData,
} from './create-proxy-helpers';

/**
 * See https://postgrest.org/en/stable/admin.html#block-full-table-operations for why this is needed.
 */
function throwIfModifyingWithoutCondition(
  method: string,
  queryPart: string | null,
) {
  method = method.toLowerCase();
  if (
    (!method || isHttpMethodThatModifiesExistingData(method)) &&
    (!queryPart || queryPart === '?')
  ) {
    throw new BadRequestException(
      'Query parameter(s) must be specified for modifying operations.',
    );
  }
}

function throwIfNoBearerToken(authToken: string | undefined) {
  if (!authToken || !authToken.toLowerCase().startsWith('bearer ')) {
    throw new UnauthorizedException('Bearer token is not set in header');
  }
}

function setHeaders(req: ExpressRequest, schema: string) {
  const method = req.method.toLowerCase();
  // See https://postgrest.org/en/stable/api.html#switching-schemas.
  let schemaHeader = 'accept-profile';
  if (isHttpMethodThatWritesData(method)) {
    schemaHeader = 'content-profile';
  }
  req.headers[schemaHeader] = schema;

  if (!req.headers.prefer) {
    // https://postgrest.org/en/stable/api.html#insertions. To get the inserted data back in response.
    req.headers.prefer = 'return=representation';
  }
}

export type ProxyInput = {
  req: ExpressRequest;
  resp: ExpressResponse;
  schema: string;
};

export class ProxyService {
  constructor(private proxy: httpProxy) {}

  /**
   * Validates the request and set sensible headers before proxying to postgREST server.
   * Caller must set bearer token as this method will throw if it is not set.
   * 4xx error will be thrown if any validation fails.
   */
  proxyRequest(proxyInput: ProxyInput) {
    const { req, resp, schema } = proxyInput;

    const queryPart = getQueryPart(req);
    const method = req.method.toLowerCase();

    throwIfModifyingWithoutCondition(method, queryPart);
    throwIfNoBearerToken(req.headers.authorization);

    setHeaders(req, schema);

    this.proxy.web(req, resp);
  }
}
