const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    }
});

// Extract text from PDF
async function extractTextFromPDF(filePath) {
    try {
        console.log('Reading PDF file:', filePath);
        const dataBuffer = fs.readFileSync(filePath);
        console.log('PDF buffer size:', dataBuffer.length);
        const data = await pdfParse(dataBuffer);
        console.log('PDF text extracted, length:', data.text.length);
        return data.text;
    } catch (error) {
        console.error('PDF extraction error:', error.message);
        throw new Error('Failed to extract text from PDF: ' + error.message);
    }
}

// Extract text from DOCX
async function extractTextFromDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

// Parse CV text to extract candidate details
function parseCV(text) {
    const candidateData = {
        full_name: '',
        email: '',
        phone: '',
        location: '',
        skills: '',
        experience: ''
    };

    // Extract email
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
        candidateData.email = emailMatch[0];
    }

    // Extract phone (Indian format and international)
    const phoneRegex = /(?:\+91|91)?[\s-]?[6-9]\d{9}|\(\d{3}\)\s?\d{3}[-\s]?\d{4}/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
        candidateData.phone = phoneMatch[0].replace(/[\s-()]/g, '');
    }

    // Extract name - try multiple patterns
    let nameFound = false;
    
    // Pattern 1: Look for "Name:" label
    const nameRegex1 = /(?:Name|NAME|Full Name|FULL NAME)[\s:]+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)+)/i;
    const nameMatch1 = text.match(nameRegex1);
    if (nameMatch1) {
        candidateData.full_name = nameMatch1[1].trim();
        nameFound = true;
    }
    
    if (!nameFound) {
        // Pattern 2: Look for capitalized words at the beginning (2-4 words)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();
            // Match 2-4 capitalized words (handles formats like "SWAGAT PATTANAYAK" or "Swagat Pattanayak")
            if (/^[A-Z][A-Z\s]{2,50}$/.test(line) || /^[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3}$/.test(line)) {
                // Exclude common headers
                if (!/(RESUME|CV|CURRICULUM|VITAE|PROFILE|CONTACT|EMAIL|PHONE)/i.test(line)) {
                    candidateData.full_name = line;
                    nameFound = true;
                    break;
                }
            }
        }
    }
    
    if (!nameFound) {
        // Pattern 3: Try first non-empty line if it looks like a name
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            if (firstLine.length >= 5 && firstLine.length < 50 && /[A-Za-z\s]+/.test(firstLine)) {
                candidateData.full_name = firstLine;
            }
        }
    }

    // Extract location
    const locationRegex = /(?:Location|Address|City)[\s:]+([A-Za-z\s,]+)/i;
    const locationMatch = text.match(locationRegex);
    if (locationMatch) {
        candidateData.location = locationMatch[1].trim().split(',')[0];
    }

    // Extract skills
    const skillsRegex = /(?:Skills|Technical Skills|Core Competencies)[\s:]+([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|$)/i;
    const skillsMatch = text.match(skillsRegex);
    if (skillsMatch) {
        candidateData.skills = skillsMatch[1].replace(/\n/g, ', ').trim();
    }

    // Extract experience (look for years)
    const expRegex = /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i;
    const expMatch = text.match(expRegex);
    if (expMatch) {
        candidateData.experience = `${expMatch[1]} years`;
    }

    return candidateData;
}

// POST /api/parse-cv
router.post('/api/parse-cv', upload.single('cv'), async (req, res) => {
    console.log('CV upload request received');
    let filePath = null;
    
    try {
        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        filePath = req.file.path;
        console.log('File uploaded:', req.file.originalname, 'Type:', req.file.mimetype);

        let extractedText = '';

        // Extract text based on file type
        if (req.file.mimetype === 'application/pdf') {
            console.log('Processing PDF file...');
            extractedText = await extractTextFromPDF(req.file.path);
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log('Processing DOCX file...');
            extractedText = await extractTextFromDOCX(req.file.path);
        }

        console.log('Text extracted successfully, parsing CV data...');
        // Parse the extracted text
        const candidateData = parseCV(extractedText);
        
        // Add the full extracted text to the response
        candidateData.resume_text = extractedText;
        
        console.log('CV parsed successfully:', candidateData);

        // Delete the uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log('Temporary file deleted');
        }

        return res.status(200).json({
            success: true,
            data: candidateData
        });

    } catch (error) {
        console.error('Error parsing CV:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Clean up file if it exists
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('Cleaned up file after error');
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError.message);
            }
        }

        return res.status(500).json({
            success: false,
            message: 'Error parsing CV. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
