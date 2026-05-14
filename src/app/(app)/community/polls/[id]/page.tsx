import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PollDetailContainer } from "@/containers/community/poll-detail";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PollDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  return <PollDetailContainer pollId={id} />;
}
