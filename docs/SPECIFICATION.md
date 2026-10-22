# Quiz App - Technical Specification & Development Plan

---

## 1. Project Overview

**Purpose**: A web-based quiz application that allows students to take quizzes and teachers to manage quiz content.

**Target Users**: High school students (players) and teachers (admins)

---

## 2. System Architecture

### Tech Stack Summary
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js 24 LTS + Express 5
- **Database**: Replit PostgreSQL (separate dev/prod instances)
- **ORM**: `pg` library with parameterized SQL queries
- **Authentication**: Session-based with hashed passwords
- **Deployment**: Replit (QA) -> Replit Deployment (Production)

### File Structure
```
/quiz-app
├── /public              # Static files
│   ├── /css             # Stylesheets
│   ├── /js              # Client-side JavaScript
│   ├── /pages           # HTML pages
│   │   ├── auth/        # login.html, register.html
│   │   ├── quizzes/     # list.html, take.html, results.html
│   │   ├── history.html
│   │   ├── leaderboard.html
│   │   └── /admin/      # questions.html, import.html
│   └── /assets          # Images, etc.
├── /src                # Server code
│   ├── /routes          # Express route handlers
│   ├── /models          # Database models
│   ├── /middleware      # Auth, validation
│   └── server.js        # Main server entry
├── /uploads             # Temporary CSV uploads
├── .env                 # Environment variables
├── package.json
├── package-lock.json
└── README.md
```

---

## 3. Database Schema

### Tables & Relationships

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **users** | User accounts | id, username, email, password_hash, role, created_at |
| **quizzes** | Quiz metadata | id, title, description, created_at, is_active |
| **questions** | Quiz questions | id, quiz_id, text, created_at |
| **answer_choices** | Answer options | id, question_id, text, is_correct, display_order |
| **attempts** | Quiz attempts | id, user_id, quiz_id, score, total_questions, completed_at, is_completed |
| **attempt_answers** | Individual responses | id, attempt_id, question_id, selected_choice_id, is_correct |

### ER Diagram (Textual)
```
users 1──┬──* attempts
         │
quizzes 1──┬──* questions
         │
         └──* attempts

questions 1──* answer_choices
attempts 1──* attempt_answers
```

---

## 4. Core Features & API Specification

### 4.1 Authentication
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/register` | POST | Create user account | No |
| `/api/auth/login` | POST | Authenticate user | No |
| `/api/auth/logout` | POST | End session | Yes |
| `/api/auth/me` | GET | Get current user | Yes |

**Password Security**: Use `bcrypt` with salt rounds = 10. Never store plain text.

### 4.2 Quizzes
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/quizzes` | GET | List all active quizzes | Yes (player) |
| `/api/quizzes/:id` | GET | Get quiz + questions (shuffled) | Yes (player) |

### 4.3 Attempts
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/attempts` | POST | Start new attempt | Yes (player) |
| `/api/attempts/:id/submit` | POST | Submit answers | Yes (player) |
| `/api/attempts` | GET | User's history | Yes (player) |
| `/api/attempts/:id` | GET | Attempt details | Yes (player) |

**Attempt Logic**:
- All questions for a quiz appear on **one page**.
- Questions are **shuffled randomly** for each new attempt.
- Answer choices are **always displayed in order: A, B, C, D** (not shuffled).
- Users **must answer all questions** to submit; skipping is not allowed.
- `is_completed = false` when started
- `is_completed = true` when submitted
- Score = count of correct answers
- Only `is_completed = true` attempts count toward leaderboards
- Unfinished attempts are **saved as drafts** and can be resumed later.

### 4.4 Leaderboards
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/leaderboard` | GET | Overall leaderboard | Yes |
| `/api/quizzes/:id/leaderboard` | GET | Per-quiz leaderboard | Yes |

**Overall Leaderboard Query**:
```sql
SELECT u.username, COUNT(a.id) as total_attempts
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.is_completed = true
GROUP BY u.username
ORDER BY total_attempts DESC;
```

**Per-Quiz Leaderboard Query**:
```sql
SELECT u.username,
       MAX(a.score) as highest_score,
       COUNT(a.id) as attempt_count
FROM users u
JOIN attempts a ON u.id = a.user_id
WHERE a.quiz_id = $1 AND a.is_completed = true
GROUP BY u.username
ORDER BY highest_score DESC, attempt_count DESC;
```

### 4.5 Admin Features
| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/questions` | GET | List all questions | Admin |
| `/api/questions` | POST | Create question | Admin |
| `/api/questions/:id` | PUT | Edit question | Admin |
| `/api/questions/:id` | DELETE | Delete question | Admin |
| `/api/quizzes/:id` | DELETE | Soft-delete quiz (set is_active=false) | Admin |
| `/api/questions/import/preview` | POST | Validate CSV | Admin |
| `/api/questions/import` | POST | Import questions | Admin |

**Deletion Rules**:
- When a quiz is deleted, it is **soft-deleted** (marked as `is_active = false`). The quiz, its questions, and all past attempts remain in the database but are hidden from students.
- When a question is edited, **old attempts continue to display the original question text and choices** as they were when the attempt was made. Leaderboard scores are never changed by edits.

**CSV Format**:
```csv
quiz_title,question_text,choice_1,choice_2,choice_3,choice_4,correct_choice
Math,What is 2+2?,3,4,5,6,2
```

**Validation Rules**:
- Quiz must exist (or create if new)
- Exactly 4 choices per question
- `correct_choice` must be 1-4 (index)
- All fields required
- Return row-by-row validation errors

---

## 5. Frontend Pages & Flow

### User Flow
```
Login/Register -> Quiz List -> Select Quiz -> Take Quiz (one page, shuffled) -> Results -> History/Leaderboard
                                   ↑
                          (Retry or Back)
```

### Page Inventory

| Page | File | Purpose | Access |
|------|------|---------|--------|
| Home | `/public/pages/index.html` | Quiz list | All |
| Login | `/public/pages/auth/login.html` | Authentication | All |
| Register | `/public/pages/auth/register.html` | Account creation | All |
| Take Quiz | `/public/pages/quizzes/take.html` | **One-page quiz, questions shuffled** | Player |
| Results | `/public/pages/quizzes/results.html` | Score display | Player |
| History | `/public/pages/history.html` | Attempt history | Player |
| Leaderboard | `/public/pages/leaderboard.html` | Overall rankings | All |
| Quiz Leaderboard | `/public/pages/quiz-leaderboard.html` | Per-quiz rankings | All |
| Question Editor | `/public/pages/admin/questions.html` | Manage questions | Admin |
| CSV Import | `/public/pages/admin/import.html` | Bulk upload | Admin |

---

## 6. Security Requirements

1. **Password Storage**: bcrypt hashing (cost factor 10)
2. **SQL Injection**: Parameterized queries only (no string concatenation)
3. **Session Management**: Secure, HTTP-only cookies
4. **Authentication**: Role checks on every protected route
5. **CSRF Protection**: Consider adding CSRF tokens for forms
6. **Input Validation**: Sanitize all user inputs
7. **Error Handling**: Don't expose stack traces in production

---

## 7. Five Development Phases

### Phase 1: Foundation & Setup (Week 1)
**Goal**: Project infrastructure and database

| Task | Deliverable |
|------|-------------|
| Initialize Node.js project | `package.json`, `package-lock.json` |
| Set up Express server | `server.js` with static file serving |
| Configure PostgreSQL | Connection pool, schema creation |
| Create database models | `/src/models/` for users, quizzes, etc. |
| Set up GitHub repo | Initial commit with README |
| Environment configuration | `.env` for database credentials |

**Success Criteria**: Server runs, database connected, basic routes respond

---

### Phase 2: Authentication System (Week 2)
**Goal**: User registration, login, and session management

| Task | Deliverable |
|------|-------------|
| User model & table | `users` table with password hashing |
| Registration endpoint | POST `/api/auth/register` |
| Login endpoint | POST `/api/auth/login` |
| Logout endpoint | POST `/api/auth/logout` |
| Session middleware | Auth check for protected routes |
| Login/Register pages | HTML/CSS/JS for auth flows |
| Role-based access | Player vs Admin differentiation |

**Success Criteria**: Users can create accounts, log in/out, sessions persist

---

### Phase 3: Quiz Engine (Week 3)
**Goal**: Core quiz functionality

| Task | Deliverable |
|------|-------------|
| Quiz & Question models | Database tables and models |
| Quiz listing | GET `/api/quizzes` + frontend |
| Quiz taking UI | **One-page display, questions shuffled** |
| Answer submission | POST `/api/attempts/:id/submit` |
| Score calculation | Server-side scoring |
| Attempt persistence | Save to `attempts` table |
| Results page | Show score, percentage, correct answers |
| History page | GET `/api/attempts` + display |

**Success Criteria**: Users can take quizzes, see scores, view history

---

### Phase 4: Leaderboards & Admin (Week 4)
**Goal**: Ranking systems and content management

| Task | Deliverable |
|------|-------------|
| Overall leaderboard | GET `/api/leaderboard` + frontend |
| Per-quiz leaderboard | GET `/api/quizzes/:id/leaderboard` |
| Question editor UI | Create/edit/delete questions |
| CSV import | Preview, validation, import |
| Admin protection | Route guards for admin-only |
| Leaderboard pages | HTML/CSS/JS for rankings |

**Success Criteria**: Leaderboards display correctly, admins can manage content

---

### Phase 5: Polish & Student Features (Week 5)
**Goal**: Custom features and deployment

| Task | Deliverable |
|------|-------------|
| **Each student**: Design 2 additional features | Functional, not cosmetic |
| Feature implementation | Working code in repo |
| Testing & bug fixing | All features verified |
| UI/UX improvements | Consistent styling |
| Deployment to Replit | Production instance |
| Documentation | Updated README |

**Example Student Features** (pick 2 per student):
- Timer for quizzes
- Question randomization
- Category filtering for quizzes
- Progress tracking across sessions
- Export attempt history as PDF
- Dark mode toggle
- Question hints (limited)
- Skip question functionality
- Review mode for incorrect answers
- Multiplayer quiz mode
- Daily streak counter
- Achievement badges

**Success Criteria**: All required features work, 2 custom features per student implemented, app deployed

---

## 8. Data Requirements

### Initial Data Setup
- Create 5 quizzes with 10+ questions each
- Sample categories: Math, Science, History, Literature, General Knowledge
- Each quiz must have exactly 4 choices per question
- One correct answer per question

### CSV Import Template
```csv
quiz_title,question_text,choice_1,choice_2,choice_3,choice_4,correct_choice
Math,"What is 2+2?","3","4","5","6",2
Math,"What is 3x3?","6","9","12","15",2
Science,"What is H2O?","Hydrogen","Oxygen","Water","Fire",3
```

---

## 9. Testing Strategy

### Manual Testing Checklist
- [ ] User registration with unique username/email
- [ ] Login/logout flow
- [ ] Password hashing verification
- [ ] Quiz selection and display
- [ ] Questions appear in random order for each new attempt
- [ ] Answer choices always appear as A, B, C, D
- [ ] All questions must be answered to submit
- [ ] Answer submission and scoring
- [ ] Attempt history display
- [ ] Overall leaderboard accuracy
- [ ] Per-quiz leaderboard accuracy
- [ ] Admin question creation/editing
- [ ] CSV import with valid data
- [ ] CSV import with invalid data (error handling)
- [ ] Unfinished attempts saved as drafts
- [ ] Draft attempts can be resumed
- [ ] Retries create new attempts
- [ ] Leaderboards show usernames, not emails
- [ ] Soft-deleted quizzes hidden from students
- [ ] Old attempts show original question text even after edits

---

## 10. Deployment Checklist

- [ ] Separate production database configured
- [ ] Environment variables set in Replit
- [ ] `NODE_ENV=production` in production
- [ ] Error handling doesn't expose stack traces
- [ ] All dependencies in `package-lock.json`
- [ ] Static files served correctly
- [ ] Database connection pool configured
