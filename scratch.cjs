const fs = require('fs');
const path = 'src/data/process-details.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /activities:\s*\{\s*basic:\s*\[([\s\S]*?)\],\s*standard:\s*\[([\s\S]*?)\],\s*comprehensive:\s*\[([\s\S]*?)\]\s*\}/g;

content = content.replace(regex, (match, basicStr, standardStr, compStr) => {
    // Count how many basic items have '(*)'
    const countEssential = (basicStr.match(/\(\*\)/g) || []).length;
    
    if (countEssential === 0) return match; 
    
    function prefixItems(arrStr, n) {
        const itemRegex = /'([^']*)'/g;
        let items = [];
        let m;
        while ((m = itemRegex.exec(arrStr)) !== null) {
            items.push(m[1]);
        }
        
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
        
        if (modified) {
            // Re-render keeping rough structure
            return newItems.map(v => `'${v.replace(/'/g, "\\'")}'`).join(', ');
        }
        return arrStr;
    }
    
    const newStandard = prefixItems(standardStr, countEssential);
    const newComp = prefixItems(compStr, countEssential);
    
    let newMatch = match;
    newMatch = newMatch.replace(standardStr, newStandard);
    newMatch = newMatch.replace(compStr, newComp);
    return newMatch;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Done modifying', path);
