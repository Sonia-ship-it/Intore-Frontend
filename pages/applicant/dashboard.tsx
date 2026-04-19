import { ApplicantShell } from "@/components/layout/ApplicantShell";
import ApplicantDashboardPage from "@/pages/applicant/ApplicantDashboardPage";
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';

export default function ApplicantDashboardRoute() {
  return (
    <ApplicantShell>
      <ApplicantDashboardPage />
    </ApplicantShell>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}
