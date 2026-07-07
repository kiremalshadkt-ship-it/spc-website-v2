# Sound Puppet Comics Website V2

Version 2 of the Sound Puppet Comics website is a static, story-first foundation for the Sound Puppet Comics Universe.

The site is built for GitHub Pages today and for a future Java Spring Boot, Supabase, Cloudinary, and YouTube-backed platform later.

## Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Object-oriented JavaScript architecture
- Static hosting compatible with GitHub Pages
- Future backend target: Java Spring Boot
- Future database target: Supabase PostgreSQL
- Future media hosting: Cloudinary for audio, YouTube for videos

## Folder Structure

```text
.
├── assets/
│   ├── audio/
│   ├── images/
│   └── video/
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── data.js
├── index.html
├── stories.html
├── story.html
├── audiobooks.html
├── characters.html
├── character.html
├── about.html
├── login.html
└── 404.html
```

## Architecture

The site treats stories as the primary entity.

The current hierarchy is:

```text
Universe
└── Saga
    └── Story
        └── Issue
            └── Media
```

All primary content lives in `js/data.js`. Pages are rendered by reusable classes in `js/app.js`, including:

- `Repository`
- `Router`
- `Navigation`
- `SearchEngine`
- `PageRenderer`
- `StoryCard`
- `CharacterCard`
- `AudioPlayer`

This keeps content separate from presentation and makes it easier to replace local data with API responses later.

## How To Run

This project can be opened directly from `index.html`, or served locally:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## Pages

- Home
- Stories
- Story detail template
- Audiobooks
- Characters
- Character profile template
- About
- Login placeholder
- 404

## Future Backend Plan

The frontend is currently powered by `js/data.js`. A future Java Spring Boot backend can expose stable REST endpoints such as:

- `/api/universe`
- `/api/sagas`
- `/api/stories`
- `/api/stories/{id}`
- `/api/issues`
- `/api/characters`
- `/api/characters/{id}`
- `/api/audiobooks`
- `/api/search`
- `/api/users`
- `/api/comments`

The frontend should then swap `Repository` from local data reads to API fetches while keeping the page rendering classes intact.

## Future Database Plan

Supabase PostgreSQL can store normalized tables for:

- Universe
- Saga
- Story
- Issue
- Character
- Audiobook
- Media
- User
- Comment
- Favourite
- TeamMember
- Announcement
- Release

Many-to-many tables should connect stories to characters, stories to audiobooks, users to favourites, and comments to parent entities.

## Media Integration

Issue video buttons are prepared for YouTube URLs. Audiobooks are structured as chapter lists, and each chapter has a `cloudinaryUrl` field in `js/data.js`. Add future Cloudinary audio links there as each chapter is uploaded. Current local audio is only a placeholder so the player behavior has a working source.

## Future Roadmap

- Java Spring Boot backend
- Supabase integration
- Cloudinary audiobook hosting
- YouTube issue embeds
- User accounts
- Admin dashboard
- News and announcements
- Release calendar
- Timeline
- Community features
- Comments
- Favourites and bookmarks
- Improved search with backend indexing
- Premium content support

## Deployment

For GitHub Pages, deploy the repository root. No build step is required.
