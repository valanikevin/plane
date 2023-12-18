import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
// constants
import { BaseListRoot } from "../base-list-root";
import { IProjectStore } from "store_legacy/project";
import { EProjectStore } from "store_legacy/command-palette.store";

export const ListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  if (!workspaceSlug || !projectId) return null;

  // store
  const { projectIssuesFilter: projectIssuesFilterStore, projectIssues: projectIssuesStore } = useMobxStore();

  const issueActions = {
    [EIssueActions.UPDATE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !projectId) return;

      await projectIssuesStore.updateIssue(workspaceSlug, projectId, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (group_by: string | null, issue: IIssue) => {
      if (!workspaceSlug || !projectId) return;

      await projectIssuesStore.removeIssue(workspaceSlug, projectId, issue.id);
    },
  };

  return (
    <BaseListRoot
      issueFilterStore={projectIssuesFilterStore}
      issueStore={projectIssuesStore}
      QuickActions={ProjectIssueQuickActions}
      issueActions={issueActions}
      currentStore={EProjectStore.PROJECT}
    />
  );
});
