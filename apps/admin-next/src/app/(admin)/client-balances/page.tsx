import { redirect } from 'next/navigation';

/** La vista vive ahora como pestaña "Balances" dentro de /users. */
export default function ClientBalancesPage() {
  redirect('/users?tab=balances');
}
