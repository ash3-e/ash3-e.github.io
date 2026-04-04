import { SubsidiaryPageView } from "@/components/subsidiary-page-view";
import { getPageChrome, getSubsidiaryContent } from "@/lib/content";

export default async function GyrePage() {
  const [page, chrome] = await Promise.all([getSubsidiaryContent("gyre"), getPageChrome()]);
  return <SubsidiaryPageView page={page} chrome={chrome} />;
}
