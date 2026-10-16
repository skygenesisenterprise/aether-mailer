import { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import type {
  CreateRootTypes,
  Procedure,
  ProcedureType,
  Router,
  RouterRecord,
} from '@trpc/server/unstable-core-do-not-import';
import { IncomingMessage } from 'http';
import type { ZodObject } from 'zod';
import type { $ZodIssue } from 'zod/v4/core';

export { type OpenAPIObject, type SecuritySchemeObject } from 'openapi3-ts/oas31';

export type OpenApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type TRPCMeta = Record<string, unknown>;

export type OpenApiContentType =
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

export type OpenApiMeta<TMeta = TRPCMeta> = TMeta & {
  openapi?: {
    /** When true, use only the openapi object provided (no defaults). */
    override?: boolean;
    /** When true, merge provided openapi with defaults (defaults first, then provided). */
    additional?: boolean;
    enabled?: boolean;
    /** HTTP method. Auto-generated from procedure type (query→GET, mutation→POST) when omitted. */
    method?: OpenApiMethod;
    /** URL path. Auto-generated as /{routerName}.{procedureName} when omitted. */
    path?: `/${string}`;
    operationId?: string;
    summary?: string;
    description?: string;
    protect?: boolean;
    tags?: string[];
    contentTypes?: OpenApiContentType[];
    deprecated?: boolean;
    requestHeaders?: ZodObject;
    responseHeaders?: ZodObject;
    successDescription?: string;
    errorResponses?: number[] | Record<number, string>;
  };
};

/**
 * Internal resolved type where method and path are guaranteed after merging with defaults.
 * Used internally after forEachOpenApiProcedure resolves auto-generated defaults.
 */
export type ResolvedOpenApiMeta = Required<Pick<NonNullable<OpenApiMeta['openapi']>, 'method' | 'path'>> &
  NonNullable<OpenApiMeta['openapi']>;

export type OpenApiProcedure = Procedure<
  ProcedureType,
  {
    input: any;
    output: any;
    meta: TRPCMeta;
  }
>;

export type OpenApiProcedureRecord = Record<string, OpenApiProcedure | RouterRecord>;

export type OpenApiRouter = Router<
  CreateRootTypes<{
    ctx: any;
    meta: TRPCMeta;
    errorShape: any;
    transformer: any;
  }>,
  RouterRecord
>;

export type OpenApiSuccessResponse<D = any> = D;

export interface OpenApiErrorResponse {
  message: string;
  code: TRPC_ERROR_CODE_KEY;
  issues?: $ZodIssue[];
}

export type OpenApiResponse<D = any> = OpenApiSuccessResponse<D> | OpenApiErrorResponse;

export type NodeHTTPRequest = IncomingMessage & {
  body?: unknown;
  query?: unknown;
};
