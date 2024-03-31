// bun run --watch servePort.tsx
// bun --hot servePort.tsx

import { serve, file } from "bun";

const port = 8000;

serve({
  port: port,

  fetch(request) {
    console.log(`Accessed http://localhost:${port}/`);

    return new Response(file(import.meta.dir + "/src/index.html"));
  },
});
