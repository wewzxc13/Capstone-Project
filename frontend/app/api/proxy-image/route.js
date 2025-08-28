import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return new NextResponse('Filename parameter is required', { status: 400 });
    }
    
    // Security: Only allow image files
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(filename).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return new NextResponse('Invalid file type', { status: 400 });
    }
    
    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }
    
    // Path to the backend uploads directory
    const backendUploadsPath = path.join(process.cwd(), '..', '..', '..', 'backend', 'Uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(backendUploadsPath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Read the file
    const imageBuffer = fs.readFileSync(backendUploadsPath);
    
    // Determine content type based on file extension
    let contentType = 'image/jpeg'; // default
    switch (fileExtension) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow cross-origin access
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('Proxy image error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
