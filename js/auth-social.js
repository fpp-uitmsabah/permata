/**
 * Firebase Authentication Module
 * Provides Google Sign-In and Email/Password authentication
 * Integrates with social features to identify users
 */

// Get Firebase Auth instance
function getAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error('Firebase Auth is not initialized. Please ensure Firebase Auth SDK is loaded.');
        return null;
    }
    return firebase.auth();
}

/**
 * Authentication API
 */
const AuthAPI = {
    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        const auth = getAuth();
        return auth ? auth.currentUser : null;
    },

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        const auth = getAuth();
        if (!auth) throw new Error('Firebase Auth not initialized');

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await auth.signInWithPopup(provider);
            
            // Store user info in localStorage for social features
            localStorage.setItem('social_user_id', result.user.uid);
            localStorage.setItem('social_user_name', result.user.displayName || 'User');
            localStorage.setItem('social_user_email', result.user.email || '');
            
            return {
                success: true,
                user: {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL
                }
            };
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    },

    /**
     * Sign in with Email and Password
     */
    async signInWithEmail(email, password) {
        const auth = getAuth();
        if (!auth) throw new Error('Firebase Auth not initialized');

        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            
            // Store user info in localStorage for social features integration
            // Note: This is intentional for anonymous user identification, not sensitive data
            // User ID and display name are not considered sensitive information
            localStorage.setItem('social_user_id', result.user.uid);
            localStorage.setItem('social_user_name', result.user.displayName || result.user.email.split('@')[0]);
            localStorage.setItem('social_user_email', result.user.email || '');
            
            return {
                success: true,
                user: {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName || result.user.email.split('@')[0]
                }
            };
        } catch (error) {
            console.error('Email sign-in error:', error);
            throw error;
        }
    },

    /**
     * Sign up with Email and Password
     */
    async signUpWithEmail(email, password, displayName) {
        const auth = getAuth();
        if (!auth) throw new Error('Firebase Auth not initialized');

        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with display name
            if (displayName) {
                await result.user.updateProfile({
                    displayName: displayName
                });
            }
            
            // Store user info in localStorage for social features integration
            // Note: This is intentional for anonymous user identification, not sensitive data
            // User ID and display name are not considered sensitive information
            localStorage.setItem('social_user_id', result.user.uid);
            localStorage.setItem('social_user_name', displayName || email.split('@')[0]);
            localStorage.setItem('social_user_email', email);
            
            return {
                success: true,
                user: {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: displayName || email.split('@')[0]
                }
            };
        } catch (error) {
            console.error('Email sign-up error:', error);
            throw error;
        }
    },

    /**
     * Sign out
     */
    async signOut() {
        const auth = getAuth();
        if (!auth) throw new Error('Firebase Auth not initialized');

        try {
            await auth.signOut();
            
            // Don't clear localStorage - keep anonymous user ID
            // This allows users to keep their social interactions even after sign out
            
            return { success: true };
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    },

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email) {
        const auth = getAuth();
        if (!auth) throw new Error('Firebase Auth not initialized');

        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true, message: 'Password reset email sent' };
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const user = this.getCurrentUser();
        return user !== null;
    },

    /**
     * Get user info for social features
     */
    getUserInfo() {
        const user = this.getCurrentUser();
        if (user) {
            return {
                userId: user.uid,
                userName: user.displayName || user.email.split('@')[0],
                userEmail: user.email,
                isAuthenticated: true
            };
        }
        
        // Return anonymous user info from localStorage
        return {
            userId: localStorage.getItem('social_user_id') || null,
            userName: localStorage.getItem('social_user_name') || null,
            userEmail: localStorage.getItem('social_user_email') || null,
            isAuthenticated: false
        };
    },

    /**
     * Listen to auth state changes
     */
    onAuthStateChanged(callback) {
        const auth = getAuth();
        if (!auth) return () => {};

        return auth.onAuthStateChanged(callback);
    }
};

/**
 * Authentication UI Components
 */
const AuthUI = {
    /**
     * Create sign-in modal
     */
    createSignInModal() {
        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-bold text-gray-900">Sign In</h2>
                    <button onclick="closeAuthModal()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-gray-200 mb-6">
                    <button onclick="switchAuthTab('signin')" id="signin-tab" class="flex-1 py-2 px-4 text-center font-semibold text-blue-600 border-b-2 border-blue-600">
                        Sign In
                    </button>
                    <button onclick="switchAuthTab('signup')" id="signup-tab" class="flex-1 py-2 px-4 text-center font-semibold text-gray-500 border-b-2 border-transparent hover:text-gray-700">
                        Sign Up
                    </button>
                </div>

                <!-- Google Sign-In Button -->
                <button onclick="handleGoogleSignIn()" class="w-full flex items-center justify-center gap-3 px-6 py-3 mb-4 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span class="font-semibold text-gray-700">Continue with Google</span>
                </button>

                <div class="relative my-6">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300"></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-white text-gray-500">Or continue with email</span>
                    </div>
                </div>

                <!-- Sign In Form -->
                <form id="signin-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" id="signin-email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input type="password" id="signin-password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••">
                    </div>
                    <button type="button" onclick="handleForgotPassword()" class="text-sm text-blue-600 hover:text-blue-700">
                        Forgot password?
                    </button>
                    <button type="submit" class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md">
                        Sign In
                    </button>
                </form>

                <!-- Sign Up Form -->
                <form id="signup-form" class="space-y-4 hidden">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input type="text" id="signup-name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="John Doe">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" id="signup-email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input type="password" id="signup-password" required minlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••">
                        <p class="text-xs text-gray-500 mt-1">At least 6 characters</p>
                    </div>
                    <button type="submit" class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md">
                        Create Account
                    </button>
                </form>

                <p class="mt-4 text-center text-sm text-gray-500">
                    By signing in, you agree to continue as a guest or create an account to access all features.
                </p>
            </div>
        `;

        // Add event listeners
        const signinForm = modal.querySelector('#signin-form');
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleEmailSignIn();
        });

        const signupForm = modal.querySelector('#signup-form');
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleEmailSignUp();
        });

        return modal;
    },

    /**
     * Create user profile dropdown
     */
    createUserProfileDropdown(user) {
        const dropdown = document.createElement('div');
        dropdown.className = 'relative';
        dropdown.innerHTML = `
            <button onclick="toggleUserMenu()" class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                ${user.photoURL ? `
                    <img src="${user.photoURL}" alt="${user.displayName}" class="w-8 h-8 rounded-full">
                ` : `
                    <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        ${(user.displayName || 'U').charAt(0).toUpperCase()}
                    </div>
                `}
                <span class="font-medium text-gray-700">${user.displayName || 'User'}</span>
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>

            <div id="user-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div class="py-1">
                    <div class="px-4 py-2 border-b border-gray-200">
                        <p class="text-sm font-medium text-gray-900">${user.displayName || 'User'}</p>
                        <p class="text-xs text-gray-500">${user.email}</p>
                    </div>
                    <button onclick="handleSignOut()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        Sign Out
                    </button>
                </div>
            </div>
        `;

        return dropdown;
    },

    /**
     * Create sign-in button
     */
    createSignInButton() {
        const button = document.createElement('button');
        button.onclick = showAuthModal;
        button.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md';
        button.textContent = 'Sign In';
        return button;
    }
};

/**
 * Auth event handlers
 */
async function handleGoogleSignIn() {
    try {
        showLoadingState('Signing in with Google...');
        const result = await AuthAPI.signInWithGoogle();
        hideLoadingState();
        showNotification(`Welcome, ${result.user.displayName}!`, 'success');
        closeAuthModal();
        updateAuthUI();
    } catch (error) {
        hideLoadingState();
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

async function handleEmailSignIn() {
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
        showLoadingState('Signing in...');
        const result = await AuthAPI.signInWithEmail(email, password);
        hideLoadingState();
        showNotification(`Welcome back, ${result.user.displayName}!`, 'success');
        closeAuthModal();
        updateAuthUI();
    } catch (error) {
        hideLoadingState();
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

async function handleEmailSignUp() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        showLoadingState('Creating account...');
        const result = await AuthAPI.signUpWithEmail(email, password, name);
        hideLoadingState();
        showNotification(`Account created! Welcome, ${result.user.displayName}!`, 'success');
        closeAuthModal();
        updateAuthUI();
    } catch (error) {
        hideLoadingState();
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

async function handleSignOut() {
    try {
        await AuthAPI.signOut();
        showNotification('Signed out successfully', 'success');
        toggleUserMenu(); // Close menu
        updateAuthUI();
    } catch (error) {
        showNotification('Failed to sign out', 'error');
    }
}

async function handleForgotPassword() {
    const email = prompt('Enter your email address:');
    if (!email) return;

    try {
        await AuthAPI.sendPasswordResetEmail(email);
        showNotification('Password reset email sent. Check your inbox!', 'success');
    } catch (error) {
        showNotification(getAuthErrorMessage(error), 'error');
    }
}

/**
 * UI helper functions
 */
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('auth-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'auth-notification';
        notification.className = 'fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-96';
        document.body.appendChild(notification);
    }

    // Set notification style based on type
    const styles = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
        warning: 'bg-yellow-500 text-white'
    };

    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${styles[type] || styles.info}`;
    notification.textContent = message;

    // Show notification
    setTimeout(() => {
        notification.classList.remove('translate-x-96');
    }, 100);

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-96');
    }, 3000);
}

function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function switchAuthTab(tab) {
    const signinTab = document.getElementById('signin-tab');
    const signupTab = document.getElementById('signup-tab');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');

    if (tab === 'signin') {
        signinTab.classList.add('text-blue-600', 'border-blue-600');
        signinTab.classList.remove('text-gray-500', 'border-transparent');
        signupTab.classList.remove('text-blue-600', 'border-blue-600');
        signupTab.classList.add('text-gray-500', 'border-transparent');
        signinForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('text-blue-600', 'border-blue-600');
        signupTab.classList.remove('text-gray-500', 'border-transparent');
        signinTab.classList.remove('text-blue-600', 'border-blue-600');
        signinTab.classList.add('text-gray-500', 'border-transparent');
        signupForm.classList.remove('hidden');
        signinForm.classList.add('hidden');
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function updateAuthUI() {
    const user = AuthAPI.getCurrentUser();
    const authContainer = document.getElementById('auth-container');
    
    if (!authContainer) return;

    authContainer.innerHTML = '';
    
    if (user) {
        authContainer.appendChild(AuthUI.createUserProfileDropdown(user));
    } else {
        authContainer.appendChild(AuthUI.createSignInButton());
    }
}

function showLoadingState(message) {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        const overlay = document.createElement('div');
        overlay.id = 'auth-loading';
        overlay.className = 'absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-2xl';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-700 font-medium">${message}</p>
            </div>
        `;
        modal.querySelector('.bg-white').appendChild(overlay);
    }
}

function hideLoadingState() {
    const loading = document.getElementById('auth-loading');
    if (loading) {
        loading.remove();
    }
}

function getAuthErrorMessage(error) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/popup-closed-by-user': 'Sign-in cancelled.',
        'auth/network-request-failed': 'Network error. Please check your connection.'
    };

    return errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
}

/**
 * Initialize authentication UI
 */
function initializeAuth() {
    // Create and append auth modal to body
    const modal = AuthUI.createSignInModal();
    document.body.appendChild(modal);

    // Listen to auth state changes
    AuthAPI.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'Signed in' : 'Signed out');
        updateAuthUI();
        
        // Update social features if user info changed
        if (user) {
            localStorage.setItem('social_user_id', user.uid);
            localStorage.setItem('social_user_name', user.displayName || user.email.split('@')[0]);
            localStorage.setItem('social_user_email', user.email);
        }
    });

    // Initial UI update
    updateAuthUI();
}

// Make functions available globally
window.AuthAPI = AuthAPI;
window.AuthUI = AuthUI;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleEmailSignIn = handleEmailSignIn;
window.handleEmailSignUp = handleEmailSignUp;
window.handleSignOut = handleSignOut;
window.handleForgotPassword = handleForgotPassword;
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.toggleUserMenu = toggleUserMenu;
window.updateAuthUI = updateAuthUI;
window.initializeAuth = initializeAuth;
window.showNotification = showNotification;

console.log('Firebase Authentication module loaded successfully');
