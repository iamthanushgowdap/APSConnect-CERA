// Debug avatar loading
console.log('🔍 Avatar Debug:');
console.log('Current user ID:', '7bb12ed2-e7a1-434a-b815-a86d74656f42');

// Check localStorage for current user
const userKey = `apsconnect_user_7bb12ed2-e7a1-434a-b815-a86d74656f42`;
const userProfileStr = typeof window !== 'undefined' ? localStorage.getItem(userKey) : null;

if (userProfileStr) {
  const userProfile = JSON.parse(userProfileStr);
  console.log('User profile from localStorage:', {
    id: userProfile.id,
    full_name: userProfile.full_name,
    avatar_url: userProfile.avatar_url ? `${userProfile.avatar_url.substring(0, 50)}...` : null,
    hasAvatar: !!userProfile.avatar_url
  });
} else {
  console.log('No user profile found in localStorage');
}

// Check all localStorage keys containing avatars
if (typeof window !== 'undefined') {
  const allKeys = Object.keys(localStorage);
  const avatarKeys = allKeys.filter(key => key.includes('apsconnect_user_'));
  console.log('All user keys in localStorage:', avatarKeys);

  avatarKeys.forEach(key => {
    const profile = JSON.parse(localStorage.getItem(key) || '{}');
    if (profile.avatar_url) {
      console.log(`Avatar found for ${profile.full_name}:`, profile.avatar_url.substring(0, 50) + '...');
    }
  });
}
