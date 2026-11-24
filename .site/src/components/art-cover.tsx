// Статичная обложка художественного направления (WebP 960×600 в public/art-direction/<slug>.webp).
// Серверный компонент без JavaScript: отдаёт настоящий <img> с SEO alt-text и подписью произведения искусства.
export function ArtCover({
  slug,
  alt,
  artwork,
  priority = false,
  className = "",
  showCaption = false,
}: {
  slug: string;
  alt: string;
  artwork?: string;
  priority?: boolean;
  className?: string;
  showCaption?: boolean;
}) {
  const img = (
    <img
      src={`/art-direction/${slug}.webp`}
      alt={alt}
      width={960}
      height={600}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className="block aspect-[16/10] w-full object-cover"
    />
  );

  if (showCaption && artwork) {
    return (
      <figure className={`overflow-hidden ${className}`}>
        {img}
        <figcaption className="border-t bg-card px-4 py-2.5 text-center text-xs text-muted-foreground">
          Референс: {artwork}
        </figcaption>
      </figure>
    );
  }

  return <div className={`overflow-hidden bg-muted ${className}`}>{img}</div>;
}
