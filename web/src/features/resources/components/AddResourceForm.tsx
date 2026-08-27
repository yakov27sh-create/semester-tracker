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

type ResourceMode = "file" | "link";

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
  const [mode, setMode] = useState<ResourceMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string | null>(null);
  const addResourceTrigger = useMutation(useAddResourceMO());

  const resource = mode === "file" ? file : url.trim() || null;

  const resetForm = () => {
    setFile(null);
    setUrl("");
    setTitle(null);
  };

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
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "file" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => {
                setMode("file");
                setUrl("");
              }}
            >
              קובץ
            </Button>
            <Button
              type="button"
              variant={mode === "link" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => {
                setMode("link");
                setFile(null);
              }}
            >
              קישור
            </Button>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="title">כותרת</Label>
              <Input
                id="title"
                className="col-span-2 h-8"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {mode === "file" ? (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="file">קובץ</Label>
                <Input
                  id="file"
                  type="file"
                  className="col-span-2 h-8"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="url">קישור</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://"
                  className="col-span-2 h-8"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            )}
            <Button
              variant="outline"
              disabled={addResourceTrigger.isPending}
              onClick={() => {
                if (!resource || !title) return;
                addResourceTrigger.mutate(
                  {
                    courseId: courseId,
                    resource,
                    resourceMeta: { ...resourceMeta, title: title },
                  },
                  {
                    onSuccess: () => {
                      resetForm();
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
