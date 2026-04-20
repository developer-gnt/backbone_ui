import { API_BASE_URL } from "./axiosInstance";

const getBaseUrl = () => API_BASE_URL.replace(/\/+$/, "");

export const getAttachmentUrl = (filepath?: string | null) => {
  const rawPath = `${filepath ?? ""}`.trim();

  if (!rawPath) {
    return null;
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/\\/g, "/").replace(/^\/+/, "");

  const resolvedPath = rawPath.startsWith("/")
    ? `/${normalizedPath}`
    : /^\d+(\/|$)/.test(normalizedPath)
      ? `/uploads/orders/${normalizedPath}`
      : `/${normalizedPath}`;

  return `${getBaseUrl()}${resolvedPath}`;
};
