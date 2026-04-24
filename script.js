// Validation Functions

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const numericPhone = phone.replace(/\D/g, '');
    return numericPhone.length >= 10;
}

function showFieldError(inputElement, message) {
    inputElement.classList.add('input-error');
    
    const existingError = inputElement.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorSpan = document.createElement('span');
    errorSpan.className = 'field-error';
    errorSpan.textContent = message;
    inputElement.parentElement.appendChild(errorSpan);
}

function clearFieldError(inputElement) {
    inputElement.classList.remove('input-error');
    
    const errorSpan = inputElement.parentElement.querySelector('.field-error');
    if (errorSpan) {
        errorSpan.remove();
    }
}

function validateCandidateForm() {
    const fullName = document.querySelector('#candidateForm input[name="full_name"]');
    const email = document.querySelector('#candidateForm input[name="email"]');
    const phone = document.querySelector('#candidateForm input[name="phone"]');
    
    clearFieldError(fullName);
    clearFieldError(email);
    clearFieldError(phone);
    
    let isValid = true;
    
    if (!fullName.value.trim()) {
        showFieldError(fullName, 'Full name is required');
        isValid = false;
    }
    
    if (!email.value.trim()) {
        showFieldError(email, 'Email is required');
        isValid = false;
    } else if (!validateEmail(email.value.trim())) {
        showFieldError(email, 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!phone.value.trim()) {
        showFieldError(phone, 'Phone number is required');
        isValid = false;
    } else if (!validatePhone(phone.value.trim())) {
        showFieldError(phone, 'Phone number must be at least 10 digits');
        isValid = false;
    }
    
    return isValid;
}

function validateClientForm() {
    const companyName = document.querySelector('#clientForm input[name="company_name"]');
    const hrName = document.querySelector('#clientForm input[name="hr_name"]');
    const email = document.querySelector('#clientForm input[name="email"]');
    const phone = document.querySelector('#clientForm input[name="phone"]');
    
    clearFieldError(companyName);
    clearFieldError(hrName);
    clearFieldError(email);
    clearFieldError(phone);
    
    let isValid = true;
    
    if (!companyName.value.trim()) {
        showFieldError(companyName, 'Company name is required');
        isValid = false;
    }
    
    if (!hrName.value.trim()) {
        showFieldError(hrName, 'HR name is required');
        isValid = false;
    }
    
    if (!email.value.trim()) {
        showFieldError(email, 'Email is required');
        isValid = false;
    } else if (!validateEmail(email.value.trim())) {
        showFieldError(email, 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!phone.value.trim()) {
        showFieldError(phone, 'Phone number is required');
        isValid = false;
    } else if (!validatePhone(phone.value.trim())) {
        showFieldError(phone, 'Phone number must be at least 10 digits');
        isValid = false;
    }
    
    return isValid;
}

// Form Submission Functions

async function handleCandidateSubmit(e) {
    e.preventDefault();
    
    if (!validateCandidateForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('candidateSubmit');
    const errorDiv = document.getElementById('candidateError');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    const formData = {
        full_name: document.querySelector('#candidateForm input[name="full_name"]').value.trim(),
        email: document.querySelector('#candidateForm input[name="email"]').value.trim(),
        phone: document.querySelector('#candidateForm input[name="phone"]').value.trim(),
        location: document.querySelector('#candidateForm input[name="location"]').value.trim(),
        skills: document.querySelector('#candidateForm input[name="skills"]').value.trim(),
        experience: document.querySelector('#candidateForm input[name="experience"]').value.trim()
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/register/candidate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success === true) {
            showSection('successScreen');
        } else if (response.status === 409) {
            errorDiv.textContent = 'This email is already registered';
            errorDiv.style.display = 'block';
        } else if (response.status === 400) {
            const errorMessage = data.errors && data.errors.length > 0 
                ? data.errors[0].msg 
                : 'Validation error';
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        } else {
            errorDiv.textContent = 'Something went wrong. Please try again.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Network error:', error);
        errorDiv.textContent = 'Something went wrong. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleClientSubmit(e) {
    e.preventDefault();
    
    if (!validateClientForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('clientSubmit');
    const errorDiv = document.getElementById('clientError');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    const formData = {
        company_name: document.querySelector('#clientForm input[name="company_name"]').value.trim(),
        hr_name: document.querySelector('#clientForm input[name="hr_name"]').value.trim(),
        email: document.querySelector('#clientForm input[name="email"]').value.trim(),
        phone: document.querySelector('#clientForm input[name="phone"]').value.trim(),
        requirements: document.querySelector('#clientForm textarea[name="requirements"]').value.trim()
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/register/client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success === true) {
            showSection('successScreen');
        } else if (response.status === 409) {
            errorDiv.textContent = 'This email is already registered';
            errorDiv.style.display = 'block';
        } else if (response.status === 400) {
            const errorMessage = data.errors && data.errors.length > 0 
                ? data.errors[0].msg 
                : 'Validation error';
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        } else {
            errorDiv.textContent = 'Something went wrong. Please try again.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Network error:', error);
        errorDiv.textContent = 'Something went wrong. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function showSection(sectionId) {
    // This function should be implemented to show/hide modal sections
    // Will be defined when HTML structure is created
    const sections = ['roleSelection', 'candidateForm', 'clientForm', 'successScreen'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = id === sectionId ? 'block' : 'none';
        }
    });
}

// Attach input event listeners to clear errors on keypress
document.addEventListener('DOMContentLoaded', function() {
    const candidateInputs = document.querySelectorAll('#candidateForm input, #candidateForm textarea');
    candidateInputs.forEach(input => {
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    const clientInputs = document.querySelectorAll('#clientForm input, #clientForm textarea');
    clientInputs.forEach(input => {
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    // Attach form submit handlers
    const candidateSubmitBtn = document.getElementById('candidateSubmit');
    if (candidateSubmitBtn) {
        candidateSubmitBtn.addEventListener('click', handleCandidateSubmit);
    }
    
    const clientSubmitBtn = document.getElementById('clientSubmit');
    if (clientSubmitBtn) {
        clientSubmitBtn.addEventListener('click', handleClientSubmit);
    }
    
    // Success screen "Done" button handler
    const successDoneBtn = document.querySelector('#successScreen button');
    if (successDoneBtn) {
        successDoneBtn.addEventListener('click', function() {
            // Close modal and reset
            const modal = document.getElementById('modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Reset forms
            const candidateForm = document.querySelector('#candidateForm form');
            const clientForm = document.querySelector('#clientForm form');
            if (candidateForm) candidateForm.reset();
            if (clientForm) clientForm.reset();
            
            // Show role selection screen
            showSection('roleSelection');
        });
    }
});
