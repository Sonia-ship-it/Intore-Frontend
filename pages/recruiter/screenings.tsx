import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import ScreeningsList from "@/pages/recruiter/ScreeningsList";

export default function RecruiterScreeningsRoute() {
  return (
    <RecruiterLayout>
      <ScreeningsList />
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
