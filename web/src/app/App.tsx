import WeeklyView from "./components/WeeklyView";
import Header from "./components/Header";
import { Separator } from "@/shared/components/ui/separator";

function App() {
  return (
    <div dir="rtl" className="h-screen flex flex-col p-1 bg-background">
      <Header className="z-10" />
      <Separator className="my-1" />
      <WeeklyView className="flex-1" />
    </div>
  );
}

export default App;
