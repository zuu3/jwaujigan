export type ToastDetail = {
  message: string;
  type?: "default" | "error" | "success";
};

export function showToast(message: string, type: ToastDetail["type"] = "default") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, type } }));
}
