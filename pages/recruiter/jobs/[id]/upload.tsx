import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import BulkUpload from "@/pages/recruiter/BulkUpload";

export default function RecruiterUploadRoute() {
  return (
    <RecruiterLayout>
      <BulkUpload />
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
