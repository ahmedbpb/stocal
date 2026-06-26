import { requireModerator } from "@/lib/auth/require-moderator";
import ModeratorDashboard from "./ModeratorDashboard";

export default async function ModeratorPage() {
  await requireModerator();
  return <ModeratorDashboard />;
}
