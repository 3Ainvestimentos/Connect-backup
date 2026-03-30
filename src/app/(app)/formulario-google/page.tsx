import { redirect } from 'next/navigation';

/** Rota legada: o formulário abre pelo modal no menu "Formulário Google". */
export default function FormularioGooglePage() {
  redirect('/dashboard');
}
