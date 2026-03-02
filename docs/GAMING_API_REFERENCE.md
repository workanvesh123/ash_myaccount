# 🎮 Gaming Platform - API Reference

## 📡 Base URL

```
http://localhost:5000/api/v1
```

---

## 🎲 Game Endpoints

### 1. Get All Games

**GET** `/games`

Get list of all available games.

**Response:**
```json
{
  "games": [
    {
      "id": "sudoku",
      "name": "Sudoku",
      "description": "Classic number puzzle game",
      "iconUrl": "/assets/games/sudoku.png",
      "category": "Logic",
      "minPlayers": 1,
      "maxPlayers": 1,
      "averageDuration": 600,
      "difficulty": ["Easy", "Medium", "Hard"],
      "isActive": true
    }
  ]
}
```

---

### 2. Get Game Details

**GET** `/games/{gameId}`

Get detailed information about a specific game.

**Response:**
```json
{
  "id": "sudoku",
  "name": "Sudoku",
  "description": "Fill the grid with numbers 1-9...",
  "rules": "Each row, column, and 3x3 box must contain...",
  "howToPlay": "Click a cell and select a number...",
  "iconUrl": "/assets/games/sudoku.png",
  "category": "Logic",
  "difficulty": ["Easy", "Medium", "Hard"],
  "scoring": {
    "easy": { "base": 100, "hintPenalty": 5, "mistakePenalty": 10 },
    "medium": { "base": 250, "hintPenalty": 10, "mistakePenalty": 20 },
    "hard": { "base": 500, "hintPenalty": 20, "mistakePenalty": 40 }
  }
}
```

---

### 3. Start New Game

**POST** `/games/{gameId}/start`

Start a new game session.

**Request:**
```json
{
  "difficulty": "Medium",
  "options": {
    "timerEnabled": true,
    "hintsEnabled": true,
    "maxHints": 3
  }
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "gameId": "sudoku",
  "userId": "user123",
  "difficulty": "Medium",
  "startedAt": "2026-02-28T10:30:00Z",
  "gameState": {
    "board": [[5,3,0,0,7,0,0,0,0], ...],
    "solution": [[5,3,4,6,7,8,9,1,2], ...],
    "hintsRemaining": 3,
    "mistakeCount": 0
  },
  "status": "InProgress"
}
```

---

### 4. Save Game State

**PUT** `/games/sessions/{sessionId}/state`

Auto-save game progress.

**Request:**
```json
{
  "gameState": {
    "board": [[5,3,4,0,7,0,0,0,0], ...],
    "hintsRemaining": 2,
    "mistakeCount": 1,
    "elapsedTime": 180
  }
}
```

**Response:**
```json
{
  "success": true,
  "savedAt": "2026-02-28T10:33:00Z"
}
```

---

### 5. Complete Game

**POST** `/games/sessions/{sessionId}/complete`

Submit completed game for scoring.

**Request:**
```json
{
  "completedBoard": [[5,3,4,6,7,8,9,1,2], ...],
  "elapsedTime": 420,
  "hintsUsed": 1,
  "mistakesMade": 2
}
```

**Response:**
```json
{
  "success": true,
  "isCorrect": true,
  "score": 430,
  "breakdown": {
    "baseScore": 250,
    "timeBonus": 200,
    "hintPenalty": -10,
    "mistakePenalty": -40,
    "finalScore": 430
  },
  "achievements": [
    {
      "id": "first-sudoku",
      "name": "First Sudoku",
      "points": 10
    }
  ],
  "newRank": 42,
  "personalBest": false
}
```

---

### 6. Get Game History

**GET** `/games/history?page=1&pageSize=20&gameId=sudoku`

Get user's game history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `gameId` (optional): Filter by game
- `completed` (optional): Filter by completion status

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "gameId": "sudoku",
      "gameName": "Sudoku",
      "difficulty": "Medium",
      "startedAt": "2026-02-28T10:30:00Z",
      "completedAt": "2026-02-28T10:37:00Z",
      "duration": 420,
      "score": 430,
      "isCompleted": true,
      "rank": 42
    }
  ],
  "totalCount": 127,
  "page": 1,
  "pageSize": 20,
  "totalPages": 7
}
```

---

### 7. Get Game Hint

**POST** `/games/sessions/{sessionId}/hint`

Request a hint for current game.

**Response:**
```json
{
  "hint": {
    "row": 0,
    "col": 2,
    "value": 4,
    "explanation": "This cell can only be 4"
  },
  "hintsRemaining": 2
}
```

---

### 8. Validate Move

**POST** `/games/sessions/{sessionId}/validate`

Validate a player's move.

**Request:**
```json
{
  "row": 0,
  "col": 2,
  "value": 4
}
```

**Response:**
```json
{
  "isValid": true,
  "isCorrect": true,
  "message": "Correct!"
}
```

---

## 🏆 Achievement Endpoints

### 1. Get All Achievements

**GET** `/achievements`

Get list of all achievements.

**Response:**
```json
{
  "achievements": [
    {
      "id": "first-game",
      "name": "First Game",
      "description": "Complete your first game",
      "iconUrl": "/assets/achievements/first-game.png",
      "category": "Beginner",
      "points": 10,
      "requirement": {
        "type": "GameCount",
        "count": 1
      },
      "rarity": "Common"
    }
  ]
}
```

---

### 2. Get User Achievements

**GET** `/achievements/user`

Get user's unlocked achievements.

**Response:**
```json
{
  "achievements": [
    {
      "achievementId": "first-game",
      "name": "First Game",
      "description": "Complete your first game",
      "iconUrl": "/assets/achievements/first-game.png",
      "points": 10,
      "unlockedAt": "2026-02-28T10:37:00Z",
      "progress": {
        "current": 1,
        "required": 1,
        "percentage": 100
      }
    }
  ],
  "totalPoints": 450,
  "totalAchievements": 23,
  "completionPercentage": 46
}
```

---

### 3. Get Achievement Progress

**GET** `/achievements/progress`

Get progress towards locked achievements.

**Response:**
```json
{
  "progress": [
    {
      "achievementId": "sudoku-master",
      "name": "Sudoku Master",
      "description": "Complete 50 Sudoku puzzles",
      "current": 23,
      "required": 50,
      "percentage": 46
    }
  ]
}
```

---

## 📊 Leaderboard Endpoints

### 1. Get Global Leaderboard

**GET** `/leaderboards/global?gameId=sudoku&period=AllTime&page=1&pageSize=50`

Get global leaderboard.

**Query Parameters:**
- `gameId` (optional): Filter by game (omit for overall)
- `period`: Daily, Weekly, Monthly, AllTime
- `page` (optional): Page number
- `pageSize` (optional): Items per page

**Response:**
```json
{
  "entries": [
    {
      "rank": 1,
      "userId": "user456",
      "username": "Alice",
      "avatarUrl": "/avatars/alice.jpg",
      "score": 15420,
      "gamesPlayed": 87,
      "winRate": 94.5,
      "lastPlayed": "2026-02-28T09:15:00Z"
    }
  ],
  "userEntry": {
    "rank": 42,
    "userId": "user123",
    "username": "John",
    "score": 12340,
    "gamesPlayed": 127
  },
  "totalEntries": 1523,
  "page": 1,
  "pageSize": 50
}
```

---

### 2. Get Friend Leaderboard

**GET** `/leaderboards/friends?gameId=sudoku&period=Weekly`

Get leaderboard of friends only.

**Response:** (Same structure as global leaderboard)

---

### 3. Get User Rank

**GET** `/leaderboards/rank?gameId=sudoku&period=AllTime`

Get user's current rank.

**Response:**
```json
{
  "rank": 42,
  "totalPlayers": 1523,
  "percentile": 97.2,
  "score": 12340,
  "nextRank": {
    "rank": 41,
    "score": 12450,
    "pointsNeeded": 110
  }
}
```

---

## 👥 Social Endpoints

### 1. Get Friends

**GET** `/social/friends`

Get user's friend list.

**Response:**
```json
{
  "friends": [
    {
      "userId": "user456",
      "username": "Alice",
      "avatarUrl": "/avatars/alice.jpg",
      "status": "Online",
      "lastSeen": "2026-02-28T10:30:00Z",
      "gamesPlayed": 87,
      "totalScore": 15420
    }
  ],
  "totalCount": 12
}
```

---

### 2. Send Friend Request

**POST** `/social/friends/request`

Send a friend request.

**Request:**
```json
{
  "userId": "user789"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "req-123",
  "status": "Pending"
}
```

---

### 3. Accept Friend Request

**POST** `/social/friends/accept`

Accept a friend request.

**Request:**
```json
{
  "requestId": "req-123"
}
```

**Response:**
```json
{
  "success": true,
  "friend": {
    "userId": "user789",
    "username": "Bob",
    "avatarUrl": "/avatars/bob.jpg"
  }
}
```

---

### 4. Challenge Friend

**POST** `/social/challenges/send`

Challenge a friend to beat your score.

**Request:**
```json
{
  "friendId": "user456",
  "gameId": "sudoku",
  "difficulty": "Medium",
  "yourScore": 430,
  "message": "Beat this!"
}
```

**Response:**
```json
{
  "success": true,
  "challengeId": "chal-456",
  "expiresAt": "2026-03-01T10:30:00Z"
}
```

---

### 5. Get Challenges

**GET** `/social/challenges?status=Pending`

Get user's challenges.

**Query Parameters:**
- `status`: Pending, Accepted, Completed, Expired

**Response:**
```json
{
  "challenges": [
    {
      "challengeId": "chal-456",
      "fromUser": {
        "userId": "user456",
        "username": "Alice"
      },
      "gameId": "sudoku",
      "difficulty": "Medium",
      "targetScore": 430,
      "message": "Beat this!",
      "status": "Pending",
      "createdAt": "2026-02-28T10:30:00Z",
      "expiresAt": "2026-03-01T10:30:00Z"
    }
  ]
}
```

---

## 📅 Daily Challenge Endpoints

### 1. Get Today's Challenge

**GET** `/challenges/daily?gameId=sudoku`

Get today's daily challenge.

**Response:**
```json
{
  "challengeId": "daily-2026-02-28-sudoku",
  "gameId": "sudoku",
  "difficulty": "Hard",
  "date": "2026-02-28",
  "expiresAt": "2026-02-29T00:00:00Z",
  "participants": 1523,
  "topScore": 480,
  "userCompleted": false,
  "userScore": null,
  "gameState": {
    "board": [[5,3,0,0,7,0,0,0,0], ...]
  }
}
```

---

### 2. Complete Daily Challenge

**POST** `/challenges/daily/{challengeId}/complete`

Submit daily challenge completion.

**Request:**
```json
{
  "completedBoard": [[5,3,4,6,7,8,9,1,2], ...],
  "elapsedTime": 420
}
```

**Response:**
```json
{
  "success": true,
  "score": 480,
  "rank": 23,
  "totalParticipants": 1523,
  "percentile": 98.5,
  "streakDays": 7,
  "bonusPoints": 50
}
```

---

### 3. Get Challenge History

**GET** `/challenges/daily/history?page=1&pageSize=30`

Get user's daily challenge history.

**Response:**
```json
{
  "challenges": [
    {
      "challengeId": "daily-2026-02-28-sudoku",
      "gameId": "sudoku",
      "date": "2026-02-28",
      "completed": true,
      "score": 480,
      "rank": 23,
      "participants": 1523
    }
  ],
  "currentStreak": 7,
  "longestStreak": 15,
  "totalCompleted": 42
}
```

---

## 🎮 Multiplayer Endpoints

### 1. Create Game Room

**POST** `/multiplayer/rooms/create`

Create a multiplayer game room.

**Request:**
```json
{
  "gameId": "tic-tac-toe",
  "isPrivate": false,
  "maxPlayers": 2,
  "settings": {
    "timeLimit": 300,
    "allowSpectators": true
  }
}
```

**Response:**
```json
{
  "roomId": "room-789",
  "gameId": "tic-tac-toe",
  "hostId": "user123",
  "status": "Waiting",
  "players": [
    {
      "userId": "user123",
      "username": "John",
      "isHost": true,
      "isReady": true
    }
  ],
  "maxPlayers": 2,
  "createdAt": "2026-02-28T10:30:00Z"
}
```

---

### 2. Join Game Room

**POST** `/multiplayer/rooms/{roomId}/join`

Join an existing game room.

**Response:**
```json
{
  "success": true,
  "room": {
    "roomId": "room-789",
    "gameId": "tic-tac-toe",
    "players": [
      {
        "userId": "user123",
        "username": "John",
        "isHost": true,
        "isReady": true
      },
      {
        "userId": "user456",
        "username": "Alice",
        "isHost": false,
        "isReady": false
      }
    ],
    "status": "Waiting"
  }
}
```

---

### 3. Get Available Rooms

**GET** `/multiplayer/rooms?gameId=tic-tac-toe&status=Waiting`

Get list of available game rooms.

**Response:**
```json
{
  "rooms": [
    {
      "roomId": "room-789",
      "gameId": "tic-tac-toe",
      "hostUsername": "John",
      "currentPlayers": 1,
      "maxPlayers": 2,
      "status": "Waiting",
      "createdAt": "2026-02-28T10:30:00Z"
    }
  ]
}
```

---

### 4. Make Move

**POST** `/multiplayer/rooms/{roomId}/move`

Make a move in multiplayer game.

**Request:**
```json
{
  "moveData": {
    "row": 0,
    "col": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "moveId": "move-123",
  "isValid": true,
  "gameState": {
    "board": [["X","O",""], ["","",""], ["","",""]],
    "currentTurn": "user123",
    "status": "InProgress"
  },
  "winner": null
}
```

---

## 📊 Statistics Endpoints

### 1. Get User Stats

**GET** `/stats/user`

Get comprehensive user statistics.

**Response:**
```json
{
  "overall": {
    "totalGames": 127,
    "totalTime": 55920,
    "totalScore": 12340,
    "achievements": 23,
    "rank": 42
  },
  "byGame": [
    {
      "gameId": "sudoku",
      "gameName": "Sudoku",
      "gamesPlayed": 45,
      "gamesCompleted": 42,
      "completionRate": 93.3,
      "averageScore": 380,
      "bestScore": 490,
      "totalTime": 18900,
      "averageTime": 420
    }
  ],
  "recentActivity": [
    {
      "date": "2026-02-28",
      "gamesPlayed": 5,
      "score": 2150
    }
  ],
  "streaks": {
    "current": 7,
    "longest": 15
  }
}
```

---

### 2. Get Game Stats

**GET** `/stats/games/{gameId}`

Get statistics for a specific game.

**Response:**
```json
{
  "gameId": "sudoku",
  "gameName": "Sudoku",
  "totalPlayers": 1523,
  "totalGames": 45678,
  "averageScore": 320,
  "highestScore": 500,
  "averageTime": 480,
  "fastestTime": 180,
  "difficultyDistribution": {
    "Easy": 45,
    "Medium": 35,
    "Hard": 20
  },
  "popularityRank": 1
}
```

---

## 🔔 Notification Events

These events trigger real-time notifications via SignalR:

### Game Events
- `GameCompleted` - Game finished
- `AchievementUnlocked` - New achievement
- `PersonalBestBeaten` - New personal record
- `RankChanged` - Leaderboard rank changed

### Social Events
- `FriendRequestReceived` - New friend request
- `FriendRequestAccepted` - Friend request accepted
- `ChallengeReceived` - Friend challenge received
- `ChallengeCompleted` - Challenge result

### Daily Events
- `DailyChallengeAvailable` - New daily challenge
- `DailyChallengeExpiring` - Challenge expiring soon
- `StreakMilestone` - Streak milestone reached

---

## 🔒 Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer {userId}
```

The userId is obtained from the existing login system.

---

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "The requested game does not exist",
    "details": {
      "gameId": "invalid-game"
    }
  }
}
```

### Common Error Codes
- `GAME_NOT_FOUND` - Game doesn't exist
- `SESSION_NOT_FOUND` - Game session doesn't exist
- `INVALID_MOVE` - Move is not valid
- `GAME_ALREADY_COMPLETED` - Session already finished
- `NO_HINTS_REMAINING` - No hints left
- `ROOM_FULL` - Multiplayer room is full
- `NOT_YOUR_TURN` - Not player's turn in multiplayer
- `UNAUTHORIZED` - Authentication required

---

## 📈 Rate Limits

- **Game endpoints:** 100 requests per minute
- **Leaderboard endpoints:** 30 requests per minute
- **Social endpoints:** 50 requests per minute
- **Multiplayer moves:** 10 requests per second

---

## 🧪 Testing Endpoints

Use Swagger UI for testing: `http://localhost:5000/swagger`

---

**API Version:** v1
**Last Updated:** 2026-02-28

