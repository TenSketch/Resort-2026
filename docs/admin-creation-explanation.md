# How Admins Are Created in Your Application

Based on your backend code, there are multiple ways admins are created in your system:

## 1. Using Scripts

### Super Admin Creation
- File: `backend/scripts/createSuperAdmin.js`
- Command: `cd backend/scripts && node createSuperAdmin.js`
- Creates a superadmin with:
  - Username: superadmin@gmail.com
  - Password: 123 (hashed with bcrypt)
  - Role: superadmin
  - Full permissions (all set to true)

### Staff Creation
- File: `backend/scripts/createStaff.js`
- Command: `cd backend/scripts && node createStaff.js`
- Creates a staff member with:
  - Username: staff@gmail.com
  - Password: 123 (hashed with bcrypt)
  - Role: staff
  - Limited permissions (only canViewDownload: true)

### Important: Environment Configuration
The scripts need to load environment variables from the `.env` file. The scripts have been updated to:
- Properly load the `.env` file from the backend directory
- Fix the MongoDB URI connection issue you encountered

If you encounter the error "The `uri` parameter to `openUri()` must be a string, got 'undefined'", ensure:
1. You're running the script from the `backend/scripts` directory
2. The `.env` file exists in the `backend` directory with the correct `MONGODB_URI`

## 2. Through API Login

Admin login is handled via the `/api/user/admin` endpoint:
- Controller: `backend/controllers/userController.js`
- Function: `adminLogin`
- Validates credentials against the Admin model
- Returns JWT token for authenticated admins

## 3. Sample Admin JSON Structure

The MongoDB document structure for an admin:

### Super Admin Example
```json
{
  "username": "superadmin@gmail.com",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMye1VZcN6pKqNjJ8GWr8Jp8qK8nJ8GWr8J",
  "name": "Super Admin",
  "role": "superadmin",
  "permissions": {
    "canEdit": true,
    "canDisable": true,
    "canAddReservations": true,
    "canAddGuests": true,
    "canViewDownload": true
  },
  "createdAt": "2025-10-15T16:55:16.975Z",
  "updatedAt": "2025-10-15T16:55:16.975Z"
}
```

### Regular Admin Example
```json
{
  "username": "admin@example.com",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMye1VZcN6pKqNjJ8GWr8Jp8qK8nJ8GWr8J",
  "name": "John Administrator",
  "role": "admin",
  "permissions": {
    "canEdit": false,
    "canDisable": false,
    "canAddReservations": false,
    "canAddGuests": false,
    "canViewDownload": true
  },
  "createdAt": "2025-10-15T16:55:16.975Z",
  "updatedAt": "2025-10-15T16:55:16.975Z"
}
```

### Staff Member Example
```json
{
  "username": "staff@gmail.com",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMye1VZcN6pKqNjJ8GWr8Jp8qK8nJ8GWr8J",
  "name": "Staff User",
  "role": "staff",
  "permissions": {
    "canEdit": false,
    "canDisable": false,
    "canAddReservations": false,
    "canAddGuests": false,
    "canViewDownload": true
  },
  "createdAt": "2025-10-15T16:55:16.975Z",
  "updatedAt": "2025-10-15T16:55:16.975Z"
}
```

## 4. Manual Admin Creation via MongoDB

You can also create admins directly in MongoDB using the MongoDB Shell:

```javascript
// Connect to your database
use vanadb

// Create a new admin with hashed password
db.admins.insertOne({
  username: "newadmin@example.com",
  password: "$2b$10$N9qo8uLOickgx2ZMRZoMye1VZcN6pKqNjJ8GWr8Jp8qK8nJ8GWr8J", // Hash this password
  name: "New Admin",
  role: "admin",
  permissions: {
    canEdit: false,
    canDisable: false,
    canAddReservations: false,
    canAddGuests: false,
    canViewDownload: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Important Notes

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **Role Hierarchy**: 
   - superadmin: Has all permissions and bypasses permission checks
   - admin: Limited permissions based on the permissions object
   - staff: Most limited permissions (typically only view/download)
3. **Authentication**: Uses JWT tokens for authentication
4. **Permission System**: Fine-grained control through the permissions object
5. **Timestamps**: `createdAt` and `updatedAt` are automatically managed by Mongoose
6. **Unique Constraint**: The `username` field must be unique across all admin accounts

## Troubleshooting

- **MongoDB Connection Error**: Ensure MongoDB is running and the URI in `.env` is correct
- **Permission Issues**: Superadmins bypass all permission checks
- **Login Issues**: Check that the password is properly hashed and the username exists in the database