import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AetherApp from "./components/AetherApp";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AetherApp />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
