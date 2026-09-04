export function parseBookFilename(rawName: string) {
  // Regex to match: [timestamp]___[category]___[filename]
  const match = rawName.match(/^\d+___(.*?)___(.*)$/);
  
  if (match) {
    return { 
      category: match[1], 
      displayName: match[2] 
    };
  }

  // Fallback for old files before the categorization feature
  // Old format: [timestamp]_[filename]
  const oldMatch = rawName.match(/^\d+_(.*)$/);
  if (oldMatch) {
    return {
      category: 'Uncategorized',
      displayName: oldMatch[1]
    };
  }

  // Absolute fallback
  return {
    category: 'Uncategorized',
    displayName: rawName
  };
}
