import { useEffect } from "react";
import { brand, seo } from "@/data/site";

interface PageMeta {
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
}

/**
 * Sets per-page <title>, meta description, Open Graph and canonical tags.
 * Uses real HOT PURSUIT branding; falls back to the site-wide defaults.
 * Runs client-side and is safe in both LTR/RTL languages.
 */
export function usePageMeta(meta: PageMeta = {}): void {
  useEffect(() => {
    const title = meta.title
      ? `${meta.title} | ${brand.name}`
      : seo.title;
    const description = meta.description ?? seo.description;
    const image = meta.image ?? seo.image;
    const url = meta.canonicalPath ? `${seo.url.replace(/\/$/, "")}${meta.canonicalPath}` : seo.url;

    const set = (selector: string, attr: string, value: string) => {
      const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(
        selector,
      );
      if (!el) return;
      el.setAttribute(attr, value);
    };
    const ensure = (tag: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(
        `${tag}[${attr}="${value}"]`,
      );
      if (!el) {
        el = document.createElement(tag) as HTMLMetaElement;
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      return el;
    };

    document.title = title;
    set('meta[name="description"]', "content", description);
    set('link[rel="canonical"]', "href", url);

    ensure("meta", "property", "og:title").setAttribute("content", title);
    ensure("meta", "property", "og:description").setAttribute("content", description);
    ensure("meta", "property", "og:site_name").setAttribute("content", seo.siteName);
    ensure("meta", "property", "og:type").setAttribute("content", "website");
    ensure("meta", "property", "og:url").setAttribute("content", url);
    ensure("meta", "property", "og:image").setAttribute("content", image);

    ensure("meta", "name", "twitter:card").setAttribute("content", seo.twitterCard);
    ensure("meta", "name", "twitter:title").setAttribute("content", title);
    ensure("meta", "name", "twitter:description").setAttribute("content", description);
    ensure("meta", "name", "twitter:image").setAttribute("content", image);

    ensure("meta", "name", "theme-color").setAttribute("content", seo.themeColor);
  }, [meta.title, meta.description, meta.canonicalPath, meta.image]);
}
