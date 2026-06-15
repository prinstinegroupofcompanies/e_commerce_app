import fs from "node:fs";
import path from "node:path";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Media library" };

function readPublicAssets() {
  const dir = path.join(process.cwd(), "public");
  if (!fs.existsSync(dir)) return [];
  const exts = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]);
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    /** @type {{ url: string; name: string; size: number; modifiedAt: Date }[]} */
    const found = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        found.push(...walk(full));
      } else if (exts.has(path.extname(entry.name).toLowerCase())) {
        const stat = fs.statSync(full);
        const rel = "/" + path.relative(dir, full).replace(/\\/g, "/");
        found.push({ url: rel, name: entry.name, size: stat.size, modifiedAt: stat.mtime });
      }
    }
    return found;
  }
  return walk(dir).sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}

export default async function AdminMediaPage() {
  await auth();
  const files = readPublicAssets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media library</h1>
        <p className="text-sm text-muted-foreground">
          Static assets served from <code className="font-mono">/public</code>. Drop new images into the folder to add
          them.
        </p>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No images found in /public.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((f) => (
            <Card key={f.url} className="overflow-hidden">
              <div className="flex h-32 items-center justify-center bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} className="max-h-32 max-w-full object-contain" />
              </div>
              <CardHeader className="space-y-1 p-3">
                <CardTitle className="truncate text-sm" title={f.name}>{f.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
                <p className="truncate font-mono text-[10px] text-muted-foreground" title={f.url}>{f.url}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
