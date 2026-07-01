import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Autumn & Alma — First Foods",
    short_name: "First Foods",
    description:
      "A calm, simple way to introduce solids to Autumn and Alma, and track their days.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ecdf",
    theme_color: "#f3ecdf",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
