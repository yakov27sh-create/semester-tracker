import { useQuery } from "@tanstack/react-query";

import { ScrollArea } from "@/shared/components/ui/scroll-area";

import type { ResourceMeta } from "@/entities/user-course/types";
import { useResourceSignedUrlsQO } from "../hooks";

type ScrollListProps = {
  resources: ResourceMeta[];
};

function ResourceList(props: ScrollListProps) {
  const storagePaths = props.resources
    .map((r) => r.storagePath)
    .filter((p): p is string => !!p);
  const { data: signedUrls } = useQuery(useResourceSignedUrlsQO(storagePaths));

  if (props.resources.length === 0) {
    return <p className="text-muted-foreground text-xs p-1 self-center">אין קבצים</p>;
  }

  return (
    <ScrollArea className="w-full max-w-xs self-center h-full">
      <div className="flex flex-col gap-1 mt-2">
        {props.resources.map((r) => {
          // Uploaded files resolve through the signed-url map; external
          // links (no storagePath) already carry their own url.
          const href = r.storagePath ? signedUrls?.[r.storagePath] : r.url;
          return (
            <div key={r.storagePath ?? r.url} className="p-1 text-xs truncate">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {r.title}
                </a>
              ) : (
                <span className="text-muted-foreground">{r.title}</span>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default ResourceList;
