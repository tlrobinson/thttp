import http from "http";
import url from "url";
// import type { useQuery, UseQueryResult } from "react-query";

type Handler<Input, Output> = (input: Input) => Output | Promise<Output>;
type Method<Input, Output> = Handler<Input, Output>;

class Resource<T extends { [key: string]: Method<any, any> }> {
  methods: T = {} as any;

  constructor(methods: T) {
    this.methods = methods;
  }

  post<Input, Output>(
    fn: (input: Input) => Output
  ): Resource<T & { post: Method<Input, Output> }> {
    (this.methods as any).post = fn;
    return this as any;
  }
  get<Input, Output>(
    fn: (input: Input) => Output
  ): Resource<T & { get: Method<Input, Output> }> {
    (this.methods as any).get = fn;
    return this as any;
  }
  put<Input, Output>(
    fn: (input: Input) => Output
  ): Resource<T & { put: Method<Input, Output> }> {
    (this.methods as any).put = fn;
    return this as any;
  }
  delete<Input, Output>(
    fn: (input: Input) => Output
  ): Resource<T & { delete: Method<Input, Output> }> {
    (this.methods as any).delete = fn;
    return this as any;
  }
}

export function resource<T extends { [key: string]: (input: any) => any }>(
  methods: T = {} as any
): HandlersToResource<T> {
  return new Resource(methods as any) as any;
}

type ResourceMap = { [key: string]: Resource<any> | ResourceMap };

class Server<T extends ResourceMap> {
  resources: T;

  constructor(resources: T) {
    this.resources = resources;
  }

  handle = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
      if (!req.url) {
        throw new Error("No URL");
      }
      const { pathname = "", query } = url.parse(req.url, true) || {};
      if (!pathname) {
        throw new Error("No pathname");
      }
      const components = pathname.split("/").filter(Boolean) || [];
      let resource: any = this.resources;
      for (const component of components) {
        resource = resource[component];
      }
      const method = req.method?.toLowerCase() as string;
      const handler = resource.methods[method];
      const input = method === "get" ? query : await this.getBody(req);
      const output = await handler(input);
      res.end(JSON.stringify(output));
    } catch (e) {
      console.warn(e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(e) }));
    }
  };

  async getBody(req: http.IncomingMessage) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString());
  }
}

export function server<T extends ResourceMap>(resources: T) {
  return new Server<T>(resources);
}

type ExtractMethods<T> = T extends Resource<infer M> ? M : never;
type ExtractInput<T> = T extends Method<infer I, any> ? I : never;
type ExtractOutput<T> = T extends Method<any, infer O> ? O : never;
type UnwrapPromise<T> = T extends Promise<infer M> ? M : T;

type HandlersToResource<T> = Resource<{
  [method in keyof T]: HandlerToMethod<T[method]>;
}>;
type HandlerToMethod<T> = Method<HandlerToInput<T>, HandlerToOutput<T>>;
type HandlerToInput<T> = T extends (input: infer I) => any ? I : never;
type HandlerToOutput<T> = T extends (input: any) => infer O ? O : never;

type ClientResource<T extends Resource<any>> = {
  [method in keyof ExtractMethods<T>]: ReactQueryFunctions<
    ExtractMethods<T>[method]
  > &
    ((
      input: ExtractInput<ExtractMethods<T>[method]>
    ) => Promise<UnwrapPromise<ExtractOutput<ExtractMethods<T>[method]>>>);
};

type UseQueryResult<T, S> = any;

type ReactQueryFunctions<T> = {
  useQuery: (
    input?: ExtractInput<T>,
    options?: any
  ) => UseQueryResult<ExtractOutput<T>, unknown>;
};

type ClientResourceMap<T extends ResourceMap> = {
  [method in keyof T]: Client<T[method]>;
};

export type ClientArg = Resource<any> | ResourceMap | Server<any>;

export type Client<T extends ClientArg> = T extends Server<infer R>
  ? Client<R>
  : T extends ResourceMap
  ? ClientResourceMap<T>
  : T extends Resource<any>
  ? ClientResource<T>
  : never;
