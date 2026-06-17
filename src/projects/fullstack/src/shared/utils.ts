/**
 * Identity function that only type-checks when `array` contains every member of
 * the union `T`. Use to keep a literal array in sync with the union it mirrors:
 *
 * ```ts
 * const colors = arrayOfAll<'red' | 'green' | 'blue'>()(['red', 'green', 'blue'])
 * ```
 *
 * - Missing a union member → the arg collapses to an error string the literal
 *   array can't satisfy.
 * - Invalid/typo'd member → blocked by `U extends readonly T[]`.
 *
 * Returns `readonly T[]`: these arrays are exhaustive source-of-truth catalogs,
 * so mutating one is always either a copy operation (spread/`.map`/`.filter`,
 * all available on readonly) or a bug (mutating shared state). The readonly
 * return also makes `(typeof arr)[number]` resolve to the full union `T`.
 *
 * The currying is required, not stylistic: TypeScript's type-argument inference
 * is all-or-nothing, so a single `<T, U>(array) => array` can't pin `T`
 * explicitly while inferring `U` from the argument. Specifying only `T` errors
 * ("Expected 2 type arguments"); specifying neither infers `T` from the array
 * itself, making `T` equal `U[number]` so the exhaustiveness check is always
 * true and never fires. Splitting into two calls resolves `T` (the source-of-
 * truth union) and `U` (the literal array) independently.
 */
export const arrayOfAll =
  <T>() =>
  <U extends readonly T[]>(
    array: U &
      ([T] extends [U[number]] ? unknown : 'Array is missing a union member')
  ): readonly T[] =>
    array
