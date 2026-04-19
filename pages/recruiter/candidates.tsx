import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import CandidatesList from "@/pages/recruiter/CandidatesList";

export default function RecruiterCandidatesRoute() {
  return (
    <RecruiterLayout>
      <CandidatesList />
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
