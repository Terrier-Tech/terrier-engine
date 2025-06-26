/**
 * A function to assert at compile time that this execution branch cannot happen because all possible types of `x`
 * have been exhausted.
 *
 * If the compiler thinks that the value `x` has any valid type, this will raise a compilation error.
 *
 * @example
 * // if `Thing` changes (e.g., `Charlie` is added), the call to `unreachable` will fail compilation with
 * // the error message "Argument of type Charlie is not assignable to parameter of type never".
 * type Alpha = { type: 'alpha' }
 * type Bravo = { type: 'bravo' }
 * type Thing = Alpha | Bravo
 * function switchOnThing(thing: Thing) {
 *     switch (thing.type) {
 *         case 'alpha':
 *             console.log("Alpha happened!")
 *             return
 *         case 'bravo':
 *             console.log("Bravo happened!")
 *             return
 *         default:
 *             unreachable(thing)
 *     }
 * }
 *
 * @throws UnreachableException thrown if we reach this point at runtime
 */
export function unreachable(x: never): never {
    console.warn("unreachable got value", x)
    throw new UnreachableException()
}

class UnreachableException extends Error {
    constructor() {
        super("Reached execution point thought to be unreachable at compile time")
        this.name = "UnreachableException"
    }
}