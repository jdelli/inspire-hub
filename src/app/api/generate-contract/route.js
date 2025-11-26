import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export async function POST(req) {
  try {
    const body = await req.json();
    const { variables, templateName = 'contract_template.docx' } = body;
    
    // Security: Prevent path traversal
    const sanitizedTemplateName = path.basename(templateName);
    
    // Resolve path relative to project root
    const templatePath = path.join(process.cwd(), 'public', 'docs', sanitizedTemplateName);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 404 });
    }
    
    const content = fs.readFileSync(templatePath);
    
    // Load the docx file as a binary
    const zip = new PizZip(content);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Render the document (replace variables)
    doc.render(variables);
    
    // Generate document buffer
    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
    
    // Return the file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=generated_${sanitizedTemplateName}`,
      },
    });
    
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
