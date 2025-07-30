# AI Colab - Coding Challenge Platform

A modern web application for creating, solving, and managing coding challenges with AI-powered problem generation.

## ✨ Features

- **AI-Powered Problem Generation**: Create coding challenges using Google Gemini AI (OpenAI API integration coming soon)
- **Daily Challenges**: Automatically generated daily coding problems
- **Code Editor**: Built-in Monaco Editor with syntax highlighting and code execution
- **User Authentication**: Secure login/signup system with NextAuth.js
- **Progress Tracking**: Monitor your coding progress, points, and rank
- **Submission Management**: View and track all your code submissions
- **Problem Categories**: Organized by Programming Fundamentals, OOP, and DSA
- **Real-time Code Execution**: Test your solutions before submitting

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js
- **Code Editor**: Monaco Editor
- **AI Integration**: OpenAI API
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB database
- OpenAI API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/furqanahmad03/ai-colab.git
   cd ai-colab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="your-mongodb-connection-string"
   OPENAI_API_KEY="your-gemini-api-key"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Run database migrations**
   ```bash
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Netlify Deployment

1. **Connect your repository** to Netlify
2. **Set build command**: `npx prisma generate && npm run build`
3. **Set publish directory**: `.next`
4. **Add environment variables** in Netlify dashboard:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)

### Important Notes for Deployment

- **Prisma Generation**: Always run `prisma generate` before building
- **Environment Variables**: Ensure all required env vars are set in production
- **Database**: Use a production MongoDB instance

## 📁 Project Structure
```bash
colab/
├── prisma/
│   └── schema.prisma              # Database schema
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API routes
│   │   │   ├── ai/generate/       # AI problem generation
│   │   │   ├── auth/              # Authentication
│   │   │   ├── challenges/        # Challenge management
│   │   │   ├── daily-challanges/  # Daily challenges
│   │   │   ├── dashboard/         # Dashboard APIs
│   │   │   ├── submissions/       # Submission management
│   │   │   └── users/             # User management
│   │   ├── components/            # Page components
│   │   ├── dashboard/             # Dashboard pages
│   │   ├── problems/              # Problem pages
│   │   ├── login/                 # Auth pages
│   │   └── signup/
│   ├── components/                # Shared UI components
│   │   └── ui/                    # UI component library
│   ├── lib/                       # Utilities & helpers
│   └── types/                     # TypeScript types
├── package.json                   # Dependencies & scripts
└── tailwind.config.ts            # Tailwind configuration
```

## 🔌 API Routes

- `POST /api/ai/generate` - Generate new coding challenges
- `GET /api/challenges` - Fetch all challenges
- `GET /api/challenges/[id]` - Get specific challenge
- `POST /api/submissions` - Submit code solutions
- `GET /api/submissions` - Fetch user submissions
- `GET /api/daily-challanges` - Get daily challenges
- `POST /api/auth/signup` - User registration
- `GET /api/auth/[...nextauth]` - NextAuth.js routes

## 🎯 Key Features Explained

### Dashboard
- **User Statistics**: Problems solved, total points, and rank
- **Recent Problems**: Latest 5 problems created by the user
- **Today's Challenge**: Current daily challenge with submission count
- **Progress Tracking**: Visual representation of coding progress

### Problem Management
- **AI Generation**: Create problems using natural language descriptions
- **Difficulty Levels**: Easy, Medium, Hard with appropriate scoring
- **Categories**: Automatic categorization (PF, OOP, DSA) based on tags
- **Status Tracking**: Track problem status (not solved, accepted, rejected)

### Code Editor
- **Monaco Integration**: Professional code editing experience
- **Syntax Highlighting**: Support for multiple programming languages
- **Code Execution**: Test solutions before submission
- **Submission Management**: Track all attempts and results

## 🔮 Future Updates

- **OpenAI Integration**: Replace Google Gemini with OpenAI API for enhanced problem generation
- **Advanced Analytics**: Detailed performance metrics and insights
- **Community Features**: User rankings, leaderboards, and discussions
- **Code Review System**: Peer review and feedback mechanisms
- **Mobile App**: React Native mobile application

## 🐛 Troubleshooting

### Common Issues

1. **Prisma Client Not Generated**
   ```bash
   npx prisma generate
   ```

2. **Database Connection Issues**
   - Verify `DATABASE_URL` in environment variables
   - Ensure MongoDB instance is accessible

3. **AI Generation Failures**
   - Check `GEMINI_API_KEY` is valid
   - Verify API quota and limits

4. **Build Failures on Netlify**
   - Ensure build command includes `prisma generate`
   - Check all environment variables are set

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support and questions, please open an issue in the repository or contact the development team.
