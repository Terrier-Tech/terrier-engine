/**
 * Simplifies a complex compound type into a flat object.
 */
export type Simplify<T> = {[KeyType in keyof T]: T[KeyType]} & {};