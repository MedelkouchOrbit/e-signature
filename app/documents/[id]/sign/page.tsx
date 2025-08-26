import { DocumentSignPage } from "./DocumentSignPage"

export default function Page({ params }: { params: { id: string } }) {
  return <DocumentSignPage documentId={params.id} />
}
