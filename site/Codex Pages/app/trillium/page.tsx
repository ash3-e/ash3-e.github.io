import { SubsidiaryPageView } from "@/components/subsidiary-page-view";
import { getPageChrome, getSubsidiaryContent } from "@/lib/content";

export default async function TrilliumPage() {
  const [page, chrome] = await Promise.all([getSubsidiaryContent("trillium"), getPageChrome()]);
  return <SubsidiaryPageView page={page} chrome={chrome} />;
}
