import { permanentRedirect } from "next/navigation";

export default async function BlogsRedirectPage() {
  permanentRedirect("/stories");
}
