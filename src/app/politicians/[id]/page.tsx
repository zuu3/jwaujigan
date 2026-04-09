import { notFound } from "next/navigation";
import { getPoliticianDetailById } from "@/lib/assembly";
import { PoliticianDetailContainer } from "@/containers/politician-detail";

export default async function PoliticianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const politician = await getPoliticianDetailById(id);

  if (!politician) {
    notFound();
  }

  return <PoliticianDetailContainer politician={politician} />;
}
