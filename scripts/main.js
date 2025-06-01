// Nirvijay & Co Website JavaScript
// Handles form submission, validation, and UI interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the website
    initializeCaptcha();
    initializeScrollToTop();
    initializeSmoothScrolling();
    initializeContactForm();
});

// CAPTCHA functionality
let captchaAnswer = 0;

function initializeCaptcha() {
    generateCaptcha();
}

function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let question, answer;
    
    switch(operator) {
        case '+':
            question = `${num1} + ${num2}`;
            answer = num1 + num2;
            break;
        case '-':
            // Ensure positive result
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            question = `${larger} - ${smaller}`;
            answer = larger - smaller;
            break;
        case '*':
            const smallNum1 = Math.floor(Math.random() * 5) + 1;
            const smallNum2 = Math.floor(Math.random() * 5) + 1;
            question = `${smallNum1} × ${smallNum2}`;
            answer = smallNum1 * smallNum2;
            break;
    }
    
    document.getElementById('captchaQuestion').textContent = question;
    captchaAnswer = answer;
}

// Scroll to top functionality
function initializeScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Smooth scrolling for navigation links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Contact form handling
function initializeContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('formMessage');
    
    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('formMessage');
    
    // Get form data
    const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        company: form.company.value.trim(),
        service: form.service.value,
        message: form.message.value.trim(),
        captchaAnswer: parseInt(form.captchaAnswer.value) || 0
    };
    
    // Validate form
    const validation = validateForm(formData);
    if (!validation.isValid) {
        showMessage(validation.message, 'error');
        return;
    }
    
    // Validate CAPTCHA
    if (formData.captchaAnswer !== captchaAnswer) {
        showMessage('Please solve the math problem correctly.', 'error');
        document.getElementById('captchaAnswer').focus();
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    showMessage('Sending your message...', 'loading');
    
    try {
        // Submit to API
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...formData,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'Direct'
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('Thank you! Your message has been sent successfully. We\'ll get back to you soon.', 'success');
            form.reset();
            generateCaptcha(); // Generate new CAPTCHA
            
            // Track successful submission (optional analytics)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submit', {
                    event_category: 'Contact',
                    event_label: formData.service || 'General Inquiry'
                });
            }
        } else {
            throw new Error(result.error || 'Failed to send message');
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        showMessage('Sorry, there was an error sending your message. Please try again or contact us directly.', 'error');
        
        // Track error (optional analytics)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_error', {
                event_category: 'Contact',
                event_label: error.message
            });
        }
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
}

function validateForm(data) {
    // Name validation
    if (!data.name || data.name.length < 2) {
        return {
            isValid: false,
            message: 'Please enter your full name (at least 2 characters).'
        };
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        return {
            isValid: false,
            message: 'Please enter a valid email address.'
        };
    }
    
    // Message validation
    if (!data.message || data.message.length < 10) {
        return {
            isValid: false,
            message: 'Please enter a message (at least 10 characters).'
        };
    }
    
    // Name should not contain numbers or special characters (basic check)
    if (!/^[a-zA-Z\s.'-]+$/.test(data.name)) {
        return {
            isValid: false,
            message: 'Please enter a valid name (letters, spaces, dots, apostrophes, and hyphens only).'
        };
    }
    
    // Check for suspicious content (basic spam detection)
    const suspiciousWords = ['viagra', 'casino', 'loan', 'crypto', 'bitcoin', 'investment opportunity'];
    const messageContent = data.message.toLowerCase();
    const nameContent = data.name.toLowerCase();
    
    for (let word of suspiciousWords) {
        if (messageContent.includes(word) || nameContent.includes(word)) {
            return {
                isValid: false,
                message: 'Your message contains content that cannot be processed. Please revise and try again.'
            };
        }
    }
    
    return { isValid: true };
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
    
    // Scroll message into view
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Utility functions for enhanced user experience
function addFormFieldAnimations() {
    const formFields = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
    
    formFields.forEach(field => {
        field.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        field.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if field has value on load
        if (field.value) {
            field.parentElement.classList.add('focused');
        }
    });
}

// Initialize form animations
document.addEventListener('DOMContentLoaded', function() {
    addFormFieldAnimations();
});

// Handle service selection and auto-fill message
document.addEventListener('DOMContentLoaded', function() {
    const serviceSelect = document.getElementById('service');
    const messageField = document.getElementById('message');
    
    const serviceMessages = {
        'bookkeeping': 'I\'m interested in your Basic Monthly Bookkeeping services. Please provide more details about what\'s included and how we can get started.',
        'cfo': 'I\'d like to learn more about your Standard CFO Package. My business could benefit from financial analysis and strategic planning support.',
        'premium': 'I\'m interested in your Premium Advisory services for comprehensive CFO support and business growth consulting.',
        'consultation': 'I\'d like to schedule a free consultation to discuss my business\'s financial needs and how you can help.'
    };
    
    serviceSelect.addEventListener('change', function() {
        if (this.value && serviceMessages[this.value] && !messageField.value.trim()) {
            messageField.value = serviceMessages[this.value];
            messageField.focus();
        }
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Escape key to close any open modals or reset form messages
    if (e.key === 'Escape') {
        const messageDiv = document.getElementById('formMessage');
        if (messageDiv && messageDiv.style.display !== 'none') {
            messageDiv.style.display = 'none';
        }
    }
});

// Performance optimization: Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.service-card, .pricing-card, .stat-item');
    animateElements.forEach(el => observer.observe(el));
});

// Error handling for missing elements
function safeQuerySelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Element not found: ${selector}`);
    }
    return element;
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        generateCaptcha
    };
}