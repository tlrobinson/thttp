import React from "react";
import ReactDOM from "react-dom";
import { useQuery, QueryClientProvider, QueryClient } from "react-query";

import { createClient } from "../../client";
import type { Api } from "../server";

const queryClient = new QueryClient();
const api = createClient<Api>(["/api"]);

api.user.delete();

function App() {
  const { data } = useQuery(["user", 0], () => api.user.get({ id: "0" }));
  const { data: data2 } = api.user.get.useQuery({ id: "0" });
  console.log("data", data);
  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
      <pre>{JSON.stringify(data2)}</pre>
    </div>
  );
}

ReactDOM.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById("root")
);
