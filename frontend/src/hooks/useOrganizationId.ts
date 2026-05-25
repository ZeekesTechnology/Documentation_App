import { useParams, useLocation } from "react-router-dom";

/** Current organization id when viewing an org or any of its sub-pages. */
export function useOrganizationId(): string | null {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();

  if (id && id !== "new") {
    return id;
  }

  const match = location.pathname.match(/^\/organizations\/([^/]+)/);
  const fromPath = match?.[1];
  return fromPath && fromPath !== "new" ? fromPath : null;
}
