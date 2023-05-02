/**
 * Given an html string, extracts text content that would be rendered to the screen
 * @param html
 */
function getTextContent(html: string) {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.innerText
}




const Html = {
    getTextContent
}
export default Html