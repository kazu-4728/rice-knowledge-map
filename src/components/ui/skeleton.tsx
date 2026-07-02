import { cn } from "@/lib/utils";

/** shadcn/ui Skeleton（読み込み中プレースホルダ） */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
