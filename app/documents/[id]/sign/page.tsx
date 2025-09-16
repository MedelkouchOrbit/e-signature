import { DocumentSignPage } from "./DocumentSignPage"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DocumentSignPage documentId={id} />
}
