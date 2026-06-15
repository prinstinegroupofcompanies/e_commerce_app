export function ModulePlaceholder({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {description ||
          "This module is scaffolded. Wire forms to API routes and Prisma following the ShopLIB specification."}
      </p>
    </div>
  );
}
