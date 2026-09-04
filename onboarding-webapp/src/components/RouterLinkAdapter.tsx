import { forwardRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

// Astryx's `LinkComponentType` for LinkProvider/`as` props must accept
// href, className, style, children. React Router's <Link> takes `to`
// instead of `href`, so this adapter is the whole of the translation.
// useLinkComponent's wrapper (createLinkWithTo) also injects its own
// `to={href}` alongside `href` for `to`-based routers — it has to be
// dropped from `rest` here, or spreading `rest` after our own `to` would
// silently override it with the unmodified href.
//
// It also carries the current location's query string forward onto every
// in-app link: mock/auth.ts (and the real IDP session it stands in for)
// treats the URL as the source of truth for `?role=`/`?auth=out`, so a bare
// pathname href would silently drop the caller's identity on the first
// click and every request after it would run as the mock's default role.
export const RouterLinkAdapter = forwardRef<
  HTMLAnchorElement,
  { href: string; to?: string; className?: string; style?: CSSProperties; children?: ReactNode }
>(({ href, to: _to, ...rest }, ref) => {
  const location = useLocation();
  const to = href.includes("?") ? href : `${href}${location.search}`;
  return <RouterLink ref={ref} to={to} {...rest} />;
});
RouterLinkAdapter.displayName = "RouterLinkAdapter";
