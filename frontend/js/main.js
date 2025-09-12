// Main JavaScript for VR Tour Platform
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

// State management
let currentTours = [];
let darkMode = localStorage.getItem('darkMode') === 'true';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    loadTours();
    initEventListeners();
    initSearch();
});

// Dark mode functionality
function initDarkMode() {
    if (darkMode) {
        document.documentElement.classList.add('dark');
        updateDarkModeIcon();
    }
}

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    document.documentElement.classList.toggle('dark');
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    const icon = document.querySelector('#darkModeToggle i');
    icon.className = darkMode ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
}

// Event listeners
function initEventListeners() {
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
            });
            this.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
            this.classList.add('bg-primary', 'text-white');
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'd' && e.ctrlKey) {
            e.preventDefault();
            toggleDarkMode();
        }
        if (e.key === 'u' && e.ctrlKey) {
            e.preventDefault();
            window.location.href = 'upload.html';
        }
    });
}

// Load tours from API
async function loadTours() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/tours`);
        const data = await response.json();
        
        if (data.success) {
            currentTours = data.tours;
            updateStats(data.tours);
            renderTours(data.tours);
        } else {
            showError('Failed to load tours: ' + data.error);
        }
    } catch (error) {
        console.error('Error loading tours:', error);
        showError('Failed to connect to server. Make sure the backend is running.');
        // Show demo data for development
        showDemoData();
    } finally {
        showLoading(false);
    }
}

// Show demo data when server is not available
function showDemoData() {
    const demoTours = [
        {
            id: 'demo-tour-1',
            title: 'Modern Apartment Tour',
            description: 'Experience a beautiful modern apartment with 360° views',
            thumbnail: '/uploads/demo/living-room-thumb.jpg',
            created: new Date().toISOString(),
            scenesCount: 3
        }
    ];
    
    currentTours = demoTours;
    updateStats(demoTours);
    renderTours(demoTours);
}

// Update statistics
function updateStats(tours) {
    const totalScenes = tours.reduce((sum, tour) => sum + (tour.scenesCount || 0), 0);
    
    document.getElementById('toursCount').textContent = tours.length;
    document.getElementById('scenesCount').textContent = totalScenes;
    
    // Animate counters
    animateCounter('toursCount', tours.length);
    animateCounter('scenesCount', totalScenes);
}

// Animate counter
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    let currentValue = 0;
    const increment = targetValue / 20;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.textContent = Math.floor(currentValue);
    }, 50);
}

// Render tours grid
function renderTours(tours) {
    const grid = document.getElementById('toursGrid');
    
    if (tours.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-plus-circle text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No tours yet</h3>
                <p class="text-gray-500 dark:text-gray-500 mb-4">Create your first virtual tour to get started</p>
                <button onclick="window.location.href='upload.html'" class="bg-primary text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition">
                    <i class="fas fa-plus mr-2"></i>Create Tour
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = tours.map(tour => `
        <div class="tour-card bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer" onclick="viewTour('${tour.id}')">
            <div class="relative">
                <img src="${tour.thumbnail || '/uploads/demo/placeholder.jpg'}" alt="${tour.title}" class="w-full h-48 object-cover">
                <div class="absolute top-2 right-2">
                    <span class="bg-primary text-black px-2 py-1 rounded-full text-xs font-semibold">
                        ${tour.scenesCount} scenes
                    </span>
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <i class="fas fa-play text-white text-3xl opacity-0 hover:opacity-100 transition-opacity duration-300"></i>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2 truncate">${tour.title}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">${tour.description || 'No description available'}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span><i class="fas fa-calendar mr-1"></i>${formatDate(tour.created)}</span>
                    <div class="flex gap-2">
                        <button onclick="event.stopPropagation(); shareTour('${tour.id}')" class="hover:text-primary transition" title="Share">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button onclick="event.stopPropagation(); copyTourLink('${tour.id}')" class="hover:text-primary transition" title="Copy Link">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Enhanced filter tours with Klapty-inspired categories
function filterTours(filter) {
    let filteredTours = [...currentTours];
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event?.target?.classList.add('active');
    
    switch(filter) {
        case 'recent':
            filteredTours.sort((a, b) => new Date(b.created) - new Date(a.created));
            filteredTours = filteredTours.slice(0, 6);
            break;
        case 'real-estate':
            filteredTours = filteredTours.filter(tour => 
                tour.category === 'real-estate' || 
                tour.title.toLowerCase().includes('house') ||
                tour.title.toLowerCase().includes('apartment') ||
                tour.title.toLowerCase().includes('home')
            );
            break;
        case 'hotel':
            filteredTours = filteredTours.filter(tour => 
                tour.category === 'hotel' || 
                tour.title.toLowerCase().includes('hotel') ||
                tour.title.toLowerCase().includes('resort')
            );
            break;
        case 'restaurant':
            filteredTours = filteredTours.filter(tour => 
                tour.category === 'restaurant' || 
                tour.title.toLowerCase().includes('restaurant') ||
                tour.title.toLowerCase().includes('cafe') ||
                tour.title.toLowerCase().includes('kitchen')
            );
            break;
        case 'showroom':
            filteredTours = filteredTours.filter(tour => 
                tour.category === 'showroom' || 
                tour.title.toLowerCase().includes('showroom') ||
                tour.title.toLowerCase().includes('gallery') ||
                tour.title.toLowerCase().includes('store')
            );
            break;
        case 'popular':
            // For now, just shuffle the array (in real app, would sort by views/likes)
            filteredTours.sort(() => Math.random() - 0.5);
            break;
        case 'all':
        default:
            // Show all tours
            break;
    }
    
    renderTours(filteredTours);
}

// View tour
function viewTour(tourId) {
    window.location.href = `viewer.html?tour=${tourId}`;
}

// Explore demo tour
function exploreDemoTour() {
    viewTour('demo-tour-1');
}

// Share tour
async function shareTour(tourId) {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/viewer.html?tour=${tourId}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Virtual Tour',
                text: 'Check out this amazing virtual tour!',
                url: shareUrl
            });
        } catch (error) {
            console.log('Sharing cancelled');
        }
    } else {
        copyToClipboard(shareUrl);
        showNotification('Tour link copied to clipboard!');
    }
}

// Copy tour link
function copyTourLink(tourId) {
    const baseUrl = window.location.origin;
    const tourUrl = `${baseUrl}/viewer.html?tour=${tourId}`;
    copyToClipboard(tourUrl);
    showNotification('Link copied to clipboard!');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showLoading(show) {
    const grid = document.getElementById('toursGrid');
    if (show) {
        grid.innerHTML = `
            <div class="col-span-full flex justify-center py-12">
                <div class="text-center">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p class="mt-4 text-gray-600 dark:text-gray-400">Loading tours...</p>
                </div>
            </div>
        `;
    }
}

// Klapty-inspired search functionality
function initSearch() {
    const searchInput = document.getElementById('tourSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function performSearch() {
    const searchTerm = document.getElementById('tourSearch')?.value.toLowerCase().trim() || '';
    const activeFilter = document.querySelector('.filter-btn.active')?.onclick?.toString().match(/filterTours\('([^']+)'\)/)?.[1] || 'all';
    
    let filteredTours = [...currentTours];
    
    // Apply search filter
    if (searchTerm) {
        filteredTours = filteredTours.filter(tour => 
            tour.title.toLowerCase().includes(searchTerm) ||
            (tour.description && tour.description.toLowerCase().includes(searchTerm)) ||
            (tour.category && tour.category.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply category filter
    if (activeFilter !== 'all') {
        switch(activeFilter) {
            case 'recent':
                filteredTours.sort((a, b) => new Date(b.created) - new Date(a.created));
                filteredTours = filteredTours.slice(0, 6);
                break;
            case 'real-estate':
                filteredTours = filteredTours.filter(tour => 
                    tour.category === 'real-estate' || 
                    tour.title.toLowerCase().includes('house') ||
                    tour.title.toLowerCase().includes('apartment') ||
                    tour.title.toLowerCase().includes('home')
                );
                break;
            case 'hotel':
                filteredTours = filteredTours.filter(tour => 
                    tour.category === 'hotel' || 
                    tour.title.toLowerCase().includes('hotel') ||
                    tour.title.toLowerCase().includes('resort')
                );
                break;
            case 'restaurant':
                filteredTours = filteredTours.filter(tour => 
                    tour.category === 'restaurant' || 
                    tour.title.toLowerCase().includes('restaurant') ||
                    tour.title.toLowerCase().includes('cafe') ||
                    tour.title.toLowerCase().includes('kitchen')
                );
                break;
            case 'showroom':
                filteredTours = filteredTours.filter(tour => 
                    tour.category === 'showroom' || 
                    tour.title.toLowerCase().includes('showroom') ||
                    tour.title.toLowerCase().includes('gallery') ||
                    tour.title.toLowerCase().includes('store')
                );
                break;
        }
    }
    
    renderTours(filteredTours);
    
    // Show search results count
    const resultsCount = filteredTours.length;
    const searchResultsInfo = document.getElementById('searchResultsInfo') || createSearchResultsInfo();
    if (searchTerm || activeFilter !== 'all') {
        searchResultsInfo.style.display = 'block';
        searchResultsInfo.textContent = `Found ${resultsCount} tour${resultsCount !== 1 ? 's' : ''}`;
    } else {
        searchResultsInfo.style.display = 'none';
    }
}

function createSearchResultsInfo() {
    const info = document.createElement('div');
    info.id = 'searchResultsInfo';
    info.className = 'text-sm text-gray-600 dark:text-gray-400 mb-4';
    info.style.display = 'none';
    
    const toursSection = document.querySelector('#toursGrid').parentNode;
    toursSection.insertBefore(info, document.querySelector('#toursGrid'));
    
    return info;
}

function showError(message) {
    const grid = document.getElementById('toursGrid');
    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Tours</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">${message}</p>
            <button onclick="loadTours()" class="bg-primary text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition">
                <i class="fas fa-sync-alt mr-2"></i>Retry
            </button>
        </div>
    `;
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-white font-semibold ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Accessibility improvements
function initAccessibility() {
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Tab navigation for tour cards
        if (e.key === 'Tab') {
            const focusableElements = document.querySelectorAll('.tour-card, button, a, input, select, textarea');
            // Implement focus management
        }
        
        // Enter to activate focused tour card
        if (e.key === 'Enter' && e.target.classList.contains('tour-card')) {
            e.target.click();
        }
    });
}