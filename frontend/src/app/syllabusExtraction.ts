import Papa from "papaparse";

export async function extract(input: string | File): Promise<string> {
  if (typeof input === "string") return input;

  const name = input.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractPdf(input);
  if (name.endsWith(".csv")) return extractCsv(input);
  if (name.endsWith(".docx")) return extractDocx(input);

  throw new Error(
    `Unsupported file type: "${input.name}". For Excel files, please export to CSV first.`
  );
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function extractPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).href;
  } catch {
    // non-browser environments (tests)
  }

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n");
}

async function extractCsv(file: File): Promise<string> {
  const text = await file.text();
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return result.data.map((row) => row.join(" | ")).join("\n");
}
