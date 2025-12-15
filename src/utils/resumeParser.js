import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Extract text from DOC/DOCX file
 */
async function extractTextFromDOC(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('DOC parsing error:', error);
    throw new Error('Failed to parse DOC file');
  }
}

/**
 * Extract text from resume file (auto-detect type)
 */
export async function extractResumeText(file) {
  if (!file) return '';

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(file);
  } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    return await extractTextFromDOC(file);
  } else {
    throw new Error('Unsupported file type');
  }
}

/**
 * Calculate match score between resume and job requirements
 * Returns score from 0-100
 */
export function calculateMatchScore(resumeText, job) {
  if (!resumeText || !job) return 0;

  const text = resumeText.toLowerCase();
  let matches = 0;
  let total = 0;

  // Extract keywords from job title
  const titleKeywords = job.title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3);

  titleKeywords.forEach(keyword => {
    if (text.includes(keyword)) matches++;
    total++;
  });

  // Check requirements
  if (job.requirements && Array.isArray(job.requirements)) {
    job.requirements.forEach(req => {
      const reqWords = req
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3);

      const reqMatches = reqWords.filter(word => text.includes(word)).length;
      if (reqMatches > reqWords.length / 2) {
        matches++;
      }
      total++;
    });
  }

  // Check responsibilities
  if (job.responsibilities && Array.isArray(job.responsibilities)) {
    job.responsibilities.forEach(resp => {
      const respWords = resp
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3);

      const respMatches = respWords.filter(word => text.includes(word)).length;
      if (respMatches > respWords.length / 2) {
        matches++;
      }
      total++;
    });
  }

  // Check department and location
  if (job.department && text.includes(job.department.toLowerCase())) {
    matches++;
  }
  total++;

  if (total === 0) return 0;

  const score = Math.round((matches / total) * 100);
  return Math.min(score, 100);
}

/**
 * Get match level description
 */
export function getMatchLevel(score) {
  if (score >= 75) return { level: 'Excellent', color: 'text-green-400' };
  if (score >= 50) return { level: 'Good', color: 'text-blue-400' };
  if (score >= 25) return { level: 'Fair', color: 'text-yellow-400' };
  return { level: 'Low', color: 'text-red-400' };
}

/**
 * Extract name from resume text
 * Looks for name at the beginning of the resume
 */
export function extractName(text) {
  if (!text) return '';

  // Get first few lines where name is typically located
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  // Check first 3 lines for a name pattern (2-4 words, capitalized, no special chars)
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    const words = line.split(/\s+/);

    // Name is typically 2-4 words, starts with capital letters
    if (words.length >= 2 && words.length <= 4) {
      const allCapitalized = words.every(word =>
        /^[A-Z][a-z]+/.test(word) && !/[@\d]/.test(word)
      );

      if (allCapitalized) {
        return words.join(' ');
      }
    }
  }

  return '';
}

/**
 * Extract email from resume text
 */
export function extractEmail(text) {
  if (!text) return '';

  // Email regex pattern
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = text.match(emailRegex);

  if (matches && matches.length > 0) {
    // Return the first email found
    return matches[0];
  }

  return '';
}

/**
 * Extract contact info from resume
 */
export function extractContactInfo(text) {
  return {
    name: extractName(text),
    email: extractEmail(text)
  };
}
