import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function InscriptionPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Créer un compte</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Accédez à vos devis et historique de commandes
          </p>
        </div>
        <AuthForm mode="register" />
        <p className="mt-6 text-center text-sm text-neutral-500">
          Déjà un compte ?{' '}
          <Link href="/compte/connexion" className="text-neutral-900 font-medium underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
