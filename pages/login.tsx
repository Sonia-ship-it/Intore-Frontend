import LoginPage from "@/pages/auth/Login";

export default LoginPage;

export async function getServerSideProps({ locale }: any) {
  const { serverSideTranslations } = require('next-i18next/pages/serverSideTranslations');
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}
