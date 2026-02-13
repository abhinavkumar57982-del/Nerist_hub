
// Registration number validator for NERIST
class RegistrationValidator {
    constructor() {
        // Define valid registration number ranges from your STD OF nerist.txt
        this.validRanges = {
            "125": { start: 1, end: 247 },
            "225": { start: 1, end: 220 },
            "325": { start: 1, end: 85 },
            "425": { start: 1, end: 244 },
            "525": { start: 1, end: 78 },
            
            "124": { start: 1, end: 211 },
            "224": { start: 1, end: 144 },
            "324": { start: 1, end: 69 },
            "424": { start: 1, end: 207 },
            "524": [
                { start: 1, end: 54 },
                { start: 501, end: 519 }
            ],
            
            "123": { start: 1, end: 198 },
            "223": { start: 1, end: 138 },
            "323": { start: 1, end: 67 },
            "423": [58, 136, 123, 106, 76],  // Specific numbers only
            "523": { start: 1, end: 22 },
            
            "122": { start: 1, end: 186 },
            "222": { start: 1, end: 147 },
            "322": { start: 1, end: 60 },
            "522": { start: 1, end: 26 },
            
            "121": { start: 1, end: 193 },
            "221": [143, 112, 46, 119, 136, 70, 60, 139, 95, 97, 71, 146, 109, 150],
            "321": [64, 71, 65, 60],
            "521": { start: 1, end: 50 },
            
            "120": { start: 1, end: 217 },
            "220": [149, 58, 137],
            "520": [21, 8, 3, 6, 16, 19, 24, 15, 28],
            
            "119": { start: 1, end: 220 }
        };
    }

    // Validate registration number format and existence
    isValid(regNumber) {
        try {
            // Check format: should be like "225/088"
            if (!regNumber || typeof regNumber !== 'string') {
                return false;
            }

            // Trim whitespace
            regNumber = regNumber.trim();
            
            let prefix, number;
            
            // Check if it's already in correct format
            const parts = regNumber.split('/');
            if (parts.length === 2) {
                prefix = parts[0];
                number = parts[1];
            } else {
                // Try to handle formats like "225-088" or "225 088"
                const alternativeParts = regNumber.split(/[- ]/);
                if (alternativeParts.length === 2) {
                    prefix = alternativeParts[0];
                    number = alternativeParts[1];
                } else {
                    return false;
                }
            }

            // Parse the number (remove leading zeros)
            const numValue = parseInt(number, 10);
            if (isNaN(numValue) || numValue < 1) {
                return false;
            }

            // Check if prefix exists in our ranges
            if (!this.validRanges[prefix]) {
                return false;
            }

            const range = this.validRanges[prefix];

            // Check if it's an array (specific numbers)
            if (Array.isArray(range)) {
                // Check if it's an array of specific numbers (like [58, 136, 123])
                if (range.length > 0 && typeof range[0] === 'number') {
                    return range.includes(numValue);
                }
                // Check if it's an array of range objects (like [{start:1, end:54}, {start:501, end:519}])
                if (range.length > 0 && typeof range[0] === 'object') {
                    for (const rangeObj of range) {
                        if (numValue >= rangeObj.start && numValue <= rangeObj.end) {
                            return true;
                        }
                    }
                    return false;
                }
            }

            // Check if it's a range object (like {start:1, end:247})
            if (range && typeof range === 'object' && range.start && range.end) {
                return numValue >= range.start && numValue <= range.end;
            }

            return false;
        } catch (error) {
            console.error("Validation error:", error);
            return false;
        }
    }

    // Format registration number to standard format
    format(regNumber) {
        try {
            if (!regNumber || typeof regNumber !== 'string') {
                return null;
            }

            // Trim and remove any extra spaces
            regNumber = regNumber.trim();
            
            let prefix, number;
            
            // Try different separators
            const parts = regNumber.split(/[/ -]/);
            if (parts.length === 2) {
                prefix = parts[0].trim();
                number = parts[1].trim();
            } else {
                return null;
            }

            // Parse the number to remove any leading zeros
            const numValue = parseInt(number, 10);
            if (isNaN(numValue) || numValue < 1) {
                return null;
            }

            // Return in standard format without padding zeros
            return `${prefix}/${numValue}`;
        } catch (error) {
            console.error("Format error:", error);
            return null;
        }
    }

    // Get all valid prefixes for reference
    getValidPrefixes() {
        return Object.keys(this.validRanges);
    }

    // Check if a specific prefix exists
    isValidPrefix(prefix) {
        return this.validRanges.hasOwnProperty(prefix);
    }

    // Get the range for a specific prefix
    getRangeForPrefix(prefix) {
        return this.validRanges[prefix] || null;
    }
}

module.exports = new RegistrationValidator();
