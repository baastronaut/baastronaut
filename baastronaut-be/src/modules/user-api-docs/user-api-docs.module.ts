import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { USER_APIS_ROOT_PATH } from '../../utils/constants';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';
import { ProjectsModule } from '../projects/projects.module';
import { createProxy } from '../proxy/create-proxy-helpers';
import { ProxyService } from '../proxy/proxy.service';
import {
  IS_READONLY_API_USER_HEADER,
  UserApiDocsController,
} from './user-api-docs.controller';

function removeModifyingMethodsFromDocs(docsJson: any) {
  if (!docsJson?.paths || typeof docsJson?.paths !== 'object') {
    return;
  }

  Object.keys(docsJson.paths).forEach((endpoint: string) => {
    const endpointDetails = docsJson.paths[endpoint];
    if (!endpointDetails || typeof endpointDetails !== 'object') {
      return;
    }
    Object.keys(endpointDetails).forEach((method: string) => {
      if (method.toLowerCase() !== 'get') {
        delete endpointDetails[method];
      }
    });
  });
}

function createProxyServerWithCustomRespHandling(config: {
  target: string;
  docsHost: string;
}) {
  const { target, docsHost } = config;

  const proxy = createProxy({
    target,
    selfHandleResponseFunc: function (proxyRes, req, body, res) {
      Object.keys(proxyRes.headers).forEach((header) =>
        res.setHeader(header, proxyRes.headers[header]!),
      );
      if (
        proxyRes.headers['content-type']
          ?.toLowerCase()
          .startsWith('application/openapi+json;')
      ) {
        let jsonBody = JSON.parse(Buffer.concat(body).toString());
        jsonBody.host = docsHost;
        jsonBody.basePath = USER_APIS_ROOT_PATH;
        if (req.headers[IS_READONLY_API_USER_HEADER] === 'true') {
          removeModifyingMethodsFromDocs(jsonBody);
        }
        res.end(JSON.stringify(jsonBody));
      } else {
        res.end(Buffer.concat(body).toString());
      }
    },
  });

  return proxy;
}

@Module({
  imports: [ProjectsModule, ApiTokensModule],
  providers: [
    {
      provide: 'PROXY_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const postgRESTUrl = configService.getOrThrow<string>('BAAS_PGRST_URL');
        const appUrl = configService.getOrThrow<string>('BAAS_APP_URL');
        const url = new URL(appUrl);

        return new ProxyService(
          createProxyServerWithCustomRespHandling({
            target: postgRESTUrl,
            docsHost: url.host,
          }),
        );
      },
    },
  ],
  controllers: [UserApiDocsController],
})
export class UserApiDocsModule {}
