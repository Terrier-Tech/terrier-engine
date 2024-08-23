/**
 * Makes a new UUID.
 */
function makeUuid(): string {
    return URL.createObjectURL(new Blob([])).slice(-36)
}


/**
 * Makes a new random string of the given length.
 * For when a UUID is overkill.
 * @param len the number of characters in the string
 * @return the random string
 */
function makeRandom(len: number): string {
    return window.btoa(String.fromCharCode(...window.crypto.getRandomValues(new Uint8Array(length * 2)))).replace(/[+/]/g, "").substring(0, len)
}

const Ids = {
    makeUuid,
    makeRandom
}

export default Ids