import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { ClientRequest, IncomingMessage } from 'http';
import * as httpProxy from 'http-proxy';

export type ProxyConfig = {
  target: string;
  selfHandleResponseFunc?: (
    proxyRes: IncomingMessage,
    req: ExpressRequest,
    responseBody: Uint8Array[],
    res: ExpressResponse,
  ) => void;
};

/**
 * Returns a proxy that by default reads body data as JSON and passes on to the target server.
 * This is to work around issue of http-proxy request hanging when body is not empty as described here:
 * https://github.com/http-party/node-http-proxy/issues/180#issuecomment-3678160.
 */
export function createProxy(config: ProxyConfig) {
  const { target, selfHandleResponseFunc } = config;

  const proxy = httpProxy.createProxyServer({
    target: target,
    selfHandleResponse: !!selfHandleResponseFunc,
  });

  if (selfHandleResponseFunc) {
    proxy.on(
      'proxyRes',
      function (
        proxyRes: IncomingMessage,
        req: ExpressRequest,
        res: ExpressResponse,
      ) {
        const body: Uint8Array[] = [];
        proxyRes.on('data', function (chunk: Uint8Array) {
          body.push(chunk);
        });
        proxyRes.on('end', () =>
          selfHandleResponseFunc(proxyRes, req, body, res),
        );
      },
    );
  }

  // this part is the workaround
  proxy.on(
    'proxyReq',
    function (
      proxyReq: ClientRequest,
      req: ExpressRequest,
      res: ExpressResponse,
      options: httpProxy.ServerOptions,
    ) {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
  );

  return proxy;
}

/**
 * Returns true if the http method is one that modifies existing data.
 */
export function isHttpMethodThatModifiesExistingData(method: string): boolean {
  method = method.toLowerCase();
  return method === 'put' || method === 'patch' || method === 'delete';
}

/**
 * Returns true if the http method is one that writes data.
 */
export function isHttpMethodThatWritesData(method: string): boolean {
  method = method.toLowerCase();
  return (
    method === 'post' ||
    method === 'put' ||
    method === 'patch' ||
    method === 'delete'
  );
}
