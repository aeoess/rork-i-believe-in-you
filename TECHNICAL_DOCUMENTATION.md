# I Believe In You - Technical Documentation

A comprehensive technical guide for rebuilding this React Native/Expo app in Swift/SwiftUI.

---

## 1. App Overview

### Concept
"I Believe In You" is a social platform where creators (founders, artists, musicians) share their project journeys, and supporters follow projects, send encouragement, and earn karma points. Think Twitter meets Indie Hackers with a focus on positivity and support.

### Purpose
- Allow creators to share progress updates on their projects
- Enable supporters to discover, follow, and encourage creators
- Gamify support through a karma/leveling system

### User Types & Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Creator** | Users who have projects | Create/edit projects, post updates, manage milestones, receive support |
| **Supporter** | Users who follow projects | Follow projects, like posts, send support messages, earn karma |

Note: A user can be both - they can have their own projects AND support others.

### User Flow
1. **Sign Up** → Create account with email/password
2. **Onboarding** → Choose role: "Share my project" (Creator) or "Support creators" (Supporter)
3. **Main App** → 4-tab navigation: Home, Discover, My Support, Profile
4. **Core Loop**:
   - Supporters: Discover → Follow → Send Support → Earn Karma
   - Creators: Create Project → Post Updates → Manage Milestones → Receive Support

---

## 2. Database Schema

### Supabase Tables

#### `builders` (User Profiles)
```sql
id: uuid (primary key)
user_id: uuid (references auth.users.id, unique)
name: text (not null)
bio: text (nullable)
avatar_url: text (nullable)
website_url: text (nullable)
twitter_handle: text (nullable)
is_creator: boolean (default false)
created_at: timestamp with time zone (default now())
updated_at: timestamp with time zone (default now())
```

#### `karma`
```sql
id: uuid (primary key)
user_id: uuid (references auth.users.id, unique)
total_points: integer (default 0)
level: integer (default 1)
created_at: timestamp with time zone (default now())
updated_at: timestamp with time zone (default now())
```

#### `projects`
```sql
id: uuid (primary key)
builder_id: uuid (references builders.id, not null)
title: text (not null)
tagline: text (nullable)
description: text (nullable)
cover_image_url: text (nullable)
public_slug: text (unique, not null)
mood: text (enum: 'green', 'yellow', 'red', nullable)
follower_count: integer (default 0)
is_published: boolean (default true)
created_at: timestamp with time zone (default now())
updated_at: timestamp with time zone (default now())
```

#### `posts`
```sql
id: uuid (primary key)
project_id: uuid (references projects.id, not null, on delete cascade)
content: text (not null)
images: text[] (array, nullable)
like_count: integer (default 0)
created_at: timestamp with time zone (default now())
updated_at: timestamp with time zone (default now())
```

#### `follows`
```sql
id: uuid (primary key)
user_id: uuid (references auth.users.id, not null)
project_id: uuid (references projects.id, not null, on delete cascade)
created_at: timestamp with time zone (default now())

UNIQUE(user_id, project_id)
```

#### `milestones`
```sql
id: uuid (primary key)
project_id: uuid (references projects.id, not null, on delete cascade)
title: text (not null)
description: text (nullable)
is_completed: boolean (default false)
target_date: date (nullable)
completed_at: timestamp with time zone (nullable)
created_at: timestamp with time zone (default now())
```

#### `support_messages`
```sql
id: uuid (primary key)
project_id: uuid (references projects.id, not null, on delete cascade)
sender_id: uuid (references builders.id, not null)
message: text (not null)
is_anonymous: boolean (default false)
created_at: timestamp with time zone (default now())
```

#### `likes`
```sql
id: uuid (primary key)
user_id: uuid (references auth.users.id, not null)
post_id: uuid (references posts.id, not null, on delete cascade)
created_at: timestamp with time zone (default now())

UNIQUE(user_id, post_id)
```

#### `support_actions`
```sql
id: uuid (primary key)
user_id: uuid (references auth.users.id, not null)
project_id: uuid (references projects.id, not null, on delete cascade)
action_type: text (enum: 'follow', 'message', 'like')
points_earned: integer (not null)
metadata: jsonb (nullable)
created_at: timestamp with time zone (default now())
```

### Database Triggers (Supabase)
When a user signs up via `auth.users`, a trigger automatically:
1. Creates a `builders` record with `user_id = auth.user.id` and `name` from metadata
2. Creates a `karma` record with `user_id = auth.user.id` and `total_points = 0`

### RPC Functions (Optional)
```sql
increment_follower_count(p_project_id uuid)
decrement_follower_count(p_project_id uuid)
```

---

## 3. Authentication

### How Auth Works
- Uses **Supabase Auth** with email/password authentication
- Session persisted via `AsyncStorage` (use UserDefaults/Keychain in Swift)
- Auth state changes trigger profile data fetching

### Sign Up Flow
1. User provides: name, email, password
2. Call `supabase.auth.signUp()` with email, password, and name in metadata
3. Supabase trigger creates `builders` and `karma` records
4. User marked as "not onboarded" (stored in local storage per user)
5. Navigate to Onboarding screen

### Sign In Flow
1. User provides: email, password
2. Call `supabase.auth.signInWithPassword()`
3. On success, fetch `builders` profile and `karma` data
4. Check if onboarding completed (local storage)
5. Navigate to main app or onboarding

### Session Management
```typescript
// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    // Fetch user profile and karma
  } else {
    // Clear user data
  }
});
```

### Onboarding Completion
- Stored in local storage: `ibelieveinyou_onboarding_completed_{userId}` = 'true'
- On completion, updates `builders.is_creator` based on choice

---

## 4. All Screens

### Authentication Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Login** | `/login` | Email/password form, link to signup |
| **Signup** | `/signup` | Name/email/password form, link to login |
| **Onboarding** | `/onboarding` | Role selection: Creator or Supporter |

### Main Tab Screens

| Screen | Route | Tab Icon | Description |
|--------|-------|----------|-------------|
| **Home** | `/(tabs)/` | Home | Feed of posts from followed projects |
| **Discover** | `/(tabs)/discover` | Search | Browse trending/new projects |
| **My Support** | `/(tabs)/support` | Heart | Karma stats, followed projects, activity |
| **Profile** | `/(tabs)/profile` | User | User profile, own projects, sign out |

### Detail Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Project Page** | `/project/[slug]` | Full project details, posts, milestones |
| **Creator Profile** | `/creator/[id]` | Creator info and their projects |

### Creator/Editor Screens

| Screen | Route | Presentation | Description |
|--------|-------|--------------|-------------|
| **Create Project** | `/create-project` | Modal | Form to create new project |
| **Edit Project** | `/edit-project?slug=X` | Push | Form to edit existing project |
| **Create Post** | `/create-post?projectId=X` | Modal | Form to post update |
| **Edit Profile** | `/edit-profile` | Push | Edit user profile |

---

## 5. Screen Details

### Home Screen
**When user follows projects:**
- Displays feed of posts from followed projects
- Each post shows: project avatar, title, creator name, content, images, timestamp, like button
- Pull-to-refresh support
- Tapping project → Project Page
- Tapping creator → Creator Profile

**When user follows no projects:**
- Empty state with illustration
- "Your feed is empty" message
- "Find your first project" button → Discover tab

### Discover Screen
- Search bar at top (client-side filtering)
- "Trending Projects" section (horizontal scroll, sorted by follower_count desc)
- "New Projects" section (vertical list, sorted by created_at desc)
- Pull-to-refresh
- Tapping project card → Project Page

### My Support Screen
- **Karma Card**: Large display of karma points, level badge, emoji
- **Progress Bar**: Progress to next karma level
- **Stats Row**: Projects supported, Messages sent, Posts liked
- **Projects You Support**: List of followed projects
- **Recent Activity**: Feed of recent support actions with karma earned
- Empty state if no followed projects

### Profile Screen
- Avatar, name, bio
- "Creator" badge if is_creator = true
- "Edit Profile" button
- **My Projects** section (if creator):
  - List of user's projects
  - "Create New Project" option
  - Edit button on each project
- **FAB** (Floating Action Button): Quick "New Update" for creators
- "Sign Out" button

### Project Page
**Header Section:**
- Cover image (or placeholder gradient with 🚀)
- Title, tagline
- Mood indicator (green/yellow/red dot)
- Creator row (avatar, name, "View Profile")
- Follower count
- Follow/Following button
- "Send Support" button

**Tab Navigation:**
- **About**: Description, links
- **Updates**: Posts from this project (owner can add/delete)
- **Milestones**: List of milestones (owner can CRUD, toggle complete)

**Support Messages Section:**
- Recent support messages (last 5)

**Owner Controls (visible only if user owns project):**
- Edit project button in header
- Change mood button
- Add/edit/delete posts
- Add/edit/delete/toggle milestones

### Creator Profile Page
- Large avatar
- Name, bio
- Website and Twitter links (tappable)
- "Projects" section listing their projects

---

## 6. Navigation Structure

### Tab Bar (4 tabs)
```
(tabs)/
├── index.tsx → Home (icon: Home)
├── discover.tsx → Discover (icon: Search)
├── support.tsx → My Support (icon: Heart)
└── profile.tsx → Profile (icon: User)
```

### Stack Navigation
```
app/
├── _layout.tsx (Root Stack)
├── (tabs)/_layout.tsx (Tab Navigator)
├── login.tsx (headerShown: false)
├── signup.tsx (headerShown: false)
├── onboarding.tsx (headerShown: false)
├── project/[slug].tsx
├── creator/[id].tsx
├── create-project.tsx (presentation: modal)
├── edit-project.tsx
├── create-post.tsx (presentation: modal)
└── edit-profile.tsx
```

### Navigation Logic
```
if (!user) → /login
else if (!hasCompletedOnboarding) → /onboarding
else → /(tabs)
```

---

## 7. Core Features

### Follow/Unfollow Logic
```typescript
// Follow
1. Insert into `follows` table (user_id, project_id)
2. Call RPC `increment_follower_count` or manually update projects.follower_count
3. Log support_action (type: 'follow', points: 5)
4. Add 5 karma points to user

// Unfollow
1. Delete from `follows` where user_id and project_id match
2. Call RPC `decrement_follower_count` or manually decrement
3. No karma change
```

### Like/Unlike Logic
```typescript
// Like
1. Insert into `likes` table (user_id, post_id)
2. Increment posts.like_count
3. Log support_action (type: 'like', points: 1)
4. Add 1 karma point to user

// Unlike
1. Delete from `likes` where user_id and post_id match
2. Decrement posts.like_count
3. No karma deduction
```

### Karma System

**Points Earned:**
| Action | Points |
|--------|--------|
| Follow a project | +5 |
| Send support message | +10 |
| Like a post | +1 |

**Karma Levels:**
| Level | Points Range | Label | Emoji |
|-------|--------------|-------|-------|
| 1 | 0-50 | New Supporter | 🌱 |
| 2 | 51-200 | Supporter | 💚 |
| 3 | 201-500 | Super Supporter | 💜 |
| 4 | 501-1000 | Champion | ⭐ |
| 5 | 1001+ | Legend | 👑 |

**Level Calculation:**
```typescript
function getKarmaLevel(points: number) {
  if (points >= 1001) return { label: 'Legend', emoji: '👑' };
  if (points >= 501) return { label: 'Champion', emoji: '⭐' };
  if (points >= 201) return { label: 'Super Supporter', emoji: '💜' };
  if (points >= 51) return { label: 'Supporter', emoji: '💚' };
  return { label: 'New Supporter', emoji: '🌱' };
}
```

### Support Messages
```typescript
// Send support message
1. Get sender's builder_id from builders table
2. Insert into support_messages (project_id, sender_id, message, is_anonymous)
3. Log support_action (type: 'message', points: 10)
4. Add 10 karma points to user
```

### Project Mood
- Three states: green ("Going great!"), yellow ("Working on it"), red ("Need support")
- Only project owner can change
- Displayed as colored dot with label

---

## 8. All API/Database Functions

### Authentication
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getCurrentUser()` | - | `User \| null` | Get current auth user |
| `getBuilderProfile(userId)` | `userId: string` | `Builder \| null` | Get builder by auth user ID |
| `updateBuilderProfile(userId, updates)` | `userId, {name?, bio?, avatar_url?, is_creator?}` | `Builder \| null` | Update builder profile |
| `getKarma(userId)` | `userId: string` | `Karma \| null` | Get karma record |

### Projects
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getProjects()` | - | `Project[]` | All published projects with builder |
| `getTrendingProjects(limit)` | `limit: number` | `Project[]` | Projects sorted by follower_count |
| `getNewProjects(limit)` | `limit: number` | `Project[]` | Projects sorted by created_at |
| `getProject(slug)` | `slug: string` | `Project \| null` | Single project by public_slug |
| `getProjectsByBuilder(builderId)` | `builderId: string` | `Project[]` | All projects by a builder |
| `createProject(params)` | `{builder_id, title, tagline, description?, cover_image_url?, public_slug}` | `Project \| null` | Create new project |
| `updateProject(projectId, updates)` | `projectId, {title?, tagline?, description?, cover_image_url?, public_slug?, mood?, is_published?}` | `Project \| null` | Update project |
| `deleteProject(projectId)` | `projectId: string` | `boolean` | Delete project |
| `generateSlug(title)` | `title: string` | `string` | Generate URL-safe slug |
| `checkSlugExists(slug)` | `slug: string` | `boolean` | Check if slug is taken |

### Posts
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getFeedPosts(userId)` | `userId: string` | `Post[]` | Posts from followed projects |
| `getProjectPosts(projectId)` | `projectId: string` | `Post[]` | Posts for a project |
| `getPost(postId)` | `postId: string` | `Post \| null` | Single post with project/builder |
| `createPost(params)` | `{project_id, content, images?}` | `Post \| null` | Create new post |
| `updatePost(postId, updates)` | `postId, {content?, images?}` | `Post \| null` | Update post |
| `deletePost(postId)` | `postId: string` | `boolean` | Delete post |

### Builders
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getBuilder(builderId)` | `builderId: string` | `Builder \| null` | Get builder by ID |
| `getBuilderByUserId(userId)` | `userId: string` | `Builder \| null` | Get builder by auth user ID |
| `updateBuilderProfileFull(userId, updates)` | `userId, {name?, bio?, avatar_url?, website_url?, twitter_handle?, is_creator?}` | `Builder \| null` | Full profile update |

### Follows
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getFollowedProjects(userId)` | `userId: string` | `Project[]` | Projects user follows |
| `isFollowingProject(userId, projectId)` | `userId, projectId` | `boolean` | Check if following |
| `getFollowerCount(projectId)` | `projectId: string` | `number` | Count followers |
| `followProject(userId, projectId)` | `userId, projectId` | `boolean` | Follow + karma |
| `unfollowProject(userId, projectId)` | `userId, projectId` | `boolean` | Unfollow |

### Milestones
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getProjectMilestones(projectId)` | `projectId: string` | `Milestone[]` | Milestones for project |
| `createMilestone(params)` | `{project_id, title, description?, target_date?}` | `Milestone \| null` | Create milestone |
| `updateMilestone(milestoneId, updates)` | `milestoneId, {title?, description?, target_date?, is_completed?, completed_at?}` | `Milestone \| null` | Update milestone |
| `toggleMilestoneComplete(milestoneId, isCompleted)` | `milestoneId, isCompleted` | `Milestone \| null` | Toggle completion |
| `deleteMilestone(milestoneId)` | `milestoneId: string` | `boolean` | Delete milestone |

### Likes
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `likePost(userId, postId, projectId)` | `userId, postId, projectId` | `boolean` | Like + karma |
| `unlikePost(userId, postId)` | `userId, postId` | `boolean` | Unlike |
| `isPostLiked(userId, postId)` | `userId, postId` | `boolean` | Check if liked |
| `getUserLikedPostIds(userId, postIds)` | `userId, postIds[]` | `string[]` | Batch check likes |

### Support Messages
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getProjectSupportMessages(projectId, limit)` | `projectId, limit` | `SupportMessage[]` | Recent messages |
| `sendSupportMessage(params)` | `{userId, projectId, message, isAnonymous}` | `SupportMessage \| null` | Send message + karma |

### Karma & Actions
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `addKarma(userId, points)` | `userId, points` | `Karma \| null` | Add karma, update level |
| `getUserKarma(userId)` | `userId: string` | `Karma \| null` | Get karma record |
| `logSupportAction(userId, projectId, actionType, pointsEarned, metadata?)` | various | `void` | Log action |
| `getUserSupportActions(userId, limit)` | `userId, limit` | `SupportAction[]` | Recent actions |
| `getUserSupportStats(userId)` | `userId: string` | `{projectsSupported, messagesSent, postsLiked}` | Stats counts |
| `getProjectSupporters(projectId)` | `projectId: string` | `Builder[]` | Users following project |

---

## 9. Data Flow

### Feed Loading
1. Get user's followed project IDs from `follows` table
2. Query `posts` where `project_id` in followed IDs
3. Include nested `project` with `builder` info via Supabase joins
4. Batch fetch user's liked post IDs for the returned posts
5. Render with like state pre-populated

### Query Example (Feed)
```typescript
const { data: follows } = await supabase
  .from('follows')
  .select('project_id')
  .eq('user_id', userId);

const projectIds = follows.map(f => f.project_id);

const { data: posts } = await supabase
  .from('posts')
  .select(`
    *,
    project:projects(
      id, title, public_slug, cover_image_url,
      builder:builders(id, name, avatar_url)
    )
  `)
  .in('project_id', projectIds)
  .order('created_at', { ascending: false })
  .limit(50);
```

### Caching Strategy
- Uses React Query with query keys for caching
- Pull-to-refresh invalidates relevant queries
- Optimistic updates for follow/like actions

### Real-Time Updates
Currently no real-time subscriptions. Data refreshes on:
- Pull-to-refresh
- Navigation back to screen
- After mutations (invalidate queries)

---

## 10. UI Components

### Reusable Components

| Component | Props | Description |
|-----------|-------|-------------|
| `ProjectCard` | `project, variant` | Displays project (full/compact/horizontal) |
| `PostCard` | `post, showProjectInfo, isLiked, onLikeChange` | Post with like button |
| `CreatorRow` | `builder, showViewProfile, size` | Avatar + name row |
| `MilestoneItem` | `milestone, isOwner, onToggle, onEdit, onDelete` | Milestone with controls |
| `SupportMessageBubble` | `message` | Chat-like message display |
| `SupportModal` | `visible, onClose, project` | Modal to send support |

### Design Patterns
- **Cards**: Rounded corners (16px), white background, 1px border
- **Buttons**: Primary (filled indigo), Secondary (outlined), Destructive (red)
- **Spacing**: Consistent 20px horizontal padding, 16px gaps
- **Typography**: System font, weights 400/500/600/700
- **Icons**: Lucide icons throughout

---

## 11. Color Scheme

```swift
// Primary
let primary = Color(hex: "#6366F1")      // Indigo
let primaryLight = Color(hex: "#818CF8")
let primaryDark = Color(hex: "#4F46E5")

// Secondary
let secondary = Color(hex: "#F59E0B")    // Amber
let secondaryLight = Color(hex: "#FBBF24")

// Background
let background = Color(hex: "#FAFAFA")   // Light gray
let surface = Color(hex: "#FFFFFF")      // White
let surfaceSecondary = Color(hex: "#F3F4F6")

// Text
let text = Color(hex: "#111827")         // Near black
let textSecondary = Color(hex: "#6B7280")
let textTertiary = Color(hex: "#9CA3AF")
let textInverse = Color(hex: "#FFFFFF")

// Border
let border = Color(hex: "#E5E7EB")
let borderLight = Color(hex: "#F3F4F6")

// Status
let success = Color(hex: "#10B981")      // Green
let error = Color(hex: "#EF4444")        // Red
let warning = Color(hex: "#F59E0B")      // Amber

// Karma (special purple)
let karma = Color(hex: "#8B5CF6")
let karmaLight = Color(hex: "#A78BFA")
```

---

## 12. Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For Swift, store in:
- Info.plist (non-sensitive)
- Keychain (sensitive)
- Or use a configuration file

---

## 13. Utility Functions

### Time Formatting
```swift
func formatRelativeTime(_ dateString: String) -> String {
    // Returns: "just now", "5m ago", "2h ago", "3d ago", "2w ago", "1mo ago", "1y ago"
}

func formatDate(_ dateString: String) -> String {
    // Returns: "Jan 15, 2024"
}
```

---

## 14. State Management Notes

For Swift/SwiftUI equivalent:
- **React Query** → Combine/async-await with caching layer or third-party like Apollo
- **Context/Providers** → `@EnvironmentObject` or `@StateObject`
- **AsyncStorage** → `UserDefaults` or Keychain
- **Local state** → `@State` and `@Binding`

---

## 15. Key Implementation Notes

1. **Optimistic UI**: Follow/like actions update UI immediately, revert on error
2. **Batch Queries**: Fetch liked post IDs in batch for feed efficiency
3. **Slug Generation**: `title.lowercased().replacingSpecialChars().addRandomSuffix()`
4. **Owner Checks**: Compare `project.builder.user_id == currentUser.id`
5. **Anonymous Support**: When `is_anonymous = true`, hide sender info
6. **Mood Colors**: green=#10B981, yellow=#F59E0B, red=#EF4444

---

This documentation provides everything needed to rebuild the app with the same Supabase backend. The database schema, API functions, and business logic remain the same—only the client implementation changes from React Native to Swift/SwiftUI.
