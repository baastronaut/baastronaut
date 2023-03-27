import { Button } from '@mantine/core';
import Link from 'next/link';
import { useApiToken } from 'src/hooks';
import { Routes } from 'utils/constants';

interface Props {
  workspaceId?: number;
  projectId?: number;
  onClick?: () => void;
}

const ProjectApiLink = ({ workspaceId, projectId, onClick }: Props) => {
  const canFetchApiToken = !!workspaceId?.toString() && !!projectId?.toString();

  const { apiToken } = useApiToken(
    { projectId: projectId || 0, workspaceId: workspaceId || 0 },
    { enabled: canFetchApiToken },
  );

  if (!apiToken) return null;

  return (
    <Link
      href={{
        pathname: Routes.PROJECT_DOCS,
        query: { projectId, workspaceId },
      }}
      passHref
      legacyBehavior
    >
      <Button variant="subtle" component="a" onClick={onClick}>
        View API Docs
      </Button>
    </Link>
  );
};

export default ProjectApiLink;
