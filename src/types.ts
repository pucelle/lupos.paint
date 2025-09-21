/** Infer object value type. */
type ValueOf<O extends object> = O[keyof O]
