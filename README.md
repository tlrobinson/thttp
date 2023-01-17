# thttp

Type-safe full-stack APIs without code-generation. Heavily inspired by [tRPC](https://trpc.io/) but simplified and embraces REST.

## Usage

### server.ts

    import { resource, server } from "thttp/server";
    import http from "http";

    const api = server({
      user: resource()
        .get(({ name }: { name: string }) => ({ uppercased: name.toUpperCase() }))
    });

    export type Api = typeof api;

    api.listen(process.env.PORT || 3000);

### client.tsx

    // Standalone:

    import { createClient } from "thttp/client";
    import type { Api } from "./server";

    const api = createClient<Api>(["/api"]);

    api.user.get({ name: "foo" }).then(user => console.log(user))

    // ReactQuery:

    import React from "react";
    import ReactDOM from "react-dom";
    import { useQuery, QueryClientProvider, QueryClient } from "react-query";

    function App() {
      const { data } = api.user.get.useQuery({ name: "foo" });
      return <pre>{JSON.stringify(data)}</pre>;
    }

    const queryClient = new QueryClient();
    ReactDOM.render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
      document.getElementById("root")
    );

## TODO

- Context
- Middleware
- Runtime input/ouput validation (`zod`, etc)
- Combine `server` and `resource` functions
- Rename method functions from `get` etc to `$get`
