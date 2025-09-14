/**
 * ✅ Enhanced OpenSign Cloud Functions for Superadmin Approval Workflow
 * These functions extend the standard OpenSign authentication with approval gates
 */

// === Enhanced User Signup with Approval Gate ===

/**
 * Enhanced user signup that creates user but leaves disabled pending approval
 * Based on OpenSign's usersignup.js but with IsDisabled: true default
 */
export async function enhancedUserSignup(request: {
  params: {
    userDetails: {
      email: string
      password: string
      name: string
      company: string
      jobTitle: string
      phone?: string
      role?: string
      timezone?: string
      address?: string
      city?: string
      state?: string
      country?: string
      pincode?: string
    }
  }
}) {
  const { userDetails } = request.params
  
  try {
    // Set default role and timezone
    const enhancedUserDetails = {
      ...userDetails,
      role: userDetails.role || 'contracts_User',
      timezone: userDetails.timezone || 'UTC',
      email: userDetails.email?.toLowerCase()?.replace(/\s/g, '')
    }

    // 1. Create or get Parse User (same as OpenSign usersignup.js)
    const user = await saveUser(enhancedUserDetails)

    // 2. Check if extended user already exists
    const extClass = enhancedUserDetails.role.split('_')[0]
    const extQuery = new Parse.Query(extClass + '_Users')
    extQuery.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    })
    const extUser = await extQuery.first({ useMasterKey: true })
    
    if (extUser) {
      return { 
        error: 'User already exists',
        message: 'An account with this email already exists'
      }
    }

    // 3. Create partners_Tenant (organization/company)
    const partnerCls = Parse.Object.extend('partners_Tenant')
    const partnerQuery = new partnerCls()
    partnerQuery.set('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    })
    partnerQuery.set('TenantName', enhancedUserDetails.company)
    partnerQuery.set('EmailAddress', enhancedUserDetails.email)
    partnerQuery.set('IsActive', true)
    partnerQuery.set('CreatedBy', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    })
    
    // Add optional fields
    if (enhancedUserDetails.phone) {
      partnerQuery.set('ContactNumber', enhancedUserDetails.phone)
    }
    if (enhancedUserDetails.address) {
      partnerQuery.set('Address', enhancedUserDetails.address)
    }
    if (enhancedUserDetails.city) {
      partnerQuery.set('City', enhancedUserDetails.city)
    }
    if (enhancedUserDetails.state) {
      partnerQuery.set('State', enhancedUserDetails.state)
    }
    if (enhancedUserDetails.country) {
      partnerQuery.set('Country', enhancedUserDetails.country)
    }
    if (enhancedUserDetails.pincode) {
      partnerQuery.set('PinCode', enhancedUserDetails.pincode)
    }
    
    const tenantRes = await partnerQuery.save(null, { useMasterKey: true })

    // 4. Create contracts_Users (extended user) - KEY CHANGE: IsDisabled: true
    const extCls = Parse.Object.extend(extClass + '_Users')
    const newObj = new extCls()
    newObj.set('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    })
    newObj.set('UserRole', enhancedUserDetails.role)
    newObj.set('Email', enhancedUserDetails.email)
    newObj.set('Name', enhancedUserDetails.name)
    newObj.set('Company', enhancedUserDetails.company)
    newObj.set('JobTitle', enhancedUserDetails.jobTitle)
    newObj.set('TenantId', {
      __type: 'Pointer',
      className: 'partners_Tenant',
      objectId: tenantRes.id,
    })
    newObj.set('Timezone', enhancedUserDetails.timezone)
    // 🔑 KEY CHANGE: Start disabled, awaiting approval
    newObj.set('IsDisabled', true)
    newObj.set('RegistrationDate', new Date())
    
    if (enhancedUserDetails.phone) {
      newObj.set('Phone', enhancedUserDetails.phone)
    }
    
    const extRes = await newObj.save(null, { useMasterKey: true })

    // 5. Create Organization + Default Team (same as OpenSign AddAdmin.js)
    const orgCls = new Parse.Object('contracts_Organizations')
    orgCls.set('Name', enhancedUserDetails.company)
    orgCls.set('IsActive', true)
    orgCls.set('ExtUserId', {
      __type: 'Pointer',
      className: 'contracts_Users',
      objectId: extRes.id,
    })
    orgCls.set('CreatedBy', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    })
    orgCls.set('TenantId', {
      __type: 'Pointer',
      className: 'partners_Tenant',
      objectId: tenantRes.id,
    })

    const orgRes = await orgCls.save(null, { useMasterKey: true })
    
    // Create default team
    const teamCls = new Parse.Object('contracts_Teams')
    teamCls.set('Name', 'All Users')
    teamCls.set('OrganizationId', {
      __type: 'Pointer',
      className: 'contracts_Organizations',
      objectId: orgRes.id,
    })
    teamCls.set('IsActive', true)
    const teamRes = await teamCls.save(null, { useMasterKey: true })

    // 6. Update extended user with org/team info
    extRes.set('OrganizationId', {
      __type: 'Pointer',
      className: 'contracts_Organizations',
      objectId: orgRes.id,
    })
    extRes.set('TeamIds', [{
      __type: 'Pointer',
      className: 'contracts_Teams',
      objectId: teamRes.id,
    }])
    await extRes.save(null, { useMasterKey: true })

    // 7. Send notification to superadmin (if notification system exists)
    // This would integrate with your notification system
    await notifySuperAdminOfNewUser({
      userName: enhancedUserDetails.name,
      userEmail: enhancedUserDetails.email,
      company: enhancedUserDetails.company,
      userId: extRes.id
    })

    return {
      success: true,
      message: 'Account created successfully. Please wait for administrator approval before you can sign in.',
      userId: extRes.id,
      requiresApproval: true
    }

  } catch (err) {
    console.log('Error in enhancedUserSignup:', err)
    return {
      error: 'Signup failed',
      message: err.message || 'An error occurred during registration'
    }
  }
}

// === Superadmin Initialization ===

/**
 * Initialize superadmin account (one-time setup)
 */
export async function initializeSuperAdmin(request: {
  params: {
    superAdminConfig: {
      email: string
      password: string
      name: string
      company: string
      role: string
    }
  }
}) {
  const { superAdminConfig } = request.params
  
  try {
    // Check if superadmin already exists
    const userQuery = new Parse.Query(Parse.User)
    userQuery.equalTo('email', superAdminConfig.email)
    const existingUser = await userQuery.first({ useMasterKey: true })
    
    if (existingUser) {
      return {
        success: true,
        message: 'Superadmin account already exists',
        existed: true
      }
    }

    // Create superadmin Parse User
    const user = new Parse.User()
    user.set('username', superAdminConfig.email)
    user.set('email', superAdminConfig.email)
    user.set('password', superAdminConfig.password)
    user.set('name', superAdminConfig.name)
    
    const userRes = await user.signUp()

    // Create tenant for superadmin
    const partnerCls = Parse.Object.extend('partners_Tenant')
    const partnerQuery = new partnerCls()
    partnerQuery.set('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: userRes.id,
    })
    partnerQuery.set('TenantName', superAdminConfig.company)
    partnerQuery.set('EmailAddress', superAdminConfig.email)
    partnerQuery.set('IsActive', true)
    partnerQuery.set('CreatedBy', {
      __type: 'Pointer',
      className: '_User',
      objectId: userRes.id,
    })
    
    const tenantRes = await partnerQuery.save(null, { useMasterKey: true })

    // Create extended user with SuperAdmin role
    const extCls = Parse.Object.extend('contracts_Users')
    const newObj = new extCls()
    newObj.set('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: userRes.id,
    })
    newObj.set('UserRole', 'contracts_SuperAdmin')
    newObj.set('Email', superAdminConfig.email)
    newObj.set('Name', superAdminConfig.name)
    newObj.set('Company', superAdminConfig.company)
    newObj.set('JobTitle', 'Super Administrator')
    newObj.set('TenantId', {
      __type: 'Pointer',
      className: 'partners_Tenant',
      objectId: tenantRes.id,
    })
    // Superadmin is immediately active
    newObj.set('IsDisabled', false)
    newObj.set('RegistrationDate', new Date())
    
    await newObj.save(null, { useMasterKey: true })

    return {
      success: true,
      message: 'Superadmin account created successfully',
      existed: false
    }

  } catch (err) {
    console.log('Error in initializeSuperAdmin:', err)
    return {
      error: 'Initialization failed',
      message: err.message || 'Failed to create superadmin account'
    }
  }
}

// === User Management Functions ===

/**
 * Get all pending users awaiting approval (superadmin only)
 */
export async function getPendingUsers(request: { user: Parse.User }) {
  try {
    // Verify superadmin permission
    const isSuperAdmin = await checkSuperAdminPermission(request.user)
    if (!isSuperAdmin) {
      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Access denied')
    }

    const query = new Parse.Query('contracts_Users')
    query.equalTo('IsDisabled', true)
    query.include('TenantId')
    query.include('UserId')
    query.ascending('RegistrationDate')
    
    const results = await query.find({ useMasterKey: true })
    
    const pendingUsers = results.map(user => ({
      objectId: user.id,
      Name: user.get('Name'),
      Email: user.get('Email'),
      Company: user.get('Company'),
      JobTitle: user.get('JobTitle'),
      Phone: user.get('Phone'),
      RegistrationDate: user.get('RegistrationDate'),
      IsDisabled: user.get('IsDisabled'),
      UserRole: user.get('UserRole'),
      TenantId: user.get('TenantId') ? {
        objectId: user.get('TenantId').id,
        TenantName: user.get('TenantId').get('TenantName')
      } : null
    }))

    return {
      success: true,
      results: pendingUsers
    }

  } catch (err) {
    console.log('Error in getPendingUsers:', err)
    return {
      error: 'Failed to get pending users',
      message: err.message || 'An error occurred'
    }
  }
}

/**
 * Get all users (superadmin only)
 */
export async function getAllUsers(request: { user: Parse.User }) {
  try {
    // Verify superadmin permission
    const isSuperAdmin = await checkSuperAdminPermission(request.user)
    if (!isSuperAdmin) {
      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Access denied')
    }

    const query = new Parse.Query('contracts_Users')
    query.include('TenantId')
    query.include('UserId')
    query.include('OrganizationId')
    query.ascending('Name')
    
    const results = await query.find({ useMasterKey: true })
    
    const allUsers = results.map(user => ({
      objectId: user.id,
      Name: user.get('Name'),
      Email: user.get('Email'),
      Company: user.get('Company'),
      JobTitle: user.get('JobTitle'),
      Phone: user.get('Phone'),
      UserRole: user.get('UserRole'),
      IsDisabled: user.get('IsDisabled') || false,
      RegistrationDate: user.get('RegistrationDate'),
      ApprovedAt: user.get('ApprovedAt'),
      ApprovedBy: user.get('ApprovedBy'),
      TenantId: user.get('TenantId') ? {
        objectId: user.get('TenantId').id,
        TenantName: user.get('TenantId').get('TenantName')
      } : null,
      OrganizationId: user.get('OrganizationId') ? {
        objectId: user.get('OrganizationId').id,
        Name: user.get('OrganizationId').get('Name')
      } : null
    }))

    return {
      success: true,
      results: allUsers
    }

  } catch (err) {
    console.log('Error in getAllUsers:', err)
    return {
      error: 'Failed to get all users',
      message: err.message || 'An error occurred'
    }
  }
}

/**
 * Approve or reject user activation (superadmin only)
 */
export async function manageUserActivation(request: {
  user: Parse.User
  params: {
    userId: string
    action: 'approve' | 'reject'
    reason?: string
  }
}) {
  const { userId, action, reason } = request.params
  
  try {
    // Verify superadmin permission
    const isSuperAdmin = await checkSuperAdminPermission(request.user)
    if (!isSuperAdmin) {
      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Access denied')
    }

    // Get the user to activate/reject
    const userQuery = new Parse.Query('contracts_Users')
    const user = await userQuery.get(userId, { useMasterKey: true })
    
    if (!user) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found')
    }

    if (action === 'approve') {
      // Approve user
      user.set('IsDisabled', false)
      user.set('ApprovedBy', {
        __type: 'Pointer',
        className: '_User',
        objectId: request.user.id,
      })
      user.set('ApprovedAt', new Date())
      await user.save(null, { useMasterKey: true })

      // Send welcome email (if email service is available)
      await sendWelcomeEmail({
        email: user.get('Email'),
        name: user.get('Name'),
        loginUrl: process.env.APP_URL || 'https://your-app.com/login'
      })

      // Log approval
      await logUserAction({
        action: 'USER_APPROVED',
        userId: userId,
        performedBy: request.user.get('email'),
        reason: reason
      })

      return {
        success: true,
        message: `User ${user.get('Name')} has been approved and can now access the platform`
      }

    } else if (action === 'reject') {
      // Log rejection before deletion
      await logUserAction({
        action: 'USER_REJECTED',
        userId: userId,
        performedBy: request.user.get('email'),
        reason: reason,
        userDetails: {
          name: user.get('Name'),
          email: user.get('Email'),
          company: user.get('Company')
        }
      })

      // Delete all related records
      await deleteUserCompletely(user)

      return {
        success: true,
        message: `User registration has been rejected and all data removed`
      }
    }

  } catch (err) {
    console.log('Error in manageUserActivation:', err)
    return {
      error: 'Failed to manage user activation',
      message: err.message || 'An error occurred'
    }
  }
}

// === Helper Functions ===

/**
 * Helper function to save user (from OpenSign usersignup.js)
 */
async function saveUser(userDetails: any) {
  const userQuery = new Parse.Query(Parse.User)
  userQuery.equalTo('username', userDetails.email)
  const userRes = await userQuery.first({ useMasterKey: true })

  if (userRes) {
    // Return existing user for login
    const url = `${process.env.SERVER_URL}/loginAs`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': process.env.APP_ID,
        'X-Parse-Master-Key': process.env.MASTER_KEY,
      },
      body: JSON.stringify({ userId: userRes.id }),
    })
    const login = await response.json()
    return { id: login.objectId, sessionToken: login.sessionToken }
  } else {
    // Create new user
    const user = new Parse.User()
    user.set('username', userDetails.email)
    user.set('email', userDetails.email)
    user.set('password', userDetails.password)
    user.set('name', userDetails.name)
    if (userDetails.phone) {
      user.set('phone', userDetails.phone)
    }

    const res = await user.signUp()
    return { id: res.id, sessionToken: res.getSessionToken() }
  }
}

/**
 * Check if user has superadmin permissions
 */
async function checkSuperAdminPermission(user: Parse.User): Promise<boolean> {
  if (!user) return false
  
  try {
    const query = new Parse.Query('contracts_Users')
    query.equalTo('UserId', {
      __type: 'Pointer',
      className: '_User',
      objectId: user.id,
    })
    const extUser = await query.first({ useMasterKey: true })
    
    return extUser?.get('UserRole') === 'contracts_SuperAdmin' || 
           user.get('email') === 'superadmin@superadmin.com'
  } catch (err) {
    console.log('Error checking superadmin permission:', err)
    return false
  }
}

/**
 * Send notification to superadmin about new user registration
 */
async function notifySuperAdminOfNewUser(userInfo: {
  userName: string
  userEmail: string
  company: string
  userId: string
}) {
  // This would integrate with your notification system
  // For now, just log the event
  console.log('New user registration notification:', userInfo)
  
  // You could implement email notification, in-app notification, etc.
  // await sendEmailNotification({
  //   to: 'superadmin@superadmin.com',
  //   subject: 'New User Registration',
  //   template: 'new-user-registration',
  //   data: userInfo
  // })
}

/**
 * Send welcome email to approved user
 */
async function sendWelcomeEmail(emailData: {
  email: string
  name: string
  loginUrl: string
}) {
  // This would integrate with your email service
  console.log('Sending welcome email to:', emailData.email)
  
  // You could implement with SendGrid, Mailgun, etc.
  // await emailService.send({
  //   to: emailData.email,
  //   subject: 'Welcome! Your account has been approved',
  //   template: 'welcome-approved-user',
  //   data: emailData
  // })
}

/**
 * Log user management actions for audit trail
 */
async function logUserAction(actionData: {
  action: string
  userId: string
  performedBy: string
  reason?: string
  userDetails?: Record<string, unknown>
}) {
  try {
    const logCls = Parse.Object.extend('system_UserActivationLogs')
    const logObj = new logCls()
    logObj.set('Action', actionData.action)
    logObj.set('UserId', actionData.userId)
    logObj.set('PerformedBy', actionData.performedBy)
    logObj.set('Timestamp', new Date())
    if (actionData.reason) {
      logObj.set('Reason', actionData.reason)
    }
    if (actionData.userDetails) {
      logObj.set('Details', actionData.userDetails)
    }
    
    await logObj.save(null, { useMasterKey: true })
  } catch (err) {
    console.log('Error logging user action:', err)
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Delete user and all related records completely
 */
async function deleteUserCompletely(extUser: Parse.Object) {
  try {
    const userId = extUser.get('UserId').id
    const tenantId = extUser.get('TenantId')?.id
    const orgId = extUser.get('OrganizationId')?.id

    // Delete organization and teams if they exist
    if (orgId) {
      // Delete teams in this organization
      const teamQuery = new Parse.Query('contracts_Teams')
      teamQuery.equalTo('OrganizationId', {
        __type: 'Pointer',
        className: 'contracts_Organizations',
        objectId: orgId,
      })
      const teams = await teamQuery.find({ useMasterKey: true })
      await Parse.Object.destroyAll(teams, { useMasterKey: true })

      // Delete organization
      const orgQuery = new Parse.Query('contracts_Organizations')
      const org = await orgQuery.get(orgId, { useMasterKey: true })
      await org.destroy({ useMasterKey: true })
    }

    // Delete tenant
    if (tenantId) {
      const tenantQuery = new Parse.Query('partners_Tenant')
      const tenant = await tenantQuery.get(tenantId, { useMasterKey: true })
      await tenant.destroy({ useMasterKey: true })
    }

    // Delete extended user
    await extUser.destroy({ useMasterKey: true })

    // Delete Parse user
    const userQuery = new Parse.Query(Parse.User)
    const user = await userQuery.get(userId, { useMasterKey: true })
    await user.destroy({ useMasterKey: true })

  } catch (err) {
    console.log('Error deleting user completely:', err)
    throw err
  }
}
