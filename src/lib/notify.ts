import { toast, ToastOptions, TypeOptions } from "react-toastify";

export function notify(
  message: string,
  type: TypeOptions = "default",
  options?: ToastOptions
) {
  toast(message, { type, ...options });
}

export const notifySuccess = (msg: string, options?: ToastOptions) =>
  notify(msg, "success", options);
export const notifyError = (msg: string, options?: ToastOptions) =>
  notify(msg, "error", options);
export const notifyInfo = (msg: string, options?: ToastOptions) =>
  notify(msg, "info", options);
export const notifyWarning = (msg: string, options?: ToastOptions) =>
  notify(msg, "warning", options);
