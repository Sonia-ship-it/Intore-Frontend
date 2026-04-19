import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import CreateJob from "@/pages/recruiter/CreateJob";

export default function RecruiterEditJobRoute() {
  return (
    <RecruiterLayout>
      <CreateJob />
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
