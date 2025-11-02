/**
 * Social Media Features Module - Firebase Implementation
 * Provides like, comment, follow, and share functionality using Firebase Firestore
 * No backend server required - works entirely client-side with Firebase
 */

// Firebase will be initialized by the page
// Make sure firebase-app.js and firebase-firestore.js are loaded

/**
 * Generate a unique user ID for anonymous users
 * This is stored in localStorage to maintain consistency
 */
function getUserId() {
    let userId = localStorage.getItem('social_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('social_user_id', userId);
    }
    return userId;
}

/**
 * Get or prompt for user name
 */
function getUserName() {
    let userName = localStorage.getItem('social_user_name');
    if (!userName) {
        userName = prompt('Please enter your name to continue:');
        if (userName && userName.trim()) {
            localStorage.setItem('social_user_name', userName.trim());
        } else {
            return null;
        }
    }
    return userName;
}

/**
 * Get Firestore reference
 */
function getFirestore() {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('Firebase is not initialized. Please ensure Firebase is loaded before this script.');
        return null;
    }
    return firebase.firestore();
}

/**
 * Social Media API Client - Firebase Implementation
 */
const SocialAPI = {
    /**
     * Like or react to a faculty profile
     */
    async like(facultyId, reactionType = 'like') {
        const db = getFirestore();
        if (!db) throw new Error('Firebase not initialized');
        
        const userId = getUserId();
        const userName = getUserName();
        
        if (!userName) {
            throw new Error('User name is required');
        }

        try {
            const likeRef = db.collection('likes').doc(`${facultyId}_${userId}`);
            await likeRef.set({
                facultyId,
                userId,
                userName,
                reactionType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Get updated count
            const likesCount = await this.getLikesCount(facultyId);
            return { success: true, likesCount };
        } catch (error) {
            console.error('Error liking:', error);
            throw error;
        }
    },

    /**
     * Remove like from a faculty profile
     */
    async unlike(facultyId) {
        const db = getFirestore();
        if (!db) throw new Error('Firebase not initialized');
        
        const userId = getUserId();

        try {
            const likeRef = db.collection('likes').doc(`${facultyId}_${userId}`);
            await likeRef.delete();

            // Get updated count
            const likesCount = await this.getLikesCount(facultyId);
            return { success: true, likesCount };
        } catch (error) {
            console.error('Error unliking:', error);
            throw error;
        }
    },

    /**
     * Get likes count for a faculty profile
     */
    async getLikesCount(facultyId) {
        const db = getFirestore();
        if (!db) return 0;
        
        try {
            const snapshot = await db.collection('likes')
                .where('facultyId', '==', facultyId)
                .get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting likes count:', error);
            return 0;
        }
    },

    /**
     * Get likes for a faculty profile
     */
    async getLikes(facultyId) {
        const db = getFirestore();
        if (!db) return { likesCount: 0, likes: [] };
        
        try {
            const snapshot = await db.collection('likes')
                .where('facultyId', '==', facultyId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const likes = [];
            snapshot.forEach(doc => {
                likes.push({ id: doc.id, ...doc.data() });
            });
            
            return {
                likesCount: likes.length,
                likes
            };
        } catch (error) {
            console.error('Error getting likes:', error);
            return { likesCount: 0, likes: [] };
        }
    },

    /**
     * Check if current user has liked a profile
     */
    async hasUserLiked(facultyId) {
        const db = getFirestore();
        if (!db) return false;
        
        const userId = getUserId();
        try {
            const likeRef = db.collection('likes').doc(`${facultyId}_${userId}`);
            const doc = await likeRef.get();
            return doc.exists;
        } catch (error) {
            console.error('Error checking like status:', error);
            return false;
        }
    },

    /**
     * Add a comment to a faculty profile
     */
    async addComment(facultyId, content) {
        const db = getFirestore();
        if (!db) throw new Error('Firebase not initialized');
        
        const userId = getUserId();
        const userName = getUserName();
        
        if (!userName) {
            throw new Error('User name is required');
        }

        if (!content || content.trim().length === 0) {
            throw new Error('Comment cannot be empty');
        }

        if (content.length > 2000) {
            throw new Error('Comment is too long. Maximum 2000 characters allowed.');
        }

        try {
            const commentRef = await db.collection('comments').add({
                facultyId,
                userId,
                userName,
                content: content.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Get updated count
            const commentsCount = await this.getCommentsCount(facultyId);
            
            return {
                success: true,
                comment: {
                    id: commentRef.id,
                    facultyId,
                    userId,
                    userName,
                    content: content.trim(),
                    createdAt: new Date()
                },
                commentsCount
            };
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },

    /**
     * Get comments count for a faculty profile
     */
    async getCommentsCount(facultyId) {
        const db = getFirestore();
        if (!db) return 0;
        
        try {
            const snapshot = await db.collection('comments')
                .where('facultyId', '==', facultyId)
                .get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting comments count:', error);
            return 0;
        }
    },

    /**
     * Get comments for a faculty profile
     */
    async getComments(facultyId, limit = 50, offset = 0) {
        const db = getFirestore();
        if (!db) return { comments: [], commentsCount: 0, hasMore: false };
        
        try {
            let query = db.collection('comments')
                .where('facultyId', '==', facultyId)
                .orderBy('createdAt', 'desc')
                .limit(limit);
            
            // Note: Firestore doesn't have offset, so we'd need to use pagination tokens
            // For simplicity, we'll just limit the results
            
            const snapshot = await query.get();
            
            const comments = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                comments.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                });
            });
            
            const totalCount = await this.getCommentsCount(facultyId);
            
            return {
                comments,
                commentsCount: totalCount,
                hasMore: totalCount > limit
            };
        } catch (error) {
            console.error('Error getting comments:', error);
            return { comments: [], commentsCount: 0, hasMore: false };
        }
    },

    /**
     * Delete a comment
     */
    async deleteComment(commentId) {
        const db = getFirestore();
        if (!db) throw new Error('Firebase not initialized');
        
        const userId = getUserId();

        try {
            // Check if comment exists and belongs to user
            const commentRef = db.collection('comments').doc(commentId);
            const doc = await commentRef.get();
            
            if (!doc.exists) {
                throw new Error('Comment not found');
            }
            
            const comment = doc.data();
            if (comment.userId !== userId) {
                throw new Error('Not authorized to delete this comment');
            }

            await commentRef.delete();
            
            return { success: true, message: 'Comment deleted successfully' };
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    },

    /**
     * Follow a faculty member
     */
    async follow(facultyId) {
        const db = getFirestore();
        if (!db) throw new Error('Firebase not initialized');
        
        const userId = getUserId();
        const userName = getUserName();
        
        if (!userName) {
            throw new Error('User name is required');
        }

        try {
            const followRef = db.collection('follows').doc(`${facultyId}_${userId}`);
            await followRef.set({
                facultyId,
                userId,
                userName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Get updated count
            const followersCount = await this.getFollowersCount(facultyId);
            
            return {
                success: true,
                followersCount
            };
        } catch (error) {
            console.error('Error following:', error);
            throw error;
        }
    },

    /**
     * Unfollow a faculty member
     */
    async unfollow(facultyId) {
        const db = getFirestore();
        if (!db) throw new Error('Firebase not initialized');
        
        const userId = getUserId();

        try {
            const followRef = db.collection('follows').doc(`${facultyId}_${userId}`);
            await followRef.delete();

            // Get updated count
            const followersCount = await this.getFollowersCount(facultyId);
            
            return {
                success: true,
                followersCount
            };
        } catch (error) {
            console.error('Error unfollowing:', error);
            throw error;
        }
    },

    /**
     * Get followers count for a faculty profile
     */
    async getFollowersCount(facultyId) {
        const db = getFirestore();
        if (!db) return 0;
        
        try {
            const snapshot = await db.collection('follows')
                .where('facultyId', '==', facultyId)
                .get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting followers count:', error);
            return 0;
        }
    },

    /**
     * Get followers for a faculty profile
     */
    async getFollowers(facultyId) {
        const db = getFirestore();
        if (!db) return { followersCount: 0, followers: [] };
        
        try {
            const snapshot = await db.collection('follows')
                .where('facultyId', '==', facultyId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const followers = [];
            snapshot.forEach(doc => {
                followers.push({ id: doc.id, ...doc.data() });
            });
            
            return {
                followersCount: followers.length,
                followers
            };
        } catch (error) {
            console.error('Error getting followers:', error);
            return { followersCount: 0, followers: [] };
        }
    },

    /**
     * Check if current user is following a profile
     */
    async isFollowing(facultyId) {
        const db = getFirestore();
        if (!db) return false;
        
        const userId = getUserId();
        try {
            const followRef = db.collection('follows').doc(`${facultyId}_${userId}`);
            const doc = await followRef.get();
            return doc.exists;
        } catch (error) {
            console.error('Error checking follow status:', error);
            return false;
        }
    },

    /**
     * Get social stats for a faculty profile
     */
    async getStats(facultyId) {
        try {
            const [likesCount, commentsCount, followersCount] = await Promise.all([
                this.getLikesCount(facultyId),
                this.getCommentsCount(facultyId),
                this.getFollowersCount(facultyId)
            ]);

            return {
                likesCount,
                commentsCount,
                followersCount
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                likesCount: 0,
                commentsCount: 0,
                followersCount: 0
            };
        }
    }
};

/**
 * Social Media UI Components
 */
const SocialUI = {
    /**
     * Create social action buttons
     */
    createSocialButtons(facultyId, options = {}) {
        const container = document.createElement('div');
        container.className = 'social-actions flex flex-wrap items-center gap-3 mt-4';
        container.innerHTML = `
            <button 
                onclick="handleLikeClick('${facultyId}')" 
                id="like-btn-${facultyId}"
                class="social-btn like-btn flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
                title="Like this profile">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                </svg>
                <span id="like-count-${facultyId}">0</span>
            </button>

            <button 
                onclick="handleCommentClick('${facultyId}')" 
                id="comment-btn-${facultyId}"
                class="social-btn comment-btn flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
                title="Comment on this profile">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                </svg>
                <span id="comment-count-${facultyId}">0</span>
            </button>

            <button 
                onclick="handleFollowClick('${facultyId}')" 
                id="follow-btn-${facultyId}"
                class="social-btn follow-btn flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
                title="Follow this faculty member">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path>
                </svg>
                <span id="follow-text-${facultyId}">Follow</span>
                <span id="follower-count-${facultyId}" class="text-xs opacity-75">(0)</span>
            </button>

            <button 
                onclick="handleShareClick('${facultyId}')" 
                class="social-btn share-btn flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
                title="Share this profile">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                </svg>
                Share
            </button>
        `;
        
        return container;
    },

    /**
     * Create comments section
     */
    createCommentsSection(facultyId) {
        const section = document.createElement('div');
        section.id = `comments-section-${facultyId}`;
        section.className = 'comments-section mt-6 hidden';
        section.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h3 class="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg class="w-6 h-6 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"></path>
                    </svg>
                    Comments
                </h3>
                
                <!-- Comment input -->
                <div class="mb-6">
                    <textarea 
                        id="comment-input-${facultyId}"
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none resize-none"
                        rows="3"
                        maxlength="2000"
                        placeholder="Share your thoughts..."
                        oninput="updateCharCount('${facultyId}', this.value)"></textarea>
                    <div class="flex justify-between items-center mt-2">
                        <span id="char-count-${facultyId}" class="text-xs text-gray-500">0 / 2000 characters</span>
                        <button 
                            onclick="submitComment('${facultyId}')"
                            class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md">
                            Post Comment
                        </button>
                    </div>
                </div>
                
                <!-- Comments list -->
                <div id="comments-list-${facultyId}" class="space-y-4">
                    <!-- Comments will be loaded here -->
                </div>
            </div>
        `;
        
        return section;
    },

    /**
     * Render a single comment
     */
    renderComment(comment, canDelete = false) {
        const date = comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt);
        const timeAgo = this.getTimeAgo(date);
        
        return `
            <div class="comment-item bg-gray-50 rounded-lg p-4 border-l-4 border-green-500 animate-fadeIn" data-comment-id="${comment.id}">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            ${comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900">${this.escapeHtml(comment.userName)}</div>
                            <div class="text-xs text-gray-500">${timeAgo}</div>
                        </div>
                    </div>
                    ${canDelete ? `
                        <button 
                            onclick="deleteComment('${comment.id}')"
                            class="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            title="Delete comment">
                            Delete
                        </button>
                    ` : ''}
                </div>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${this.escapeHtml(comment.content)}</p>
            </div>
        `;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
            }
        }
        
        return 'Just now';
    }
};

/**
 * Initialize social features for a faculty profile
 */
async function initSocialFeatures(facultyId) {
    try {
        console.log('Initializing social features for:', facultyId);
        
        // Get social stats
        const stats = await SocialAPI.getStats(facultyId);
        console.log('Social stats loaded:', stats);
        
        // Update UI with stats
        const likesCountEl = document.getElementById(`like-count-${facultyId}`);
        const commentsCountEl = document.getElementById(`comment-count-${facultyId}`);
        const followerCountEl = document.getElementById(`follower-count-${facultyId}`);
        
        if (likesCountEl) likesCountEl.textContent = stats.likesCount;
        if (commentsCountEl) commentsCountEl.textContent = stats.commentsCount;
        if (followerCountEl) followerCountEl.textContent = `(${stats.followersCount})`;
        
        // Check if user has liked
        const hasLiked = await SocialAPI.hasUserLiked(facultyId);
        const likeBtn = document.getElementById(`like-btn-${facultyId}`);
        if (likeBtn && hasLiked) {
            likeBtn.classList.add('liked');
            likeBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            likeBtn.classList.add('bg-blue-700');
        }
        
        // Check if user is following
        const isFollowing = await SocialAPI.isFollowing(facultyId);
        const followBtn = document.getElementById(`follow-btn-${facultyId}`);
        const followText = document.getElementById(`follow-text-${facultyId}`);
        if (followBtn && isFollowing) {
            followBtn.classList.add('following');
            followBtn.classList.remove('bg-purple-500', 'hover:bg-purple-600');
            followBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');
            if (followText) followText.textContent = 'Following';
        }
        
        console.log('Social features initialized successfully');
    } catch (error) {
        console.error('Error initializing social features:', error);
        // Show user-friendly error message
        showNotification('Unable to load social features. Please refresh the page.', 'error');
    }
}

/**
 * Handle like button click
 */
async function handleLikeClick(facultyId) {
    const likeBtn = document.getElementById(`like-btn-${facultyId}`);
    const likeCount = document.getElementById(`like-count-${facultyId}`);
    
    if (!likeBtn) return;
    
    // Disable button during operation
    likeBtn.disabled = true;
    
    try {
        const hasLiked = likeBtn.classList.contains('liked');
        
        if (hasLiked) {
            // Unlike
            const result = await SocialAPI.unlike(facultyId);
            likeBtn.classList.remove('liked', 'bg-blue-700');
            likeBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            if (likeCount) likeCount.textContent = result.likesCount;
            showNotification('Unliked successfully!', 'success');
        } else {
            // Like
            const result = await SocialAPI.like(facultyId);
            likeBtn.classList.add('liked');
            likeBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            likeBtn.classList.add('bg-blue-700');
            if (likeCount) likeCount.textContent = result.likesCount;
            showNotification('Liked successfully!', 'success');
        }
    } catch (error) {
        console.error('Error liking/unliking:', error);
        showNotification('Failed to like. Please try again.', 'error');
    } finally {
        likeBtn.disabled = false;
    }
}

/**
 * Handle comment button click
 */
async function handleCommentClick(facultyId) {
    const commentsSection = document.getElementById(`comments-section-${facultyId}`);
    if (!commentsSection) return;
    
    const isHidden = commentsSection.classList.contains('hidden');
    
    if (isHidden) {
        // Show comments section
        commentsSection.classList.remove('hidden');
        
        // Load comments
        await loadComments(facultyId);
    } else {
        // Hide comments section
        commentsSection.classList.add('hidden');
    }
}

/**
 * Load comments for a faculty profile
 */
async function loadComments(facultyId) {
    const commentsList = document.getElementById(`comments-list-${facultyId}`);
    if (!commentsList) return;
    
    try {
        commentsList.innerHTML = '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div></div>';
        
        const result = await SocialAPI.getComments(facultyId);
        const userId = getUserId();
        
        if (result.comments.length === 0) {
            commentsList.innerHTML = '<p class="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>';
            return;
        }
        
        commentsList.innerHTML = result.comments.map(comment => {
            const canDelete = comment.userId === userId;
            return SocialUI.renderComment(comment, canDelete);
        }).join('');
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<p class="text-center text-red-500 py-4">Failed to load comments. Please try again.</p>';
    }
}

/**
 * Submit a comment
 */
async function submitComment(facultyId) {
    const input = document.getElementById(`comment-input-${facultyId}`);
    if (!input) return;
    
    const content = input.value.trim();
    
    if (!content) {
        showNotification('Please enter a comment', 'warning');
        return;
    }
    
    try {
        await SocialAPI.addComment(facultyId, content);
        input.value = '';
        updateCharCount(facultyId, '');
        
        // Reload comments
        await loadComments(facultyId);
        
        // Update comment count
        const stats = await SocialAPI.getStats(facultyId);
        const commentsCountEl = document.getElementById(`comment-count-${facultyId}`);
        if (commentsCountEl) commentsCountEl.textContent = stats.commentsCount;
        
        showNotification('Comment posted successfully!', 'success');
    } catch (error) {
        console.error('Error posting comment:', error);
        showNotification('Failed to post comment. Please try again.', 'error');
    }
}

/**
 * Delete a comment
 */
async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    try {
        await SocialAPI.deleteComment(commentId);
        
        // Remove comment from UI
        const commentEl = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentEl) {
            commentEl.style.opacity = '0';
            setTimeout(() => commentEl.remove(), 300);
        }
        
        showNotification('Comment deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting comment:', error);
        showNotification('Failed to delete comment. Please try again.', 'error');
    }
}

/**
 * Update character count
 */
function updateCharCount(facultyId, value) {
    const charCount = document.getElementById(`char-count-${facultyId}`);
    if (charCount) {
        const count = value.length;
        charCount.textContent = `${count} / 2000 characters`;
        
        if (count > 2000) {
            charCount.classList.add('text-red-500');
        } else {
            charCount.classList.remove('text-red-500');
        }
    }
}

/**
 * Handle follow button click
 */
async function handleFollowClick(facultyId) {
    const followBtn = document.getElementById(`follow-btn-${facultyId}`);
    const followText = document.getElementById(`follow-text-${facultyId}`);
    const followerCount = document.getElementById(`follower-count-${facultyId}`);
    
    if (!followBtn) return;
    
    // Disable button during operation
    followBtn.disabled = true;
    
    try {
        const isFollowing = followBtn.classList.contains('following');
        
        if (isFollowing) {
            // Unfollow
            const result = await SocialAPI.unfollow(facultyId);
            followBtn.classList.remove('following', 'bg-gray-600', 'hover:bg-gray-700');
            followBtn.classList.add('bg-purple-500', 'hover:bg-purple-600');
            if (followText) followText.textContent = 'Follow';
            if (followerCount) followerCount.textContent = `(${result.followersCount})`;
            showNotification('Unfollowed successfully!', 'success');
        } else {
            // Follow
            const result = await SocialAPI.follow(facultyId);
            followBtn.classList.add('following');
            followBtn.classList.remove('bg-purple-500', 'hover:bg-purple-600');
            followBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');
            if (followText) followText.textContent = 'Following';
            if (followerCount) followerCount.textContent = `(${result.followersCount})`;
            showNotification('Following successfully!', 'success');
        }
    } catch (error) {
        console.error('Error following/unfollowing:', error);
        showNotification('Failed to follow. Please try again.', 'error');
    } finally {
        followBtn.disabled = false;
    }
}

/**
 * Handle share button click
 */
async function handleShareClick(facultyId) {
    const url = window.location.href;
    const title = document.title;
    const text = `Check out this faculty profile!`;
    
    // Try native share first (mobile devices)
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: url
            });
            showNotification('Shared successfully!', 'success');
            return;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
            }
        }
    }
    
    // Fallback to showing share options
    showShareModal(url, title);
}

/**
 * Show share modal
 */
function showShareModal(url, title) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Share this profile</h3>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <button onclick="shareToFacebook('${encodeURIComponent(url)}')" class="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                </button>
                <button onclick="shareToTwitter('${encodeURIComponent(url)}', '${encodeURIComponent(title)}')" class="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                    Twitter
                </button>
                <button onclick="shareToLinkedIn('${encodeURIComponent(url)}')" class="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-all">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                </button>
                <button onclick="shareToWhatsApp('${encodeURIComponent(url)}', '${encodeURIComponent(title)}')" class="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp
                </button>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Copy Link</label>
                <div class="flex gap-2">
                    <input type="text" value="${url}" readonly class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" id="share-url-input">
                    <button onclick="copyShareUrl()" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all">
                        Copy
                    </button>
                </div>
            </div>
            <button onclick="closeShareModal()" class="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeShareModal();
        }
    };
}

/**
 * Social sharing functions
 */
function shareToFacebook(url) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

function shareToTwitter(url, title) {
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'width=600,height=400');
}

function shareToLinkedIn(url) {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
}

function shareToWhatsApp(url, title) {
    window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
}

function copyShareUrl() {
    const input = document.getElementById('share-url-input');
    if (input) {
        input.select();
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    }
}

function closeShareModal() {
    const modal = document.querySelector('.fixed.inset-0.bg-black');
    if (modal) {
        modal.remove();
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('animate-slideOut');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-slideIn {
        animation: slideIn 0.3s ease-out;
    }
    
    .animate-slideOut {
        animation: slideOut 0.3s ease-in;
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Make functions available globally
window.SocialAPI = SocialAPI;
window.SocialUI = SocialUI;
window.initSocialFeatures = initSocialFeatures;
window.handleLikeClick = handleLikeClick;
window.handleCommentClick = handleCommentClick;
window.handleFollowClick = handleFollowClick;
window.handleShareClick = handleShareClick;
window.submitComment = submitComment;
window.deleteComment = deleteComment;
window.updateCharCount = updateCharCount;
window.loadComments = loadComments;
window.shareToFacebook = shareToFacebook;
window.shareToTwitter = shareToTwitter;
window.shareToLinkedIn = shareToLinkedIn;
window.shareToWhatsApp = shareToWhatsApp;
window.copyShareUrl = copyShareUrl;
window.closeShareModal = closeShareModal;

console.log('Social features module (Firebase) loaded successfully');
