import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";

import { useSemesterContext } from "@/entities/semester/SemesterContext";
import { useState } from "react";

function SemesterSearchBar() {
  const { semesters, selectedSemesterId, setSelectedSemesterId } =
    useSemesterContext();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}>
          {semesters.find((s) => s.id === selectedSemesterId)?.name ??
            "בחר סמסטר"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command dir="rtl">
          <CommandList>
            <CommandEmpty>{"אין סמסטרים"}</CommandEmpty>
            <CommandGroup>
              {semesters.map((semester) => (
                <CommandItem
                  key={semester.id}
                  value={semester.name}
                  onSelect={() => {
                    setSelectedSemesterId(semester.id);
                    setOpen(false);
                  }}
                >
                  {semester.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      semester.id === selectedSemesterId
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SemesterSearchBar;
