import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useAddResourceMO, useDeleteResourceMO, useEditResourceMO } from "../hooks";
import type { ResourceDraft, ResourceMeta } from "@/entities/resource/types";

type ResourceMode = "file" | "link";

// Strips the "{uuid}-" prefix add_user_course_resource/useAddResourceMO puts
// in front of the original filename when it builds a storagePath.
function fileNameFromStoragePath(storagePath: string): string {
  const fileName = storagePath.split("/").pop() ?? storagePath;
  return fileName.replace(/^[0-9a-f-]{36}-/, "");
}

type ResourceFormFieldsProps = {
  title: string | null;
  setTitle: (title: string) => void;
  mode: ResourceMode;
  setMode: (mode: ResourceMode) => void;
  setFile: (file: File | null) => void;
  url: string;
  setUrl: (url: string) => void;
  /** Shown under the file input while in file mode and no new file has been picked yet. */
  currentFileName?: string;
};

function ResourceFormFields({
  title,
  setTitle,
  mode,
  setMode,
  setFile,
  url,
  setUrl,
  currentFileName,
}: ResourceFormFieldsProps) {
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="title">כותרת</Label>
        <Input
          id="title"
          className="col-span-2 h-8"
          value={title ?? ""}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>סוג</Label>
        <div className="col-span-2 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "file" ? "default" : "outline"}
            className="h-8 flex-1"
            onClick={() => setMode("file")}
          >
            קובץ
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "link" ? "default" : "outline"}
            className="h-8 flex-1"
            onClick={() => setMode("link")}
          >
            קישור
          </Button>
        </div>
      </div>
      {mode === "file" ? (
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="file">קובץ</Label>
          <div className="col-span-2 flex flex-col gap-1">
            <Input
              key="file"
              id="file"
              type="file"
              className="h-8"
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null;
                setFile(picked);
                // Default an empty title to the file's name (sans extension).
                if (picked && !title?.trim()) {
                  setTitle(picked.name.replace(/\.[^.]+$/, "") || picked.name);
                }
              }}
            />
            {currentFileName && (
              <p className="text-muted-foreground truncate text-xs">
                {`קובץ נוכחי: ${currentFileName}`}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="url">קישור</Label>
          <Input
            key="url"
            id="url"
            type="url"
            placeholder="https://"
            className="col-span-2 h-8"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

function AddResourcePopover({
  onToggle,
  courseId,
  resourceMeta,
}: {
  onToggle?: () => void;
  onSubmit?: () => void;
  courseId: string;
  resourceMeta: Omit<ResourceDraft, "title">;
}) {
  const [mode, setMode] = useState<ResourceMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string | null>(null);
  const addResourceTrigger = useMutation(useAddResourceMO());

  const resource = mode === "file" ? file : url.trim();
  const canSubmit = Boolean(title && resource);

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
      <PopoverContent dir="rtl" className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">העלה קובץ או קישור</p>
          </div>
          <ResourceFormFields
            title={title}
            setTitle={setTitle}
            mode={mode}
            setMode={setMode}
            setFile={setFile}
            url={url}
            setUrl={setUrl}
          />
          <Button
            variant="outline"
            disabled={addResourceTrigger.isPending || !canSubmit}
            onClick={() => {
              if (!resource || !title) return;
              addResourceTrigger.mutate(
                {
                  courseId: courseId,
                  resource: resource,
                  resourceMeta: { ...resourceMeta, title: title },
                },
                {
                  onSuccess: () => {
                    setFile(null);
                    setUrl("");
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
      </PopoverContent>
    </Popover>
  );
}

function EditResourcePopover({
  resource,
  children,
}: {
  resource: ResourceMeta;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ResourceMode>(resource.storagePath ? "file" : "link");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>(resource.storagePath ? "" : (resource.url ?? ""));
  const [title, setTitle] = useState<string | null>(resource.title);
  const editResourceTrigger = useMutation(useEditResourceMO());
  const deleteResourceTrigger = useMutation(useDeleteResourceMO());

  // null (file mode, nothing newly picked) means "keep the existing file/link".
  const newResource = mode === "file" ? file : url.trim();
  const canSubmit = Boolean(title) && (mode === "link" ? url.trim().length > 0 : true);
  const isPending = editResourceTrigger.isPending || deleteResourceTrigger.isPending;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent dir="rtl" className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">ערוך משאב</p>
          </div>
          <ResourceFormFields
            title={title}
            setTitle={setTitle}
            mode={mode}
            setMode={setMode}
            setFile={setFile}
            url={url}
            setUrl={setUrl}
            currentFileName={
              mode === "file" && !file && resource.storagePath
                ? fileNameFromStoragePath(resource.storagePath)
                : undefined
            }
          />
          <Button
            variant="outline"
            disabled={isPending || !canSubmit}
            onClick={() => {
              if (!title) return;
              editResourceTrigger.mutate(
                {
                  oldResource: resource,
                  resource: newResource || null,
                  resourceMeta: {
                    title,
                    sessionType: resource.sessionType,
                    week: resource.week,
                    timeSlots: resource.timeSlots,
                  },
                },
                { onSuccess: () => setOpen(false) },
              );
            }}
          >
            <SaveIcon />
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              deleteResourceTrigger.mutate(
                { resource },
                { onSuccess: () => setOpen(false) },
              );
            }}
          >
            <Trash2Icon />
            מחק
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AddResourcePopover;
export { EditResourcePopover };
