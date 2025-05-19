import { Providers } from './providers';

function RootLayout({ children }) {
  return (
    <Providers>{children}</Providers>
  );
}

export default RootLayout;