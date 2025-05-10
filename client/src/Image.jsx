export default function Image({ src, alt, className }) {
  // If src is relative (i.e. starts with "/uploads/"),
  // build the full URL with "http://localhost:5000".
  let finalSrc = src;
  if (src && src.startsWith("/uploads/")) {
    finalSrc = `http://localhost:5000${src}`;
  }

  return <img className={className} src={finalSrc} alt={alt || ""} />;
}
