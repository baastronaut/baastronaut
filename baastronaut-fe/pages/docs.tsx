import { useMantineTheme } from '@mantine/core';
import { RedocStandalone } from 'redoc';
import { useApiDocs } from 'src/hooks';
// import { useAuth } from '../components/auth/AuthProvider';

const Docs = () => {
  // const { user } = useAuth();
  // const [apiDocs, setApiDocs] = useState<any>();
  // const apiClientRef = useRef<ApiClient>();

  const theme = useMantineTheme();

  const apiToken =
    'eyJhbGciOiJSUzUxMiJ9.eyJyb2xlIjoid3NfMV82OTMxM2ZhODhlYTUwYTZlYjZkZWM5MTQiLCJhcGlVc2VyIjp0cnVlLCJpYXQiOjE2NzkyMzE3MzksImlzcyI6ImFwcCJ9.yhDruR9VSHqt5PkyPIX-IO1QVV-XdOivmDogTmU9A9RN4N7qZToRa8qSZ-G8u4kZd-Xf8oFOb9kayWdQKFY66V0bVeRn-_XnMHeDhIubG2MaYtltjdd1X1kYw4p5vwvMXJQZS15g6HB2cGcTW81T3jJ24cwUylvBhbdC0pIeObV-dMDSKfDD5Mte46Zbe-DdZwBHiIcGSyg1xi5adDWx-xAjEH88W3O4NithBvz1-UpWRyrmnmsRrmNIKfrnjibuRaxdrJd0DoR3U5f0qBPMZ8MI2kKe4HaxjfvYJskM2FWlAiEWYjwOxss75l4ckBfmhNIN0Qk9thiWFRoBuq7C7Q';

  const { apiDocs } = useApiDocs({
    apiUserToken: apiToken,
    projectId: 9,
  });

  if (!apiDocs) {
    return null;
  }

  return (
    <RedocStandalone
      spec={apiDocs}
      options={{
        theme: {
          colors: {
            gray: {
              '100': theme.fn.themeColor('gray', 9),
              '50': theme.fn.themeColor('gray', 4),
            },

            primary: {
              main: theme.fn.primaryColor(),
            },
            success: {
              main: theme.fn.themeColor('green'),
            },
            error: {
              main: theme.fn.themeColor('red'),
            },
          },
          typography: {
            fontFamily: theme.fontFamily,
            fontSize: theme.fontSizes.md,
          },
          spacing: {
            unit: 4,
          },
        },
      }}
    />
  );
};

Docs.requireAuth = true;

export default Docs;
