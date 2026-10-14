export function isLoiDocument(document) {
 return /^(?:loi|loi[ _-]+extension|letter of intent(?:[ _-]+extension)?)$/i.test(document.document_type||'') || (document.document_type==='other' && /\bloi\b|letter of intent/i.test(document.comments||''));
}