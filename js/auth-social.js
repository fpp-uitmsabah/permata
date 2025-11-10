/**
 * Initializes Firebase Authentication and updates the UI.
 * @param {boolean} [showLoginButton=true] - If true, shows the "Sign In" button when logged out. If false, shows nothing.
 */
function initializeAuth(showLoginButton = true) {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) {
        console.error('Authentication container #auth-container not found.');
        return;
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            authContainer.innerHTML = `
                <span>Welcome, ${user.displayName.split(' ')[0]}!</span>
                <button id="signOutBtn" title="Sign Out">Sign Out</button>
            `;
            
            // Add event listener for the new sign-out button
            document.getElementById('signOutBtn').addEventListener('click', () => {
                firebase.auth().signOut()
                    .then(() => {
                        console.log('User signed out successfully.');
                        // Page will auto-refresh or update via onAuthStateChanged
                    })
                    .catch(error => {
                        console.error('Sign out error:', error);
                    });
            });

        } else {
            // User is signed out
            if (showLoginButton) {
                // If on index.html (showLoginButton is true), show the sign-in button
                authContainer.innerHTML = `
                    <button id="signInBtn">Sign In with Google</button>
                `;
                
                // Add event listener for the new sign-in button
                document.getElementById('signInBtn').addEventListener('click', () => {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    firebase.auth().signInWithPopup(provider)
                        .then(result => {
                            console.log('User signed in:', result.user.displayName);
                            // Page will auto-refresh or update via onAuthStateChanged
                        })
                        .catch(error => {
                            console.error('Sign in error:', error.message);
                        });
                });
            } else {
                // If on a subpage (showLoginButton is false), show nothing
                authContainer.innerHTML = '';
            }
        }
    });
}
