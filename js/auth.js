/**
 * Portfolio Authentication Module
 * Handles Google Sign-In and Staff ID authentication for faculty portfolio pages
 */

// Initialize Firebase Auth
let auth;
let currentUser = null;

function initAuth() {
    try {
        auth = firebase.auth();
        
        // Set up auth state observer
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            updateAuthUI(user);
        });
    } catch (error) {
        console.error('Auth initialization error:', error);
    }
}

/**
 * Check if current user is authorized to edit this portfolio page
 * @param {string} employeeId - The employee ID associated with this portfolio
 * @param {string} portfolioEmail - The email associated with this portfolio
 * @returns {Promise<boolean>} - Whether user is authorized
 */
async function checkEditAuthorization(employeeId, portfolioEmail) {
    if (!currentUser) {
        return false;
    }

    // Check if user's email matches the portfolio email
    if (currentUser.email && portfolioEmail && 
        currentUser.email.toLowerCase() === portfolioEmail.toLowerCase()) {
        return true;
    }

    // Check custom claims or staff ID stored in user profile
    const staffIdMatch = await checkStaffIdAuthorization(employeeId);
    return staffIdMatch;
}

/**
 * Check staff ID authorization
 */
async function checkStaffIdAuthorization(employeeId) {
    try {
        // Get custom claims from ID token
        const idTokenResult = await currentUser.getIdTokenResult();
        return idTokenResult.claims.employeeId === employeeId;
    } catch (error) {
        console.error('Error checking staff ID authorization:', error);
        return false;
    }
}

/**
 * Sign in with Google
 */
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        return result.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
}

/**
 * Sign in with staff ID (secret code)
 */
async function signInWithStaffId(employeeId, secretCode) {
    try {
        // Create a custom token request - this would need a backend endpoint
        // For now, we'll use Firebase's custom auth
        const response = await fetch('/api/auth/staff-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, secretCode })
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const { customToken } = await response.json();
        await auth.signInWithCustomToken(customToken);
        return auth.currentUser;
    } catch (error) {
        console.error('Staff ID sign-in error:', error);
        throw error;
    }
}

/**
 * Sign out current user
 */
async function signOut() {
    try {
        await auth.signOut();
        currentUser = null;
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

/**
 * Update authentication UI based on user state
 */
function updateAuthUI(user) {
    const authButton = document.getElementById('authButton');
    const editButton = document.getElementById('editButton');
    const userInfo = document.getElementById('userInfo');

    if (!authButton) return;

    if (user) {
        authButton.textContent = 'Sign Out';
        authButton.onclick = handleSignOut;
        
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="flex items-center space-x-2">
                    <img src="${user.photoURL || '/images/default-avatar.png'}" 
                         alt="User" 
                         class="w-8 h-8 rounded-full">
                    <span class="text-sm">${user.displayName || user.email}</span>
                </div>
            `;
        }
    } else {
        authButton.textContent = 'Sign In';
        authButton.onclick = showAuthModal;
        
        if (editButton) {
            editButton.style.display = 'none';
        }
        
        if (userInfo) {
            userInfo.innerHTML = '';
        }
    }
}

/**
 * Show authentication modal
 */
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Hide authentication modal
 */
function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Handle Google Sign-In button click
 */
async function handleGoogleSignIn() {
    try {
        await signInWithGoogle();
        hideAuthModal();
        
        // Check if user can edit this page
        const employeeId = document.querySelector('[data-employee-id]')?.dataset.employeeId;
        const portfolioEmail = document.querySelector('[data-portfolio-email]')?.dataset.portfolioEmail;
        
        if (employeeId || portfolioEmail) {
            const canEdit = await checkEditAuthorization(employeeId, portfolioEmail);
            if (canEdit) {
                showEditButton();
            } else {
                alert('You are not authorized to edit this portfolio page.');
            }
        }
    } catch (error) {
        alert('Sign in failed: ' + error.message);
    }
}

/**
 * Handle Staff ID sign-in form submission
 */
async function handleStaffIdSignIn(event) {
    event.preventDefault();
    
    const employeeId = document.getElementById('staffEmployeeId').value.trim();
    const secretCode = document.getElementById('staffSecretCode').value.trim();
    
    if (!employeeId || !secretCode) {
        alert('Please enter both Employee ID and Secret Code');
        return;
    }
    
    try {
        await signInWithStaffId(employeeId, secretCode);
        hideAuthModal();
        
        // Check if user can edit this page
        const pageEmployeeId = document.querySelector('[data-employee-id]')?.dataset.employeeId;
        
        if (pageEmployeeId === employeeId) {
            showEditButton();
        } else {
            alert('You are not authorized to edit this portfolio page.');
            await signOut();
        }
    } catch (error) {
        alert('Sign in failed: ' + error.message);
    }
}

/**
 * Handle sign out
 */
async function handleSignOut() {
    try {
        await signOut();
        hideEditButton();
        exitEditMode();
    } catch (error) {
        alert('Sign out failed: ' + error.message);
    }
}

/**
 * Show edit button
 */
function showEditButton() {
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.style.display = 'inline-flex';
    }
}

/**
 * Hide edit button
 */
function hideEditButton() {
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.style.display = 'none';
    }
}

/**
 * Enter edit mode
 */
function enterEditMode() {
    const editableElements = document.querySelectorAll('[data-editable]');
    editableElements.forEach(element => {
        element.contentEditable = true;
        element.classList.add('editable-active');
    });
    
    const editControls = document.getElementById('editControls');
    if (editControls) {
        editControls.style.display = 'flex';
    }
    
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.style.display = 'none';
    }
}

/**
 * Exit edit mode
 */
function exitEditMode() {
    const editableElements = document.querySelectorAll('[data-editable]');
    editableElements.forEach(element => {
        element.contentEditable = false;
        element.classList.remove('editable-active');
    });
    
    const editControls = document.getElementById('editControls');
    if (editControls) {
        editControls.style.display = 'none';
    }
    
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.style.display = 'inline-flex';
    }
}

/**
 * Save changes
 */
async function saveChanges() {
    const editableElements = document.querySelectorAll('[data-editable]');
    const changes = {};
    
    editableElements.forEach(element => {
        const field = element.dataset.field;
        changes[field] = element.textContent || element.innerHTML;
    });
    
    try {
        // This would send changes to a backend API
        const employeeId = document.querySelector('[data-employee-id]')?.dataset.employeeId;
        
        const response = await fetch('/api/portfolio/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await currentUser.getIdToken()}`
            },
            body: JSON.stringify({ employeeId, changes })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save changes');
        }
        
        alert('Changes saved successfully!');
        exitEditMode();
    } catch (error) {
        alert('Failed to save changes: ' + error.message);
        console.error('Save error:', error);
    }
}

/**
 * Cancel editing
 */
function cancelEdit() {
    if (confirm('Discard all changes?')) {
        // Reload the page to reset content
        window.location.reload();
    }
}

// Export functions for use in HTML
if (typeof window !== 'undefined') {
    window.initAuth = initAuth;
    window.showAuthModal = showAuthModal;
    window.hideAuthModal = hideAuthModal;
    window.handleGoogleSignIn = handleGoogleSignIn;
    window.handleStaffIdSignIn = handleStaffIdSignIn;
    window.handleSignOut = handleSignOut;
    window.enterEditMode = enterEditMode;
    window.exitEditMode = exitEditMode;
    window.saveChanges = saveChanges;
    window.cancelEdit = cancelEdit;
}
