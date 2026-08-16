import { permanentRedirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogSlugRedirectPage({ params }: Props) {
  const { slug } = await params;
  permanentRedirect(`/stories/${slug}`);
}
