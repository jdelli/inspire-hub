// Backend API for Word Document Processing
// This is an example implementation for Node.js/Express

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const mammoth = require('mammoth');

const app = express();
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Generate contract from Word template
app.post('/api/generate-contract', async (req, res) => {
  try {
    const { variables, templateName = 'contract_template.docx' } = req.body;
    
    // Path to template file
    const templatePath = path.join(__dirname, '../public/docs', templateName);
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template file not found' });
    }
    
    // Read template file
    const templateBuffer = fs.readFileSync(templatePath);
    
    // Extract text from Word document
    const result = await mammoth.extractRawText({ buffer: templateBuffer });
    let documentText = result.value;
    
    // Replace variables in the text
    Object.keys(variables).forEach(variable => {
      const value = variables[variable] || variable;
      const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g');
      documentText = documentText.replace(regex, value);
    });
    
    // Create new Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun(documentText)]
          })
        ]
      }]
    });
    
    // Generate document buffer
    const buffer = await Packer.toBuffer(doc);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=generated_contract.docx');
    
    // Send the document
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available templates
app.get('/api/templates', (req, res) => {
  try {
    const templatesDir = path.join(__dirname, '../public/docs');
    const files = fs.readdirSync(templatesDir);
    
    const templates = files
      .filter(file => file.endsWith('.docx') || file.endsWith('.doc'))
      .map(file => ({
        id: file.replace(/\.[^/.]+$/, ""),
        name: file.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
        file: file,
        type: 'general',
        format: file.endsWith('.docx') ? 'docx' : 'doc',
        lastModified: fs.statSync(path.join(templatesDir, file)).mtime.toISOString().split('T')[0]
      }));
    
    res.json({ templates });
  } catch (error) {
    console.error('Error loading templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload new template
app.post('/api/upload-template', upload.single('template'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { originalname, path: tempPath } = req.file;
    const targetPath = path.join(__dirname, '../public/docs', originalname);
    
    // Move file to public/docs directory
    fs.renameSync(tempPath, targetPath);
    
    res.json({ 
      message: 'Template uploaded successfully',
      filename: originalname
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Preview template variables
app.post('/api/preview-template', async (req, res) => {
  try {
    const { templateName = 'contract_template.docx', variables } = req.body;
    
    const templatePath = path.join(__dirname, '../public/docs', templateName);
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template file not found' });
    }
    
    const templateBuffer = fs.readFileSync(templatePath);
    const result = await mammoth.extractRawText({ buffer: templateBuffer });
    let documentText = result.value;
    
    // Replace variables
    Object.keys(variables).forEach(variable => {
      const value = variables[variable] || variable;
      const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g');
      documentText = documentText.replace(regex, value);
    });
    
    res.json({ preview: documentText });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
