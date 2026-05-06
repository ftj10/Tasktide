# Syllabus text extraction happens client-side

Raw syllabus files (PDF, CSV, Excel, pasted text) are parsed entirely in the browser. The backend never receives file content. Only the user-initiated AI prompt — which the user explicitly copies and pastes into their own AI tool — ever contains syllabus text.

This was chosen over server-side extraction because the privacy guarantee is strongest when the raw file never leaves the device. Server-side parsing would require a file upload endpoint, temporary storage, and log suppression to avoid leaking private syllabus content — all of which are easy to get wrong. Client-side libraries (pdf.js, papaparse, SheetJS) handle the supported formats adequately.

**Consequence:** Screenshot/image OCR is not supported in MVP. OCR in the browser (Tesseract.js) is ~4MB and slow. Users with image-only syllabuses must paste text manually.
