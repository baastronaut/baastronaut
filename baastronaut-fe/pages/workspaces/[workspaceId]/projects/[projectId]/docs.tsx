import { Alert, LoadingOverlay } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { ProjectApiDocsView } from 'src/views';
import { ApiClient } from 'client/api-client';
import { useAuth } from 'components/auth/AuthProvider';

function toInteger(val: string | string[] | undefined): number | null {
  if (val && typeof val === 'string' && /^\d+$/.test(val)) {
    return parseInt(val);
  }
  return null;
}

const Project = () => {
  const router = useRouter();
  const { user, auth } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<number | undefined>();
  const [projectId, setProjectId] = useState<number | undefined>();
  const [isReady, setIsReady] = useState(false);

  const apiClientRef = useRef<ApiClient>();

  useEffect(() => {
    apiClientRef.current = new ApiClient(user!.token);
  }, []);

  useEffect(() => {
    setIsReady(router.isReady);

    if (!router.isReady) {
      return;
    }

    const { workspaceId: workspaceIdQp, projectId: projectIdQp } = router.query;

    const workspaceIdInt = toInteger(workspaceIdQp);
    const projectIdInt = toInteger(projectIdQp);

    if (workspaceIdInt && projectIdInt) {
      setWorkspaceId(workspaceIdInt);
      setProjectId(projectIdInt);
      auth.setCurrentWorkspace(workspaceIdInt, true);
    }
  }, [router.isReady]);

  if (!isReady) {
    return <LoadingOverlay visible />;
  }

  if (!workspaceId || !projectId) {
    return (
      <Alert
        color="red"
        title="Missing project or workspace ID"
        icon={<IconAlertTriangle />}
      >
        Either project ID or workspace ID is missing from the query parameters,
        please check that your URL is valid.
      </Alert>
    );
  }

  return <ProjectApiDocsView workspaceId={workspaceId} projectId={projectId} />;
};

Project.requireAuth = true;

export default Project;
