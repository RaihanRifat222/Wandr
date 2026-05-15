import LoginForm from './_LoginForm'

export const metadata = { title: 'Sign in — Wandr' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return <LoginForm oauthError={error} />
}
