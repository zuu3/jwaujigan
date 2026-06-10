import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsDistrictContainer } from "@/containers/settings/district";

export default async function SettingsDistrictPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }
  return <SettingsDistrictContainer />;
}
