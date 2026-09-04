export function cleanFileName(name: string) {
  // Remove common extensions if present
  let clean = name.replace(/\.(pdf|epub)$/i, "");
  // Remove ISBNs or long numeric strings (10-13+ digits)
  clean = clean.replace(/\b\d{10,14}\b/g, '');
  // Remove standard UUIDs
  clean = clean.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '');
  // Replace dashes and underscores with spaces
  clean = clean.replace(/[-_]/g, ' ');
  // Remove extra spaces
  clean = clean.replace(/\s+/g, ' ').trim();
  // Title Case
  clean = clean.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  
  return clean || name;
}

export function parseBookFilename(rawName: string) {
  // Regex to match: [timestamp]___[category]___[filename]
  const match = rawName.match(/^\d+___(.*?)___(.*)$/);
  
  if (match) {
    return { 
      category: match[1], 
      displayName: cleanFileName(match[2]) 
    };
  }

  // Fallback for old files before the categorization feature
  // Old format: [timestamp]_[filename]
  const oldMatch = rawName.match(/^\d+_(.*)$/);
  if (oldMatch) {
    return {
      category: 'Uncategorized',
      displayName: cleanFileName(oldMatch[1])
    };
  }

  // Absolute fallback
  return {
    category: 'Uncategorized',
    displayName: cleanFileName(rawName)
  };
}
