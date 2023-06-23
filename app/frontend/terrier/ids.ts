/**
 * Makes a new UUID.
 */
function makeUuid(): string {
    return URL.createObjectURL(new Blob([])).slice(-36)
}

const Ids = {
    makeUuid
}

export default Ids