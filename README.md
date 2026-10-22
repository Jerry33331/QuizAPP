# Mohammed's Quiz App

A movie-themed quiz application with authentication, leaderboards, and admin tools.

## Features

- **5 Movie Quizzes**: Classic Movies, Superhero Movies, Animated Movies, Horror Movies, 2020s Movies
- **User Authentication**: Register, login, logout with secure password hashing
- **Role-Based Access**: Player and Admin (Teacher) roles
- **Quiz Engine**: Take quizzes, see scores, retry attempts
- **History**: View your past quiz attempts
- **Leaderboards**: Overall and per-quiz rankings
- **Admin Tools**: Question editor, CSV import

## Theme

- **Colors**: Forest Green (#2E8B57), Sage Green (#9DC183), Light Cream (#FFF8F0)
- **Font**: Open Sans
- **Style**: Cozy and warm with rounded corners and soft shadows

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js 24 LTS, Express 5
- **Database**: PostgreSQL (Replit)
- **ORM**: pg with parameterized queries
- **Authentication**: Express-session with bcrypt

## Project Structure

```
/quiz-app
├── /public              # Static files
│   ├── /css             # Stylesheets
│   ├── /js              # Client-side JavaScript
│   └── /pages           # HTML pages
│       ├── /auth        # Authentication pages
│       ├── /quizzes     # Quiz pages
│       └── /admin       # Admin pages
├── /src                # Server code
│   ├── /models          # Database models
│   ├── /routes          # Express routes
│   ├── /middleware      # Authentication middleware
│   └── server.js        # Main server entry
├── package.json
├── package-lock.json
└── README.md
```

## Development Phases

1. **Phase 1: Foundation & Authentication** - Express server, database, user system
2. **Phase 2: Quiz Engine** - Quiz selection, display, submission, scoring
3. **Phase 3: Attempts & History** - Save attempts, user history
4. **Phase 4: Leaderboards & Admin** - Rankings, question editor, CSV import
5. **Phase 5: Custom Features** - Student-designed features, production deployment

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file based on `.env.example`
4. Start the server: `npm start`
5. Open `http://localhost:3000` in your browser

## Database

The application uses PostgreSQL. The connection is configured via environment variables:

- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `SESSION_SECRET`: Secret for session encryption

## License

This project is for educational purposes.
