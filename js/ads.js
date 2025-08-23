// Gigapub Ads Integration
let isAdLoading = false;

/**
 * Show Gigapub ad and return promise
 * @returns {Promise<boolean>} - True if ad was watched successfully
 */
function showGigaAd() {
    return new Promise((resolve, reject) => {
        if (isAdLoading) {
            reject(new Error('Ad is already loading'));
            return;
        }

        if (typeof window.showGiga !== 'function') {
            reject(new Error('Gigapub ads not loaded'));
            return;
        }

        isAdLoading = true;

        // Show the ad
        window.showGiga()
            .then(() => {
                // Ad was watched successfully
                console.log('Ad watched successfully');
                isAdLoading = false;
                resolve(true);
            })
            .catch((error) => {
                // Ad failed or was closed early
                console.error('Ad error:', error);
                isAdLoading = false;
                reject(error);
            });
    });
}

/**
 * Check if ads are available
 * @returns {boolean}
 */
function areAdsAvailable() {
    return typeof window.showGiga === 'function';
}

/**
 * Initialize ads system
 */
function initializeAds() {
    // Check if Gigapub script is loaded
    if (typeof window.showGiga === 'function') {
        console.log('Gigapub ads initialized successfully');
        return true;
    } else {
        console.warn('Gigapub ads not available');
        return false;
    }
}

/**
 * Handle ad watch with retry logic
 * @param {number} maxRetries 
 * @returns {Promise<boolean>}
 */
async function watchAdWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await showGigaAd();
            return result;
        } catch (error) {
            console.error(`Ad attempt ${i + 1} failed:`, error);
            
            if (i === maxRetries - 1) {
                throw error;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Initialize ads when script loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for Gigapub script to load
    setTimeout(() => {
        initializeAds();
    }, 1000);
});
