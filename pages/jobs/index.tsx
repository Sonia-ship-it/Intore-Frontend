import { ApplicantShell } from "@/components/layout/ApplicantShell";
import JobBoardPage from "@/pages/jobs/JobBoardPage";

export default function JobsPage() {
  return (
    <ApplicantShell>
      <JobBoardPage />
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
