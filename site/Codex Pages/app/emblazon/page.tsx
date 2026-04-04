import { SubsidiaryPageView } from "@/components/subsidiary-page-view";
import { getPageChrome, getSubsidiaryContent } from "@/lib/content";

export default async function EmblazonPage() {
  const [page, chrome] = await Promise.all([getSubsidiaryContent("emblazon"), getPageChrome()]);
  return <SubsidiaryPageView page={page} chrome={chrome} />;
}
