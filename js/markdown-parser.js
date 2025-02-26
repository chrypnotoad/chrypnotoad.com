// markdown-parser.js - A simple Markdown to HTML converter
function parseMarkdown(markdown) {
    if (!markdown) return '';
    
    // Process the markdown text
    let html = markdown;
  
    // Handle paragraphs
    html = html.replace(/\n\s*\n/g, '</p><p>');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="md-link">$1</a>');
    
    // Lists
    html = html.replace(/^\s*\*\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/^\s*-\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
    html = html.replace(/<\/li>\s*<li>/g, '</li><li>');
    html = html.replace(/<li>(.*?)<\/li>/s, '<ul><li>$1</li></ul>');
    
    // Wrap with paragraph tags if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
  }