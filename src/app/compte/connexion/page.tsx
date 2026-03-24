import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function ConnexionPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Connexion</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Retrouvez vos devis et votre espace client
          </p>
        </div>
        <AuthForm mode="login" />
        <p className="mt-6 text-center text-sm text-neutral-500">
          Pas encore de compte ?{' '}
          <Link href="/compte/inscription" className="text-neutral-900 font-medium underline underline-offset-2">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
