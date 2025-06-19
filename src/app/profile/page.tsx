// src/app/profile/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { UserActivityItem, userService, type UserProfile, type UserStats } from '@/lib/services/user'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activity, setActivity] = useState<UserActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: ''
  })

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordChanging, setPasswordChanging] = useState(false)

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Refs for scrolling
  const passwordFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setLoading(false)
        return
      }
      
      setUser(user)

      // Get user profile using service
      const { data: profileData, error: profileError } = await userService.getUserProfile(user.id)

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError)
        setLoading(false)
        return
      }

      setProfile(profileData)
      setEditForm({
        full_name: profileData.full_name || '',
        phone: profileData.phone || ''
      })

      // If no avatar but Google has one, update profile with Google avatar
      if (!profileData.avatar_url && user.user_metadata?.avatar_url) {
        await userService.updateProfile(user.id, {
          avatar_url: user.user_metadata.avatar_url
        })
        
        setProfile(prev => prev ? { ...prev, avatar_url: user.user_metadata.avatar_url } : null)
      }

      // Get user stats using service
      const { data: statsData } = await userService.getUserStats(user.id)
      if (statsData) {
        setStats(statsData)
      }

      // Get user activity
      const { data: activityData } = await userService.getUserActivity(user.id, 5)
      if (activityData) {
        setActivity(activityData)
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordFormToggle = () => {
    setShowPasswordForm(!showPasswordForm)
    if (!showPasswordForm) {
      // Scroll to password form after a small delay to ensure it's rendered
      setTimeout(() => {
        passwordFormRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
    }
  }

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await supabase.auth.signOut()
      window.location.href = '/'
    }
  }

  const formatActivityDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return
    
    try {
      setSaving(true)
      
      const updateData = {
        full_name: editForm.full_name.trim() || null,
        phone: editForm.phone.trim() || null
      }

      console.log('Updating profile with data:', updateData)
      
      const { data, error } = await userService.updateProfile(user.id, updateData)

      if (error) {
        console.error('Error updating profile:', error)
        alert(`Failed to update profile: ${error}`)
        return
      }

      console.log('Profile updated successfully:', data)
      
      // Reload data
      await loadUserData()
      setEditMode(false)
      
    } catch (error) {
      console.error('Unexpected error saving profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    try {
      setAvatarUploading(true)

      const { data: avatarUrl, error } = await userService.uploadAvatar(user.id, file)

      if (error) {
        alert(error)
        return
      }

      // Reload data to get updated profile
      await loadUserData()

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload profile picture')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Please fill in all password fields')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      setPasswordChanging(true)

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) {
        console.error('Error changing password:', error)
        alert(`Failed to change password: ${error.message}`)
        return
      }

      alert('Password changed successfully!')
      setShowPasswordForm(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    } finally {
      setPasswordChanging(false)
    }
  }

  const getInitials = (name: string | null): string => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatJoinDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Profile" showBackButton={true} />
        <div className="px-4 py-6 space-y-6">
          <ProfileSkeleton />
        </div>
      </div>
    )
  }

  // Not signed in
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Profile" showBackButton={true} />
        <div className="px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Not signed in</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="block lg:hidden">
        <MobileHeader title="Profile" showBackButton={true} />
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-20 lg:h-24 relative">
            {/* Overlay for better text contrast on desktop */}
            <div className="hidden lg:block absolute inset-0 bg-black bg-opacity-20"></div>
          </div>
          <CardContent className="relative pb-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:gap-6 -mt-10 lg:-mt-12">
              
              {/* Avatar */}
              <div className="relative mb-4 lg:mb-0">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white p-1 shadow-lg">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <span className="text-xl lg:text-2xl font-bold text-blue-600">
                        {getInitials(profile.full_name)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Camera Icon for Avatar Upload */}
                <label className="absolute bottom-0 right-0 w-6 h-6 lg:w-8 lg:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors cursor-pointer">
                  {avatarUploading ? (
                    <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 lg:pb-2">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 lg:text-white lg:drop-shadow-lg">
                      {profile.full_name || 'User'}
                      {profile.is_verified && (
                        <svg className="w-5 h-5 text-blue-500 lg:text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </h2>
                    <p className="text-gray-600 lg:text-gray-200 lg:drop-shadow">{profile.email}</p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    className="ml-2"
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                {/* User Type Badge */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={profile.user_type === 'admin' ? 'destructive' : 
                            profile.user_type === 'business_owner' ? 'default' : 'secondary'}
                  >
                    {profile.user_type === 'admin' ? 'Admin' :
                     profile.user_type === 'business_owner' ? 'Business Owner' : 'Member'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Joined {formatJoinDate(profile.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        {editMode && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Change Password Form */}
        {showPasswordForm && (
          <Card ref={passwordFormRef}>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handlePasswordChange} disabled={passwordChanging} className="flex-1">
                  {passwordChanging ? 'Changing...' : 'Change Password'}
                </Button>
                <Button variant="outline" onClick={() => setShowPasswordForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.reviewsCount}</div>
                <div className="text-sm text-gray-600">Reviews</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.profileCompletion}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.businessesCount}
                </div>
                <div className="text-sm text-gray-600">Businesses</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Date().getFullYear() - new Date(stats.joinDate).getFullYear() || '<1'}
                </div>
                <div className="text-sm text-gray-600">Years</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.type === 'review' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {item.type === 'review' ? (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                      <p className="text-gray-600 text-xs">{item.description}</p>
                      <p className="text-gray-400 text-xs mt-1">{formatActivityDate(item.date)}</p>
                    </div>
                    {item.link && (
                      <button 
                        onClick={() => window.location.href = item.link!}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        View
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No recent activity</p>
                <p className="text-sm mt-1">Start by exploring businesses or leaving reviews!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              onClick={handlePasswordFormToggle}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>Change Password</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Privacy Settings</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h11l5-5V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Export Data</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="p-4">
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Bottom Spacing for Mobile */}
        <div className="h-20 lg:h-8"></div>
      </div>
    </div>
  )
}

// Loading Skeleton
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Header Skeleton */}
      <Card className="overflow-hidden">
        <div className="bg-gray-200 h-20 lg:h-24 animate-pulse"></div>
        <CardContent className="relative pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:gap-6 -mt-10 lg:-mt-12">
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gray-200 animate-pulse mb-4 lg:mb-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}