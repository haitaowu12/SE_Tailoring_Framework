const fs = require('fs');
const path = 'src/data/process-details.js';
let content = fs.readFileSync(path, 'utf8');

// We'll use a regex to find each process's activities block.
// Regex pattern to capture the activities object
const regex = /activities:\s*\{\s*basic:\s*\[([\s\S]*?)\],\s*standard:\s*\[([\s\S]*?)\],\s*comprehensive:\s*\[([\s\S]*?)\]\s*\}/g;

content = content.replace(regex, (match, basicStr, standardStr, compStr) => {
    // Count how many basic items have '(*)'
    // Parse strings carefully. It's a JS file, so items are usually 'string', "string"
    const countEssential = (basicStr.match(/\(\*\)/g) || []).length;
    
    if (countEssential === 0) return match; // Nothing to propagate
    
    // Helper to prefix the first N items in a string representing a JS array of strings
    function prefixItems(arrStr, n) {
        // Split by comma outside quotes (simplified, assuming no commas inside strings or assuming they are simple)
        // Better: use regex to match string literals
        const itemRegex = /'([^']*)'/g;
        let items = [];
        let m;
        while ((m = itemRegex.exec(arrStr)) !== null) {
            items.push(m[1]);
        }
        
        if (items.length === 0) {
            // maybe they used double quotes
            const itemRegex2 = /"([^"]*)"/g;
            while ((m = itemRegex2.exec(arrStr)) !== null) {
                items.push(m[1]);
            }
        }
        
        // Map items
        let modified = false;
        const newItems = items.map((val, idx) => {
            if (idx < n) {
                if (!val.trim().startsWith('(*)')) {
                    modified = true;
                    return `(*) ${val.trim()}`;
                }
            }
            return val;
        });
        
        // Reconstruct array string
        if (modified) {
            return newItems.map(v => `'${v.replace(/'/g, "\\'")}'`).join(', ');
        }
        return arrStr;
    }
    
    const newStandard = prefixItems(standardStr, countEssential);
    const newComp = prefixItems(compStr, countEssential);
    
    // Rebuild the block
    // We must preserve formatting. The easiest way is to just replace the inner contents.
    let newMatch = match;
    newMatch = newMatch.replace(standardStr, newStandard);
    newMatch = newMatch.replace(compStr, newComp);
    return newMatch;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Done modifying', path);
