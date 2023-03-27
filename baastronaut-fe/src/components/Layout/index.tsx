import { AppShell, Container } from '@mantine/core';
import { useRouter } from 'next/router';
import { PropsWithChildren, useEffect, useState } from 'react';
import LayoutHeader from './Header';
import LayoutNavbar from './NavBar';

function Layout({ children }: PropsWithChildren) {
  const router = useRouter();
  const breakpoint = 'sm';
  const [navbarOpened, setNavbarOpened] = useState(false);

  useEffect(() => {
    setNavbarOpened(false);
  }, [router.pathname]);

  function toggleNavbar() {
    setNavbarOpened(!navbarOpened);
  }

  return (
    <AppShell
      padding="md"
      navbar={<LayoutNavbar opened={navbarOpened} breakpoint={breakpoint} />}
      navbarOffsetBreakpoint={breakpoint}
      header={
        <LayoutHeader
          breakpoint={breakpoint}
          navbarOpened={navbarOpened}
          toggleNavbar={toggleNavbar}
        />
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
    >
      <Container>{children}</Container>
    </AppShell>
  );
}

export default Layout;
