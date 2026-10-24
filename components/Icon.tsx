import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

/**
 * Renders a Font Awesome icon as inline SVG. Sized by the surrounding font-size
 * (so `text-xl` etc. still work) and colored with `currentColor`.
 * No icon font, no CSS file and no client JS are shipped.
 */
export default function Icon({
  icon,
  className = "",
  title,
}: {
  icon: IconDefinition;
  className?: string;
  title?: string;
}) {
  const [width, height, , , path] = icon.icon;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={`inline-block h-[1em] overflow-visible align-[-0.125em] ${className}`}
      style={{ width: `${width / height}em` }}
    >
      {title && <title>{title}</title>}
      {typeof path === "string" ? <path d={path} /> : path.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
