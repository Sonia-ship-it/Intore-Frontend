import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Email verification is temporarily disabled.
// This page redirects to login.
export default function VerifyPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, []);
  return null;
}
