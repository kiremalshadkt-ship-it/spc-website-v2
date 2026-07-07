class Repository {
  constructor(data) {
    this.data = data;
  }

  getSaga(id) {
    return this.data.sagas.find((saga) => saga.id === id);
  }

  getStory(id) {
    return this.data.stories.find((story) => story.id === id);
  }

  getStoryByOrder(order) {
    return this.data.stories.find((story) => story.order === order);
  }

  getCharacter(id) {
    return this.data.characters.find((character) => character.id === id);
  }

  getAudiobook(id) {
    return this.data.audiobooks.find((audiobook) => audiobook.id === id);
  }

  storiesForSaga(sagaId) {
    return this.data.stories
      .filter((story) => story.sagaId === sagaId)
      .sort((a, b) => a.order - b.order);
  }

  storiesForCharacter(characterId) {
    return this.data.stories.filter((story) => story.characters.includes(characterId));
  }

  search(query) {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    const fromStories = this.data.stories.map((item) => ({ type: "Story", item }));
    const fromCharacters = this.data.characters.map((item) => ({ type: "Character", item }));
    const fromAudio = this.data.audiobooks.map((item) => ({ type: "Audiobook", item }));
    const fromSagas = this.data.sagas.map((item) => ({ type: "Saga", item }));

    return [...fromStories, ...fromCharacters, ...fromAudio, ...fromSagas]
      .filter(({ item }) => {
        const haystack = [
          item.title,
          item.shortTitle,
          item.name,
          item.status,
          item.description,
          item.synopsis,
          item.affiliation,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(value);
      })
      .slice(0, 8);
  }
}

class Router {
  constructor(repository) {
    this.repository = repository;
    this.params = new URLSearchParams(window.location.search);
  }

  hrefFor(type, id) {
    const routes = {
      Story: `story.html?id=${id}`,
      Character: `character.html?id=${id}`,
      Audiobook: "audiobooks.html",
      Saga: "stories.html",
    };
    return routes[type] || "index.html";
  }

  currentId() {
    return this.params.get("id");
  }
}

class Component {
  static escape(text = "") {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  static badge(label) {
    return `<span class="badge">${this.escape(label)}</span>`;
  }

  static image(src, alt, className = "") {
    return `<img class="${className}" src="${src}" alt="${this.escape(alt)}" loading="lazy">`;
  }
}

class Navigation {
  constructor(repository) {
    this.repository = repository;
    this.header = document.querySelector("[data-header]");
  }

  render() {
    if (!this.header) return;
    const currentFile = window.location.pathname.split("/").pop() || "index.html";
    const links = this.repository.data.navigation
      .map((link) => {
        const active = link.href === currentFile ? "is-active" : "";
        return `<a class="${active}" href="${link.href}">${link.label}</a>`;
      })
      .join("");

    this.header.innerHTML = `
      <a class="brand" href="index.html" aria-label="Sound Puppet Comics home">
        <img src="assets/images/spc-logo.png" alt="SPC logo">
        <span>Sound Puppet Comics</span>
      </a>
      <button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <nav class="site-nav" aria-label="Primary navigation">
        ${links}
      </nav>
      <button class="search-toggle" type="button" aria-label="Search SPC">Search</button>
    `;

    const menuButton = this.header.querySelector(".menu-toggle");
    const nav = this.header.querySelector(".site-nav");
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(open));
    });
  }
}

class SearchEngine {
  constructor(repository, router) {
    this.repository = repository;
    this.router = router;
    this.dialog = document.querySelector("[data-search]");
  }

  render() {
    if (!this.dialog) return;
    this.dialog.innerHTML = `
      <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search Sound Puppet Comics">
        <button class="search-close" type="button" aria-label="Close search">Close</button>
        <label for="global-search">Search the universe</label>
        <input id="global-search" type="search" autocomplete="off" placeholder="Search stories, characters, audiobooks">
        <div class="search-results" aria-live="polite"></div>
      </div>
    `;

    const openButtons = document.querySelectorAll(".search-toggle");
    const closeButton = this.dialog.querySelector(".search-close");
    const input = this.dialog.querySelector("input");
    const results = this.dialog.querySelector(".search-results");

    openButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.dialog.classList.add("is-open");
        input.focus();
      });
    });

    closeButton.addEventListener("click", () => this.dialog.classList.remove("is-open"));
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) this.dialog.classList.remove("is-open");
    });

    input.addEventListener("input", () => {
      const matches = this.repository.search(input.value);
      results.innerHTML = matches.length
        ? matches.map((match) => this.resultTemplate(match)).join("")
        : `<p class="muted">Start typing to find SPC stories, characters, and audiobooks.</p>`;
    });
  }

  resultTemplate(match) {
    const title = match.item.title || match.item.name;
    const id = match.item.id;
    return `
      <a class="search-result" href="${this.router.hrefFor(match.type, id)}">
        <span>${match.type}</span>
        <strong>${Component.escape(title)}</strong>
        <small>${Component.escape(match.item.status || match.item.affiliation || "")}</small>
      </a>
    `;
  }
}

class StoryCard extends Component {
  static render(story) {
    return `
      <article class="card story-card">
        ${Component.image(story.cover, story.title)}
        <div class="card-body">
          <div class="meta-line">
            ${Component.badge(story.status)}
            <span>${story.issues.length} issue${story.issues.length === 1 ? "" : "s"}</span>
          </div>
          <h3>${Component.escape(story.title)}</h3>
          <p>${Component.escape(story.description)}</p>
          <a class="button button-secondary" href="story.html?id=${story.id}">Explore Story</a>
        </div>
      </article>
    `;
  }
}

class CharacterCard extends Component {
  static render(character) {
    return `
      <article class="card character-card">
        ${Component.image(character.portrait, character.name)}
        <div class="card-body">
          <div class="meta-line">
            ${Component.badge(character.role)}
            <span>${Component.escape(character.affiliation)}</span>
          </div>
          <h3>${Component.escape(character.name)}</h3>
          <p>${Component.escape(character.biography)}</p>
          <a class="button button-secondary" href="character.html?id=${character.id}">Explore Profile</a>
        </div>
      </article>
    `;
  }
}

class AudioPlayer {
  constructor(container) {
    this.container = container;
  }

  render(source, label) {
    const audioUrl = source.cloudinaryUrl || source.audioUrl;
    if (!audioUrl) {
      return `<span class="chapter-state">Cloudinary link pending</span>`;
    }

    const id = `audio-${source.id || label}`.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
    return `
      <div class="audio-player">
        <button type="button" data-play="${id}">Play</button>
        <audio id="${id}" src="${audioUrl}" preload="metadata"></audio>
        <input type="range" min="0" value="0" step="1" data-seek="${id}" aria-label="Seek ${Component.escape(label)}">
        <span data-time="${id}">0:00</span>
      </div>
    `;
  }

  bind() {
    document.querySelectorAll("[data-play]").forEach((button) => {
      const audio = document.getElementById(button.dataset.play);
      const seek = document.querySelector(`[data-seek="${button.dataset.play}"]`);
      const time = document.querySelector(`[data-time="${button.dataset.play}"]`);
      if (!audio || !seek || !time) return;

      button.addEventListener("click", () => {
        if (audio.paused) {
          audio.play();
          button.textContent = "Pause";
        } else {
          audio.pause();
          button.textContent = "Play";
        }
      });

      audio.addEventListener("loadedmetadata", () => {
        seek.max = Math.floor(audio.duration || 0);
      });

      audio.addEventListener("timeupdate", () => {
        seek.value = Math.floor(audio.currentTime);
        time.textContent = this.formatTime(audio.currentTime);
      });

      seek.addEventListener("input", () => {
        audio.currentTime = Number(seek.value);
      });
    });
  }

  formatTime(value) {
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }
}

class PageRenderer {
  constructor(repository, router) {
    this.repository = repository;
    this.router = router;
    this.root = document.querySelector("[data-page]");
  }

  render() {
    if (!this.root) return;
    const page = this.root.dataset.page;
    const methods = {
      home: () => this.home(),
      stories: () => this.stories(),
      story: () => this.story(),
      audiobooks: () => this.audiobooks(),
      characters: () => this.characters(),
      character: () => this.character(),
      about: () => this.about(),
      login: () => this.login(),
      notFound: () => this.notFound(),
    };

    (methods[page] || methods.notFound)();
  }

  home() {
    const saga = this.repository.data.sagas[0];
    const featuredStories = this.repository.storiesForSaga(saga.id).slice(0, 3);
    const latest = this.repository.data.stories.flatMap((story) =>
      story.issues.map((issue) => ({ story, issue }))
    ).slice(0, 3);
    const characters = this.repository.data.characters.slice(0, 4);
    const audiobook = this.repository.data.audiobooks[0];

    this.root.innerHTML = `
      <section class="hero hero-home" style="--hero-image: url('${saga.cover}')">
        <video class="hero-video" src="assets/video/spc-intro.mp4" autoplay muted loop playsinline></video>
        <div class="hero-content">
          <p class="eyebrow">Official SPCU headquarters</p>
          <h1>${Component.escape(this.repository.data.universe.name)}</h1>
          <p>${Component.escape(this.repository.data.universe.description)}</p>
          <div class="button-row">
            <a class="button button-primary" href="stories.html">Explore Stories</a>
            <a class="button button-secondary" href="audiobooks.html">Listen to Audiobooks</a>
          </div>
        </div>
      </section>

      <section class="section split-section">
        <div>
          <p class="eyebrow">Current featured saga</p>
          <h2>${Component.escape(saga.title)}</h2>
          <p>${Component.escape(saga.description)}</p>
          <div class="progress" aria-label="${saga.progress}% progress">
            <span style="width: ${saga.progress}%"></span>
          </div>
          <a class="button button-secondary" href="stories.html">Explore Saga</a>
        </div>
        <img src="${saga.cover}" alt="${saga.title}" loading="lazy">
      </section>

      <section class="section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Story-first universe</p>
            <h2>Featured Stories</h2>
          </div>
          <a href="stories.html">View all stories</a>
        </div>
        <div class="grid three">${featuredStories.map(StoryCard.render).join("")}</div>
      </section>

      <section class="section band">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Latest releases</p>
            <h2>Continue the Reading Order</h2>
          </div>
        </div>
        <div class="timeline">
          ${latest.map(({ story, issue }) => `
            <a class="timeline-item" href="story.html?id=${story.id}">
              <span>${String(issue.number).padStart(2, "0")}</span>
              <strong>${Component.escape(story.title)}: ${Component.escape(issue.title)}</strong>
              <small>${Component.escape(issue.status)}</small>
            </a>
          `).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Featured characters</p>
            <h2>Meet the Forces Shaping the Saga</h2>
          </div>
          <a href="characters.html">View all characters</a>
        </div>
        <div class="grid four">${characters.map(CharacterCard.render).join("")}</div>
      </section>

      <section class="section split-section reverse">
        <div>
          <p class="eyebrow">Featured audiobook</p>
          <h2>${Component.escape(audiobook.title)}</h2>
          <p>${Component.escape(audiobook.description)}</p>
          <a class="button button-primary" href="audiobooks.html">Listen Now</a>
        </div>
        <img src="${audiobook.cover}" alt="${audiobook.title}" loading="lazy">
      </section>
    `;
  }

  stories() {
    const saga = this.repository.data.sagas[0];
    const stories = this.repository.storiesForSaga(saga.id);
    const placeholders = this.repository.data.placeholders.sort((a, b) => a.order - b.order);

    this.root.innerHTML = `
      ${this.pageHero("Stories", "Explore the official reading order by saga, arc, and story.", saga.cover)}
      <section class="section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${Component.escape(saga.status)}</p>
            <h2>${Component.escape(saga.title)}</h2>
          </div>
          <span>${stories.length + placeholders.length} planned stories</span>
        </div>
        <div class="grid three">${stories.map(StoryCard.render).join("")}</div>
      </section>
      <section class="section band">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Future releases</p>
            <h2>Reading Order Roadmap</h2>
          </div>
        </div>
        <div class="timeline">
          ${[...stories, ...placeholders].sort((a, b) => a.order - b.order).map((item) => `
            <div class="timeline-item">
              <span>${String(item.order).padStart(2, "0")}</span>
              <strong>${Component.escape(item.title)}</strong>
              <small>${Component.escape(item.status)}</small>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  story() {
    const story = this.repository.getStory(this.router.currentId()) || this.repository.data.stories[0];
    const previous = this.repository.getStoryByOrder(story.order - 1);
    const next = this.repository.getStoryByOrder(story.order + 1);
    const characters = story.characters.map((id) => this.repository.getCharacter(id)).filter(Boolean);
    const companions = story.companionAudiobooks.map((id) => this.repository.getAudiobook(id)).filter(Boolean);
    const related = story.relatedStories.map((id) => this.repository.getStory(id)).filter(Boolean);

    this.root.innerHTML = `
      <section class="story-hero" style="--hero-image: url('${story.hero}')">
        <img src="${story.cover}" alt="${story.title}">
        <div>
          <p class="eyebrow">Reading order ${story.order} | ${Component.escape(story.arc)}</p>
          <h1>${Component.escape(story.title)}</h1>
          <div class="meta-line">${Component.badge(story.status)}<span>${story.issues.length} issue${story.issues.length === 1 ? "" : "s"}</span></div>
          <p>${Component.escape(story.synopsis)}</p>
        </div>
      </section>

      <section class="section">
        <div class="section-heading"><div><p class="eyebrow">Issue list</p><h2>Experience the Story</h2></div></div>
        <div class="grid three">
          ${story.issues.map((issue) => `
            <article class="card">
              ${Component.image(issue.thumbnail, issue.title)}
              <div class="card-body">
                <div class="meta-line">${Component.badge(issue.status)}<span>${Component.escape(issue.releaseDate)}</span></div>
                <h3>Issue ${issue.number}: ${Component.escape(issue.title)}</h3>
                <p>${Component.escape(issue.description)}</p>
                ${issue.videoUrl ? `<a class="button button-primary" href="${issue.videoUrl}" target="_blank" rel="noreferrer">Watch Issue</a>` : `<span class="button button-disabled">Coming Soon</span>`}
              </div>
            </article>
          `).join("")}
        </div>
      </section>

      ${companions.length ? `
        <section class="section band">
          <div class="section-heading"><div><p class="eyebrow">Companion content</p><h2>Related Audiobooks</h2></div></div>
          <div class="grid three">${companions.map((book) => this.audiobookCard(book)).join("")}</div>
        </section>
      ` : ""}

      <section class="section">
        <div class="section-heading"><div><p class="eyebrow">Connected cast</p><h2>Related Characters</h2></div></div>
        <div class="grid four">${characters.map(CharacterCard.render).join("")}</div>
      </section>

      <section class="section band">
        <div class="section-heading"><div><p class="eyebrow">Keep exploring</p><h2>Continue Reading</h2></div></div>
        <div class="next-grid">
          ${previous ? `<a class="next-link" href="story.html?id=${previous.id}"><span>Previous Story</span><strong>${Component.escape(previous.title)}</strong></a>` : ""}
          ${next ? `<a class="next-link" href="story.html?id=${next.id}"><span>Next Story</span><strong>${Component.escape(next.title)}</strong></a>` : ""}
          ${related.map((item) => `<a class="next-link" href="story.html?id=${item.id}"><span>Related Story</span><strong>${Component.escape(item.title)}</strong></a>`).join("")}
        </div>
      </section>
    `;
  }

  audiobooks() {
    this.root.innerHTML = `
      ${this.pageHero("Audiobooks", "Companion stories that expand the SPCU without replacing the main reading order.", "assets/images/black-sun-origins.png")}
      <section class="section">
        <div class="audiobook-stack">${this.repository.data.audiobooks.map((book) => this.audiobookCard(book, true)).join("")}</div>
      </section>
    `;
    new AudioPlayer(this.root).bind();
  }

  audiobookCard(book, includePlayer = false) {
    const related = book.relatedStories
      .map((id) => this.repository.getStory(id))
      .filter(Boolean)
      .map((story) => story.title)
      .join(", ");
    const chapters = book.chapters || [];
    return `
      <article class="card audiobook-card">
        <div class="audiobook-cover">
          ${Component.image(book.cover, book.title)}
        </div>
        <div class="card-body audiobook-body">
          <div>
            <div class="meta-line">${Component.badge(book.status)}<span>${Component.escape(book.duration)}</span></div>
            <h3>${Component.escape(book.title)}</h3>
            <p>${Component.escape(book.description)}</p>
            <p class="muted">Related: ${Component.escape(related || "Future story")}</p>
          </div>
          ${includePlayer ? this.chapterList(book, chapters) : `<a class="button button-secondary" href="audiobooks.html">View Chapters</a>`}
        </div>
      </article>
    `;
  }

  chapterList(book, chapters) {
    if (!chapters.length) {
      return `<div class="chapter-list empty-state">Chapter layout is ready. Add Cloudinary links in <code>js/data.js</code> when uploads are available.</div>`;
    }

    return `
      <div class="chapter-list" aria-label="${Component.escape(book.title)} chapters">
        <div class="chapter-list-header">
          <strong>Chapters</strong>
          <span>${chapters.length} planned</span>
        </div>
        ${chapters.map((chapter) => {
          const label = `${book.title} chapter ${chapter.number}: ${chapter.title}`;
          return `
            <section class="chapter-row">
              <div class="chapter-number">${String(chapter.number).padStart(2, "0")}</div>
              <div class="chapter-copy">
                <div class="meta-line">${Component.badge(chapter.status)}<span>${Component.escape(chapter.duration)}</span></div>
                <h4>${Component.escape(chapter.title)}</h4>
                <p>${Component.escape(chapter.description)}</p>
              </div>
              <div class="chapter-action">
                ${new AudioPlayer().render(chapter, label)}
              </div>
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  characters() {
    const groups = ["Hero", "Villain", "Neutral"].map((role) => ({
      role,
      items: this.repository.data.characters.filter((character) => character.role === role),
    }));

    this.root.innerHTML = `
      ${this.pageHero("Characters", "Profiles for the heroes, villains, and uncertain powers of the SPCU.", "assets/images/paragons.png")}
      ${groups.map((group) => `
        <section class="section">
          <div class="section-heading"><div><p class="eyebrow">${group.role}</p><h2>${group.role} Profiles</h2></div></div>
          <div class="grid four">${group.items.map(CharacterCard.render).join("")}</div>
        </section>
      `).join("")}
    `;
  }

  character() {
    const character = this.repository.getCharacter(this.router.currentId()) || this.repository.data.characters[0];
    const stories = character.stories.map((id) => this.repository.getStory(id)).filter(Boolean);
    const related = character.relatedCharacters.map((id) => this.repository.getCharacter(id)).filter(Boolean);

    this.root.innerHTML = `
      <section class="story-hero character-profile">
        <img src="${character.portrait}" alt="${character.name}">
        <div>
          <p class="eyebrow">${Component.escape(character.affiliation)}</p>
          <h1>${Component.escape(character.name)}</h1>
          <div class="meta-line">${Component.badge(character.role)}<span>${Component.escape(character.status)}</span></div>
          <p>${Component.escape(character.biography)}</p>
        </div>
      </section>
      <section class="section profile-grid">
        <div>
          <h2>Profile</h2>
          <dl class="facts">
            <dt>Species</dt><dd>${Component.escape(character.species)}</dd>
            <dt>Aliases</dt><dd>${Component.escape(character.aliases.join(", "))}</dd>
            <dt>First Appearance</dt><dd>${Component.escape(character.firstAppearance)}</dd>
          </dl>
        </div>
        <div>
          <h2>Abilities</h2>
          <ul class="tag-list">${character.abilities.map((ability) => `<li>${Component.escape(ability)}</li>`).join("")}</ul>
        </div>
      </section>
      <section class="section band">
        <div class="section-heading"><div><p class="eyebrow">Appearances</p><h2>Stories</h2></div></div>
        <div class="grid three">${stories.map(StoryCard.render).join("")}</div>
      </section>
      <section class="section">
        <div class="section-heading"><div><p class="eyebrow">Connections</p><h2>Related Characters</h2></div></div>
        <div class="grid four">${related.map(CharacterCard.render).join("")}</div>
      </section>
    `;
  }

  about() {
    this.root.innerHTML = `
      ${this.pageHero("About SPC", "The mission, team, and long-term direction behind Sound Puppet Comics.", "assets/images/spc-logo.png")}
      <section class="section split-section">
        <div>
          <p class="eyebrow">Who we are</p>
          <h2>Stories First, Media Everywhere</h2>
          <p>Sound Puppet Comics builds interconnected fiction for comic readers, superhero fans, fantasy audiences, science fiction fans, animation viewers, and audiobook listeners.</p>
          <p>The platform is designed around stories, not one media format. Videos, audiobooks, digital comics, animation, and future formats all attach to the same story architecture.</p>
        </div>
        <div class="value-list">
          <strong>Mission</strong><span>Create immersive worlds where sound and imagination collide.</span>
          <strong>Vision</strong><span>Grow the SPCU into a professional entertainment universe with years of expandable canon.</span>
          <strong>Future Goals</strong><span>Accounts, timelines, news, community features, backend publishing, and premium content.</span>
        </div>
      </section>
      <section class="section band">
        <div class="section-heading"><div><p class="eyebrow">Team</p><h2>Creators and Contributors</h2></div></div>
        <div class="grid three">
          ${this.repository.data.team.map((member) => `
            <article class="card team-card">
              ${Component.image(member.image, member.name)}
              <div class="card-body"><h3>${Component.escape(member.name)}</h3><p>${Component.escape(member.title)}</p></div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  login() {
    this.root.innerHTML = `
      ${this.pageHero("Login", "Accounts are being prepared for future reader features. Guests can still explore everything.", "assets/images/spc-logo.png")}
      <section class="section login-layout">
        <form class="login-form">
          <label>Email<input type="email" placeholder="reader@example.com"></label>
          <label>Password<input type="password" placeholder="Password"></label>
          <button class="button button-primary" type="button">Preview Account Features</button>
          <p class="muted">Future accounts will unlock favourites, bookmarks, reading history, comments, and notifications.</p>
        </form>
        <div class="value-list">
          <strong>Guest Access</strong><span>Browse stories, watch issues, explore characters, and listen to public audiobooks.</span>
          <strong>Future Login</strong><span>Email login first, with Google, Discord, and GitHub ready to add later.</span>
          <strong>Prepared Roles</strong><span>Guest, registered user, moderator, administrator, and future contributor.</span>
        </div>
      </section>
    `;
  }

  notFound() {
    this.root.innerHTML = `
      ${this.pageHero("Page Not Found", "This path is outside the current SPCU map.", "assets/images/order-of-the-abyss.png")}
      <section class="section"><a class="button button-primary" href="index.html">Return Home</a></section>
    `;
  }

  pageHero(title, description, image) {
    return `
      <section class="page-hero" style="--hero-image: url('${image}')">
        <div>
          <p class="eyebrow">Sound Puppet Comics</p>
          <h1>${Component.escape(title)}</h1>
          <p>${Component.escape(description)}</p>
        </div>
      </section>
    `;
  }
}

class Motion {
  constructor() {
    this.items = document.querySelectorAll(".section, .card, .timeline-item");
  }

  bind() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    this.items.forEach((item) => {
      item.classList.add("reveal");
      observer.observe(item);
    });
  }
}

class BackToTop {
  render() {
    const button = document.createElement("button");
    button.className = "back-to-top";
    button.type = "button";
    button.textContent = "Top";
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(button);
    window.addEventListener("scroll", () => {
      button.classList.toggle("is-visible", window.scrollY > 700);
    });
  }
}

class App {
  constructor(data) {
    this.repository = new Repository(data);
    this.router = new Router(this.repository);
  }

  start() {
    new Navigation(this.repository).render();
    new SearchEngine(this.repository, this.router).render();
    new PageRenderer(this.repository, this.router).render();
    new Motion().bind();
    new BackToTop().render();
    this.renderFooter();
  }

  renderFooter() {
    const footer = document.querySelector("[data-footer]");
    if (!footer) return;
    const year = new Date().getFullYear();
    footer.innerHTML = `
      <div>
        <img src="assets/images/spc-logo.png" alt="SPC logo">
        <p>${Component.escape(this.repository.data.universe.tagline)}</p>
      </div>
      <nav aria-label="Footer navigation">
        ${this.repository.data.navigation.map((link) => `<a href="${link.href}">${link.label}</a>`).join("")}
      </nav>
      <p class="muted">Version ${this.repository.data.version} | Copyright ${year} Sound Puppet Comics</p>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new App(SPC_DATA).start();
});
