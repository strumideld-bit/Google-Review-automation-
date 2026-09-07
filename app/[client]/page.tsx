import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import RatingGate from "@/components/RatingGate";

export default async function ClientPage({ params }: { params: { client: string } }) {
  const client = await getClient(params.client);
  if (!client) notFound();

  return <RatingGate client={client} />;
}
