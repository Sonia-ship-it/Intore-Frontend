import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import JobDetail from "@/pages/recruiter/JobDetail";

export default function RecruiterJobDetailRoute() {
  return (
    <RecruiterLayout>
      <JobDetail />
    </RecruiterLayout>
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
