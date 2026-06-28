/**
 * A hidden input that helps password managers associate a username with
 * password fields on forms that lack a visible username or email field. Without
 * this, password managers may not trigger autofill or may fail to match the
 * correct credentials for the account.
 */
export function PasswordManagerHint() {
  return (
    <input
      type="text"
      name="username"
      autoComplete="username"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
    />
  )
}
