import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { UserProvider } from "./entities/user/UserContext";
import { SemesterProvider } from "./entities/semester/SemesterContext";
import App from "./app/App";
import "./index.css";

const queryClient = new QueryClient();

const elem = document.getElementById("root")!;
const app = (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <SemesterProvider>
        <App />
      </SemesterProvider>
    </UserProvider>
  </QueryClientProvider>
);

// https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
