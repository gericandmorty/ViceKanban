import Loading from '@/app/components/ui/Loading';

/**
 * Root loading component for Next.js App Router.
 * Handles automatic route-level suspends and initial page loads.
 */
export default function RootLoading() {
  return <Loading fullScreen={true} />;
}
