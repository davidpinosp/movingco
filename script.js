// Small enhancements: current year
document.getElementById('year').textContent = new Date().getFullYear();

// Configuration
let config = null;

// Load configuration
async function loadConfig() {
  try {
    const response = await fetch('config.json');
    config = await response.json();
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    // Fallback config
    return {
      pricing: {
        minimumPrice: 180,
        minimumHours: 3,
        hourlyRate: 60
      }
    };
  }
}

// Price Calculator Functionality
class PriceCalculator {
  constructor(config) {
    this.config = config;
    this.basePrice = 0;
    this.estimatedHours = 0;
    this.minimumHours = config.pricing.minimumHours;
    this.minimumPrice = config.pricing.minimumPrice;
    this.hourlyRate = config.pricing.hourlyRate;
    
    // Map room counts to estimated hours
    this.roomToHours = {
      1: 2.5,  // 1 room = 2.5 hours
      2: 4,    // 2 rooms = 4 hours  
      3: 5.5,  // 3 rooms = 5.5 hours
      4: 7     // 4+ rooms = 7 hours
    };
    
    this.init();
  }

  init() {
    this.setupRoomSelector();
    this.updatePrice();
  }

  setupRoomSelector() {
    const roomOptions = document.querySelectorAll('.room-option');
    
    roomOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        roomOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Get room count and calculate estimated hours
        const roomCount = parseInt(option.dataset.rooms);
        this.estimatedHours = this.roomToHours[roomCount];
        
        // Calculate base price using hourly model
        this.calculateBasePrice();
        
        this.updatePrice();
        this.animatePriceUpdate();
      });
    });
  }



  calculateBasePrice() {
    if (this.estimatedHours <= this.minimumHours) {
      // Use minimum price if estimated hours is less than or equal to minimum
      this.basePrice = this.minimumPrice;
    } else {
      // Calculate price: minimum + (additional hours * hourly rate)
      const additionalHours = this.estimatedHours - this.minimumHours;
      this.basePrice = this.minimumPrice + (additionalHours * this.hourlyRate);
    }
  }


  updatePrice() {
    const calculatedPrice = this.basePrice;
    // Ensure price never goes below minimum price (loaded from config)
    const totalPrice = Math.max(calculatedPrice, this.minimumPrice);
    const priceElement = document.getElementById('total-price');
    const breakdownElement = document.getElementById('price-breakdown');
    
    // Update total price
    priceElement.textContent = `$${totalPrice}`;
    
    // Update breakdown
    this.updateBreakdown(breakdownElement);
  }

  updateBreakdown(breakdownElement) {
    let breakdownHTML = '';
    
    if (this.basePrice <= 0) {
      breakdownHTML += `
        <div class="breakdown-item">
          <span>Selecciona el tamaño de tu hogar</span>
          <span>$0</span>
        </div>
      `;
      breakdownElement.innerHTML = breakdownHTML;
      return;
    }
    
    const selectedRoom = document.querySelector('.room-option.selected');
    const roomName = selectedRoom ? selectedRoom.querySelector('.room-name').textContent : 'Habitaciones seleccionadas';
    const calculatedPrice = this.basePrice;
    const totalPrice = Math.max(calculatedPrice, this.minimumPrice);
    
    // Show hourly breakdown
    if (this.estimatedHours <= this.minimumHours) {
      breakdownHTML += `
        <div class="breakdown-item">
          <span>Precio mínimo (${this.minimumHours}h)</span>
          <span>$${this.minimumPrice}</span>
        </div>
      `;
    } else {
      const additionalHours = this.estimatedHours - this.minimumHours;
      breakdownHTML += `
        <div class="breakdown-item">
          <span>Precio mínimo (${this.minimumHours}h)</span>
          <span>$${this.minimumPrice}</span>
        </div>
        <div class="breakdown-item">
          <span>Horas adicionales (${additionalHours}h × $${this.hourlyRate}/h)</span>
          <span>$${additionalHours * this.hourlyRate}</span>
        </div>
      `;
    }
    
    // Total at the end
    breakdownHTML += `
      <div class="breakdown-item total">
        <span>Total estimado</span>
        <span>$${totalPrice}</span>
      </div>
    `;
    
    breakdownElement.innerHTML = breakdownHTML;
  }

  animatePriceUpdate() {
    const priceElement = document.getElementById('total-price');
    priceElement.classList.add('updating');
    
    setTimeout(() => {
      priceElement.classList.remove('updating');
    }, 300);
  }
}

// Clipboard functionality for phone numbers
class ClipboardManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupPhoneClickHandlers();
  }

  setupPhoneClickHandlers() {
    // Get all phone number elements
    const phoneElements = document.querySelectorAll('.nav-phone, .phone-link');
    
    phoneElements.forEach(element => {
      element.addEventListener('click', (e) => {
        // Prevent default tel: link behavior
        e.preventDefault();
        
        // Extract phone number from the element text
        const phoneNumber = this.extractPhoneNumber(element.textContent);
        
        // Copy to clipboard
        this.copyToClipboard(phoneNumber);
      });
    });
  }

  extractPhoneNumber(text) {
    // Remove emoji and extra spaces, keep only the phone number
    return text.replace(/[^\d\s+]/g, '').trim();
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showCopyNotification();
    } catch (err) {
      // Fallback for older browsers
      this.fallbackCopyToClipboard(text);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopyNotification();
    } catch (err) {
      console.error('Failed to copy phone number:', err);
    }
    
    document.body.removeChild(textArea);
  }


  showCopyNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = '📋 Número copiado al portapapeles';
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      color: #0f172a;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// iOS Safari navbar fix
class IOSNavbarFix {
  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    this.lastScrollTop = 0;
    this.navbar = null;
    
    if (this.isIOS && this.isSafari) {
      this.init();
    }
  }

  init() {
    this.navbar = document.querySelector('.nav');
    if (!this.navbar) return;

    // Set initial viewport height
    this.setViewportHeight();
    
    // Handle scroll events
    this.handleScroll();
    
    // Handle orientation change
    this.handleOrientationChange();
    
    // Handle resize events
    this.handleResize();
  }

  setViewportHeight() {
    // Set CSS custom property for viewport height
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  handleScroll() {
    let ticking = false;
    
    const updateNavbar = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Add/remove class based on scroll direction
      if (scrollTop > this.lastScrollTop && scrollTop > 100) {
        // Scrolling down
        this.navbar.classList.add('nav-scrolled');
      } else {
        // Scrolling up
        this.navbar.classList.remove('nav-scrolled');
      }
      
      this.lastScrollTop = scrollTop;
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
  }

  handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
      // Delay to ensure viewport has updated
      setTimeout(() => {
        this.setViewportHeight();
        // Force a reflow to ensure navbar positioning is correct
        this.navbar.style.transform = 'translateZ(0)';
        setTimeout(() => {
          this.navbar.style.transform = '';
        }, 100);
      }, 500);
    });
  }

  handleResize() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.setViewportHeight();
      }, 250);
    });
  }
}

// Function to update all dynamic price displays
function updatePriceDisplays(config) {
  const { minimumPrice, minimumHours, hourlyRate } = config.pricing;
  
  // Update price notes (in calculator section)
  const priceNotes = document.querySelectorAll('[data-dynamic-price="note"]');
  priceNotes.forEach(note => {
    note.textContent = `Precio mínimo: $${minimumPrice} (${minimumHours}h) + $${hourlyRate}/h adicional`;
  });
  
  // Update result notes (detailed description)
  const resultNotes = document.querySelectorAll('[data-dynamic-price="description"]');
  resultNotes.forEach(note => {
    note.innerHTML = `💡 <strong>Precio estimado</strong> - Mínimo $${minimumPrice} por ${minimumHours} horas, luego $${hourlyRate}/h adicional. La cotización final puede variar según detalles específicos.`;
  });
  
  // Update schema.org structured data price range
  const schemaScript = document.querySelector('script[type="application/ld+json"]');
  if (schemaScript) {
    try {
      const schema = JSON.parse(schemaScript.textContent);
      schema.priceRange = `$${minimumPrice} - $500`;
      schemaScript.textContent = JSON.stringify(schema, null, 2);
    } catch (error) {
      console.error('Error updating schema:', error);
    }
  }
}

// Initialize price calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const config = await loadConfig();
  updatePriceDisplays(config);
  new PriceCalculator(config);
  new ClipboardManager();
  new IOSNavbarFix();
});
