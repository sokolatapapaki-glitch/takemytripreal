// unified-age-manager.js
class UnifiedAgeManager {
    constructor() {
        // ΕΝΙΑΙΑ ΚΑΤΗΓΟΡΙΟΠΟΙΗΣΗ ΗΛΙΚΙΩΝ ΓΙΑ ΟΛΕΣ ΤΙΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ
        this.ageCategories = [
            { min: 0, max: 2, key: "0-2", label: "Μωρά (0-2)" },
            { min: 3, max: 5, key: "3-5", label: "Νήπια (3-5)" },
            { min: 6, max: 12, key: "6-12", label: "Παιδιά (6-12)" },
            { min: 13, max: 17, key: "13-17", label: "Έφηβοι (13-17)" },
            { min: 18, max: 64, key: "18-64", label: "Ενήλικες (18-64)" },
            { min: 65, max: 120, key: "65+", label: "Συνταξιούχοι (65+)" }
        ];
        
        // ΧΡΗΣΗ ΜΟΝΟ ΑΥΤΩΝ ΤΩΝ ΚΛΕΙΔΙΩΝ
        this.validKeys = ["0-2", "3-5", "6-12", "13-17", "18-64", "65+"];
    }
    
    // ΜΕΤΑΤΡΟΠΗ ΟΠΟΙΑΣΔΗΠΟΤΕ ΗΛΙΚΙΑΣ ΣΤΑ 6 ΚΟΙΝΑ ΚΛΕΙΔΙΑ
    getCategoryKey(age) {
        if (age === undefined || age === null) return "18-64"; // προεπιλογή
        
        age = parseInt(age);
        
        for (const category of this.ageCategories) {
            if (age >= category.min && age <= category.max) {
                return category.key;
            }
        }
        
        return "18-64"; // fallback
    }
    
    // ΜΕΤΑΤΡΟΠΗ ΠΑΛΙΑΣ ΔΡΑΣΤΗΡΙΟΤΗΤΑΣ ΣΕ ΕΝΙΑΙΟ ΣΧΗΜΑ
    convertActivity(activity) {
        if (!activity.prices) return activity;
        
        const convertedPrices = {};
        
        // ΓΙΑ ΚΑΘΕ ΚΟΙΝΟ ΚΛΕΙΔΙ
        this.validKeys.forEach(categoryKey => {
            let foundPrice = null;
            
            // ΨΑΧΝΟΥΜΕ ΣΤΙΣ ΥΠΑΡΧΟΥΣΕΣ ΤΙΜΕΣ
            for (const [oldKey, price] of Object.entries(activity.prices)) {
                if (this.doesKeyMatchCategory(oldKey, categoryKey)) {
                    foundPrice = price;
                    break;
                }
            }
            
            // ΕΑΝ ΔΕΝ ΒΡΕΘΕΙ, ΧΡΗΣΙΜΟΠΟΙΟΥΜΕ DEFAULT LOGIC
            if (foundPrice === null) {
                foundPrice = this.calculateDefaultPrice(activity.prices, categoryKey);
            }
            
            convertedPrices[categoryKey] = foundPrice;
        });
        
        return {
            ...activity,
            prices: convertedPrices,
            originalPrices: activity.prices // ΚΡΑΤΑΜΕ ΚΑΙ ΤΙΣ ΠΑΛΙΕΣ ΓΙΑ REFERENCE
        };
    }
    
    doesKeyMatchCategory(oldKey, categoryKey) {
        // Παραδείγματα αντιστοίχισης:
        // "0-6" → "0-2", "3-5"
        // "15-19" → "13-17"
        // "18+" → "18-64", "65+"
        
        if (!oldKey.includes('-') && !oldKey.includes('+')) {
            return false;
        }
        
        const [catMin, catMax] = categoryKey.replace('+', '').split('-').map(Number);
        
        if (oldKey.includes('+')) {
            const minAge = parseInt(oldKey);
            return minAge >= catMin;
        }
        
        const [oldMin, oldMax] = oldKey.split('-').map(Number);
        
        // ΥΠΟΛΟΓΙΣΜΟΣ ΚΟΙΝΟΥ ΔΙΑΣΤΗΜΑΤΟΣ
        const overlapMin = Math.max(catMin, oldMin);
        const overlapMax = Math.min(catMax || 120, oldMax || 120);
        
        return overlapMin <= overlapMax;
    }
    
    calculateDefaultPrice(originalPrices, categoryKey) {
        // Απλός κανόνας: παίρνουμε τη μέση τιμή όλων των ηλικιών
        const values = Object.values(originalPrices)
            .filter(v => typeof v === 'number')
            .map(v => parseFloat(v));
        
        if (values.length === 0) return 0;
        
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return Math.round(avg * 2) / 2; // Στρογγυλοποίηση στα 0.5
    }
    
    // ΥΠΟΛΟΓΙΣΜΟΣ ΚΟΣΤΟΥΣ ΓΙΑ ΜΙΑ ΟΛΟΚΛΗΡΗ ΟΙΚΟΓΕΝΕΙΑ
    calculateFamilyCost(activity, familyMembers) {
        let total = 0;
        
        familyMembers.forEach(member => {
            const category = this.getCategoryKey(member.age);
            const price = activity.prices[category];
            
            if (typeof price === 'number') {
                total += price;
            } else if (typeof price === 'string' && !isNaN(parseFloat(price))) {
                total += parseFloat(price);
            }
            // Αγνοούμε "0", "ΔΩΡΕΑΝ", κλπ
        });
        
        return total;
    }
}

// ΚΑΝΕ ΤΟΝ MANAGER ΔΙΑΘΕΣΙΜΟ ΠΑΝΤΟΥ
window.UnifiedAgeManager = new UnifiedAgeManager();
