# Groups System Setup

This document explains how to set up the groups (clubs) functionality for the APS Connect application.

## Database Setup

### 1. Run the Migration Scripts

Execute the SQL files in order:

```bash
# Create the groups tables
psql -h your-host -U your-user -d your-database -f migrations/002_create_groups_tables.sql

# Populate groups and assign members
psql -h your-host -U your-user -d your-database -f migrations/003_populate_groups.sql
```

### 2. Alternative: Use the Population Script

If you prefer to use the Node.js script (recommended for development):

```bash
# Install dependencies if needed
npm install dotenv

# Run the population script
node scripts/populate-groups.js
```

## Groups Structure

### Group Types

- **Official Groups**: Announcements from faculty/administration
- **Student Groups**: Peer-to-peer discussion groups

### Default Groups

1. **Official Announcements** - All approved users
2. **Faculty Lounge** - Faculty members only
3. **Admin Announcements** - Admin users only
4. **Department Groups** - Branch-specific official communication
5. **Class Groups** - Branch + semester specific announcements
6. **Student Peer Groups** - Branch + semester student discussions

### Membership Rules

- **Official Groups**: Admins and faculty can post, students can view
- **Student Groups**: All members can post and view

## User Experience

### For Students
- See official class announcements
- Participate in peer discussion groups
- Access department-wide communications

### For Faculty
- Post official announcements
- Access faculty-only discussions
- Communicate with specific classes

### For Admins
- Post system-wide announcements
- Access all groups for moderation

## API Functions

The groups system provides these functions:

- `getMyGroups(user)` - Get all groups a user belongs to
- `getGroupById(groupId)` - Get a single group by ID
- `getGroupMembers(groupId)` - Get all members of a group
- `canUserPostInGroup(userId, groupId)` - Check posting permissions

## Group IDs Format

- `official_announcements` - Global announcements
- `{branch}_official` - Department announcements
- `{branch}_{semester}_official` - Class announcements
- `{branch}_{semester}_student` - Student peer groups

Note: Spaces and '&' in semester names are replaced with '-' for URL safety.

## Troubleshooting

### No Groups Showing
1. Check if migration scripts were run
2. Verify user profiles have branch/semester data
3. Run the population script manually

### Permission Issues
1. Check group_members table for user assignments
2. Verify user's role in user_profiles table
3. Check can_post flag in group_members

### Database Errors
1. Ensure all tables exist with correct constraints
2. Check foreign key relationships
3. Verify user data integrity
