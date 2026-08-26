import { PlusIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useAddResourceMO } from "../hooks";
import type { ResourceMeta } from "@/entities/user-course/types";
import { useState } from "react";

function AddResourcePopover({
  onToggle,
  courseId,
  resourceMeta,
}: {
  onToggle?: () => void;
  onSubmit?: () => void;
  courseId: string;
  resourceMeta: Omit<ResourceMeta, "title" | "url" | "storagePath">;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const addResourceTrigger = useMutation(useAddResourceMO());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-full self-center"
          onClick={() => onToggle && onToggle()}
        >
          <PlusIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">העלה קובץ או קישור</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">כותרת</Label>
              <Input
                id="width"
                className="col-span-2 h-8"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">קובץ</Label>
              <Input
                type="file"
                className="col-span-2 h-8"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
              />
            </div>
            <Button
              variant="outline"
              disabled={addResourceTrigger.isPending}
              onClick={() => {
                if (!file || !title) return;
                addResourceTrigger.mutate(
                  {
                    courseId: courseId,
                    resource: file,
                    resourceMeta: { ...resourceMeta, title: title },
                  },
                  {
                    onSuccess: () => {
                      setFile(null);
                      setTitle(null);
                      onToggle?.();
                    },
                  },
                );
              }}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AddResourcePopover;
