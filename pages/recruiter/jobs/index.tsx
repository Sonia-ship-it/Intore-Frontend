import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import JobsList from "@/pages/recruiter/JobsList";

export default function RecruiterJobsRoute() {
  return (
    <RecruiterLayout>
      <JobsList />
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
