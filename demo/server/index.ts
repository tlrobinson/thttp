import http from "http";
import { resource, server } from "../../server";

const users: { [key: string]: { id: number; name: string } } = {
  0: { id: 0, name: "Alice" },
};
let nextUserId = 1;

const user = resource()
  .get(({ id }: { id: string }) => {
    if (!users[id]) {
      throw new Error("Not found");
    }
    return users[id];
  })
  .post(async ({ name }: { name: string }) => {
    const user = { id: nextUserId++, name };
    users[user.id] = user;
    return user;
  })
  .put(async (user: { id: number; name: string }) => {
    users[user.id] = user;
    return user;
  })
  .delete(() => ({}));

// Alternatively:

// const user = resource({
//   get({ name }: { name: string }) {
//     return { name };
//   },
// });

const api = server({
  user,
});

export type Api = typeof api;

http.createServer(api.handle).listen(process.env.PORT || 3000);
