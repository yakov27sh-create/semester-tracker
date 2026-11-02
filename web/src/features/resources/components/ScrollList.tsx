import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  FileArchiveIcon,
  FileAudioIcon,
  FileIcon,
  FileTextIcon,
  FileVideoIcon,
  ImageIcon,
  LinkIcon,
  type LucideIcon,
} from "lucide-react";

import { ScrollArea } from "@/shared/components/ui/scroll-area";

import type { ResourceMeta } from "@/entities/resource/types";
import { useResourceMimeTypesQO, useResourceSignedUrlsQO } from "../hooks";
import { EditResourcePopover } from "./AddResourceForm";

type ScrollListProps = {
  resources: ResourceMeta[];
  isEditMode: boolean;
};

// External links (no storagePath) get a link icon; uploaded files are
// matched by their Storage-reported mimeType, falling back to a generic
// file icon.
const VIDEO_LINK_HOSTS = ["youtube.com", "youtu.be", "panopto.com", "panopto.eu"];

function isVideoLink(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return VIDEO_LINK_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function getResourceIcon(resource: ResourceMeta, mimeType: string | undefined): LucideIcon {
  if (!resource.storagePath) return isVideoLink(resource.url) ? FileVideoIcon : LinkIcon;

  mimeType ??= "";
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return FileVideoIcon;
  if (mimeType.startsWith("audio/")) return FileAudioIcon;
  if (mimeType.startsWith("text/") || mimeType === "application/pdf") return FileTextIcon;
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return FileArchiveIcon;
  return FileIcon;
}

type ResourceItemProps = {
  resource: ResourceMeta;
  href: string | undefined;
  Icon: LucideIcon;
  isEditMode: boolean;
};

function ResourceItem({ resource, href, Icon, isEditMode }: ResourceItemProps) {
  const content = (
    <>
      <Icon strokeWidth={1.25} className={clsx("size-8 shrink-0", isEditMode && "text-primary")} />
      <span className="truncate w-full text-center">{resource.title}</span>
    </>
  );

  if (isEditMode) {
    return (
      <div className="p-1 text-xs flex flex-col items-center gap-1 min-w-0">
        <EditResourcePopover resource={resource}>
          <button
            type="button"
            className="flex cursor-pointer flex-col items-center gap-1 w-full min-w-0"
          >
            {content}
          </button>
        </EditResourcePopover>
      </div>
    );
  }

  return (
    <div className="p-1 text-xs flex flex-col items-center gap-1 min-w-0">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline flex flex-col items-center gap-1 w-full min-w-0"
        >
          {content}
        </a>
      ) : (
        <span className="text-muted-foreground flex flex-col items-center gap-1 w-full min-w-0">
          {content}
        </span>
      )}
    </div>
  );
}

function ResourceList(props: ScrollListProps) {
  const storagePaths = props.resources
    .map((r) => r.storagePath)
    .filter((p): p is string => !!p);
  const { data: signedUrls } = useQuery(useResourceSignedUrlsQO(storagePaths));
  const { data: mimeTypes } = useQuery(useResourceMimeTypesQO(storagePaths));

  if (props.resources.length === 0) {
    return <p className="text-muted-foreground text-xs p-1 self-center text-center">אין קבצים</p>;
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="grid grid-cols-3 gap-1 mt-2 p-1">
        {props.resources.map((r) => {
          // Uploaded files resolve through the signed-url map; external
          // links (no storagePath) already carry their own url.
          const href = r.storagePath ? signedUrls?.[r.storagePath] : r.url;
          const Icon = getResourceIcon(r, r.storagePath ? mimeTypes?.[r.storagePath] : undefined);
          return (
            <ResourceItem
              key={r.id}
              resource={r}
              href={href}
              Icon={Icon}
              isEditMode={props.isEditMode}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default ResourceList;
