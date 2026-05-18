export type BadgeToastDetail = {
  title: string;
  desc: string;
};

export function showBadgeToast(detail: BadgeToastDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("badge-toast", { detail }));
}
