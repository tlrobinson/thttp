import type { Client, ClientArg } from "./server";
import qs from "querystring";
import { useQuery, UseQueryOptions } from "react-query";

export function createClient<T extends ClientArg>(
  path: string[] = [""]
): Client<T> {
  function request(path: string[], input: any) {
    let url = path.slice(0, -1).join("/");
    const method = path[path.length - 1];
    const options: RequestInit = { method };
    if (method === "get") {
      const query = qs.stringify(input);
      url += query ? "?" + query : "";
    } else {
      options.body = JSON.stringify(input);
    }
    return fetch(url, options).then((res) => res.json());
  }

  function query(input: any, options: UseQueryOptions) {
    const p = path.slice(0, -1);
    return useQuery([...p, input], () => request(p, input), options as any);
  }

  return new Proxy((() => {}) as any, {
    get: (target, key: string, proxy) => {
      return createClient([...path, key]);
    },
    apply(target, thisArg, [input, options]) {
      if (path[path.length - 1] === "useQuery") {
        return query(input, options);
      } else {
        return request(path, input);
      }
    },
  });
}
