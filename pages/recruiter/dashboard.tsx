import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import RecruiterDashboard from "@/pages/recruiter/Dashboard";
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';

export default function RecruiterDashboardRoute() {
  return (
    <RecruiterLayout>
      <RecruiterDashboard />
    </RecruiterLayout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}
