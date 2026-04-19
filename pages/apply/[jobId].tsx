import { ApplicantShell } from "@/components/layout/ApplicantShell";
import ApplyPage from "@/pages/applicant/Apply";

export default function ApplyRoute() {
  return (
    <ApplicantShell>
      <ApplyPage />
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
