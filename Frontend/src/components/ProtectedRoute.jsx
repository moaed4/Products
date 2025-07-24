// src/components/ProtectedRoute.jsx
import { useUser, RedirectToSignIn } from '@clerk/clerk-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (requiredRole && user.publicMetadata.role !== requiredRole) {
    return <div>Unauthorized access</div>;
  }

  return children;
}