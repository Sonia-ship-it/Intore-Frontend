import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import SettingsPage from "@/pages/recruiter/Settings";

export default function RecruiterSettingsRoute() {
  return (
    <RecruiterLayout>
      <SettingsPage />
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
