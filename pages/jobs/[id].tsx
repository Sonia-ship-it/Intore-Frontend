import { ApplicantShell } from "@/components/layout/ApplicantShell";
import JobDetailPage from "@/pages/jobs/JobDetailPage";

export default function JobDetailRoute() {
  return (
    <ApplicantShell>
      <JobDetailPage />
    </ApplicantShell>
  );
}

export async function getServerSideProps({ locale }: any) {
  const { serverSideTranslations } = require('next-i18next/pages/serverSideTranslations');
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}
