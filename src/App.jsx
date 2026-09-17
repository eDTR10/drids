import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  List,
  Maximize2,
  Menu,
  Moon,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Tag,
  Trash2,
  Upload,
  Users,
  Wifi,
  X,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  CARD_HEIGHT_MAX,
  CARD_HEIGHT_MIN,
  CARD_WIDTH_MAX,
  CARD_WIDTH_MIN,
  CATEGORY_MAX_LENGTH,
  THEMES,
  ICONS,
  STORAGE_KEY,
  defaultWorkspace,
  isHexColor,
  isWebUrl,
  readWorkspace,
  validateWorkspace,
} from "./data";

const iconMap = {
  building: Building2,
  globe: Globe2,
  wifi: Wifi,
  graduation: GraduationCap,
  shield: ShieldCheck,
  files: FileText,
  chart: ChartNoAxesCombined,
  users: Users,
  database: Database,
  briefcase: BriefcaseBusiness,
};
// Keep stored palette IDs compatible with existing workspace backups.
const themeLabels = {
  mint: "navy",
  blue: "blue",
  peach: "gold",
  lilac: "silver",
  sand: "sand",
  rose: "red",
};
function parseHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const page = ["favorites", "recent"].includes(params.get("page"))
    ? params.get("page")
    : "all";
  const category = params.get("category") || "All categories";
  return { page, category };
}
function buildHash(page, category) {
  const params = new URLSearchParams();
  if (page !== "all") params.set("page", page);
  if (category !== "All categories") params.set("category", category);
  const qs = params.toString();
  return qs ? `#${qs}` : "#";
}
function themeClass(theme) {
  return THEMES.includes(theme) ? `theme-${theme}` : "";
}
function themeVars(theme) {
  if (THEMES.includes(theme)) return undefined;
  return {
    "--ink": theme,
    "--cover": `color-mix(in srgb, ${theme}, white 88%)`,
    "--chip": `color-mix(in srgb, ${theme}, white 94%)`,
    "--chip-back": `color-mix(in srgb, ${theme}, white 45%)`,
    "--line": `color-mix(in srgb, ${theme}, white 28%)`,
  };
}
const emptySystem = {
  title: "",
  description: "",
  url: "",
  category: "",
  icon: "globe",
  theme: "mint",
  cover: "",
  favorite: false,
};
function SystemIcon({ name, ...props }) {
  const Icon = iconMap[name] || Globe2;
  return <Icon {...props} />;
}
function Brand({ small = false }) {
  return (
    <div className={`brand ${small ? "small" : ""}`}>
      <img
        className="brand-logo"
        src={`${import.meta.env.BASE_URL}dict-logo.png`}
        alt="DICT seal"
        width="44"
        height="44"
      />
      <div>
        <strong>DRIDS</strong>
        <small>DICT REGION 10</small>
      </div>
    </div>
  );
}

function Cover({ system }) {
  return (
    <div
      className={`system-cover ${themeClass(system.theme)}`}
      style={themeVars(system.theme)}
      aria-hidden="true"
    >
      <div className="cover-grid" />
      <div className="cover-orbit orbit-one" />
      <div className="cover-orbit orbit-two" />
      <div className="cover-chip chip-back" />
      <div className="cover-chip chip-front">
        <SystemIcon name={system.icon} strokeWidth={1.25} />
      </div>
      <span className="cover-dot dot-one" />
      <span className="cover-dot dot-two" />
      <span className="cover-plus">+</span>
      {system.cover && (
        <img
          key={system.cover}
          src={system.cover}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-heading">
        <div>
          <h2 id="modal-title">{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function CategoryField({ value, onChange, categories }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const trimmed = value.trim();
  const q = trimmed.toLowerCase();
  const matches = categories.filter((c) => c.toLowerCase().includes(q));
  const showAdd = trimmed && !categories.some((c) => c.toLowerCase() === q);
  return (
    <div className="category-field" ref={wrapRef}>
      <input
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        maxLength={CATEGORY_MAX_LENGTH}
        placeholder="e.g. Administration"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (matches.length > 0 || showAdd) && (
        <ul className="category-suggestions" role="listbox">
          {matches.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
              >
                {c}
              </button>
            </li>
          ))}
          {showAdd && (
            <li>
              <button
                type="button"
                className="add-category"
                onClick={() => {
                  onChange(trimmed);
                  setOpen(false);
                }}
              >
                <Plus size={14} /> Add “{trimmed}”…
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
function SystemForm({ system, onSave, onClose, onDelete, categories }) {
  const [form, setForm] = useState(system || emptySystem);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give your system a title.");
      return;
    }
    if (
      !isWebUrl(form.url.trim()) ||
      (form.cover.trim() && !isWebUrl(form.cover.trim()))
    ) {
      setError(
        "Use a complete http:// or https:// address for the website and cover.",
      );
      return;
    }
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      category: form.category.trim(),
      cover: form.cover.trim(),
      id: form.id || crypto.randomUUID(),
    });
  };
  return (
    <Modal
      title={system ? "Edit system" : "Add a system"}
      subtitle="Give your next destination a place in your workspace."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="system-form">
        <div className="form-preview">
          <Cover system={form} />
          <div className="preview-caption">
            <SystemIcon name={form.icon} size={18} />
            <strong>{form.title || "Your system, your way"}</strong>
            <span>Card preview</span>
          </div>
        </div>
        <label>
          System title
          <input
            autoFocus
            required
            maxLength={80}
            placeholder="e.g. Document Management System"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>
        <label>
          Website URL
          <input
            required
            type="url"
            placeholder="https://your-system.gov.ph"
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            rows={2}
            maxLength={240}
            placeholder="A short description of what this system does…"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <label>
          Category <span className="optional">Optional</span>
          <CategoryField
            value={form.category}
            onChange={(value) => update("category", value)}
            categories={categories}
          />
        </label>
        <fieldset>
          <legend>System icon</legend>
          <div className="icon-picker">
            {ICONS.map((name) => (
              <button
                type="button"
                key={name}
                className={form.icon === name ? "selected" : ""}
                onClick={() => update("icon", name)}
                aria-label={`${name} icon`}
                aria-pressed={form.icon === name}
              >
                <SystemIcon name={name} size={21} />
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Cover color</legend>
          <div className="color-picker">
            {THEMES.map((theme) => (
              <button
                type="button"
                key={theme}
                className={`theme-${theme} ${form.theme === theme ? "selected" : ""}`}
                onClick={() => update("theme", theme)}
                aria-label={`${themeLabels[theme]} cover`}
                title={`${themeLabels[theme]} cover`}
                aria-pressed={form.theme === theme}
              >
                {form.theme === theme && <Check size={18} />}
              </button>
            ))}
            <label
              className={`color-picker-custom ${isHexColor(form.theme) ? "selected" : ""}`}
              style={isHexColor(form.theme) ? { background: form.theme } : undefined}
              title="Custom cover color"
            >
              <input
                type="color"
                aria-label="Custom cover color"
                value={isHexColor(form.theme) ? form.theme : "#5c7294"}
                onChange={(e) => update("theme", e.target.value)}
              />
              {isHexColor(form.theme) ? <Check size={18} /> : <Plus size={16} />}
            </label>
          </div>
        </fieldset>
        <label>
          Custom cover image <span className="optional">Optional</span>
          <input
            type="url"
            placeholder="https://example.com/cover.jpg"
            value={form.cover}
            onChange={(e) => update("cover", e.target.value)}
          />
          <small>
            Use a direct image URL. The illustrated cover is used if the image
            cannot load.
          </small>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {deleting ? (
          <div className="delete-confirm">
            <p>Remove “{system.title}” from this dashboard?</p>
            <button
              type="button"
              className="button danger"
              onClick={() => onDelete(system.id)}
            >
              Yes, remove
            </button>
            <button
              type="button"
              className="button"
              onClick={() => setDeleting(false)}
            >
              Keep system
            </button>
          </div>
        ) : (
          <div className="modal-actions">
            {system && (
              <button
                type="button"
                className="text-button danger-text"
                onClick={() => setDeleting(true)}
              >
                <Trash2 size={16} /> Remove
              </button>
            )}
            <div className="action-spacer" />
            <button type="button" className="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button primary" type="submit">
              <Check size={16} />
              {system ? "Save changes" : "Add system"}
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default function App() {
  const [initial] = useState(readWorkspace);
  const [workspace, setWorkspace] = useState(initial.workspace);
  const [storageError, setStorageError] = useState(initial.error);
  const [page, setPage] = useState(() => parseHash().page);
  const [category, setCategory] = useState(() => parseHash().category);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("custom");
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [importError, setImportError] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const [resetting, setResetting] = useState(false);
  const searchRef = useRef(null);
  const importRef = useRef(null);
  const gridRef = useRef(null);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      setStorageError(
        "Browser storage is unavailable or full. Export your workspace to save your changes.",
      );
    }
  }, [workspace]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.documentElement.dataset.theme = workspace.appearance;
  }, [workspace.appearance]);
  useEffect(() => {
    const onHashChange = () => {
      const next = parseHash();
      setPage(next.page);
      setCategory(next.category);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    const shortcut = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "k" &&
        !document.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  const patch = (change) => setWorkspace((w) => ({ ...w, ...change }));
  const startResize = (e, axis) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = workspace.cardWidth;
    const startHeight = workspace.cardHeight;
    let width = startWidth;
    let height = startHeight;
    const onMove = (ev) => {
      const grid = gridRef.current;
      if (!grid) return;
      if (axis !== "height") {
        width = Math.min(
          CARD_WIDTH_MAX,
          Math.max(CARD_WIDTH_MIN, startWidth + (ev.clientX - startX)),
        );
        grid.style.setProperty("--card-width", `${width}px`);
      }
      if (axis !== "width") {
        height = Math.min(
          CARD_HEIGHT_MAX,
          Math.max(CARD_HEIGHT_MIN, startHeight + (ev.clientY - startY)),
        );
        grid.style.setProperty("--card-cover-height", `${height}px`);
      }
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      patch({ cardWidth: width, cardHeight: height });
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };
  const navigate = (next, cat = "All categories") => {
    setPage(next);
    setCategory(cat);
    setQuery("");
    setMenuOpen(false);
    history.replaceState(null, "", buildHash(next, cat));
  };
  const filterByCategory = (cat) => {
    setCategory(cat);
    history.replaceState(null, "", buildHash(page, cat));
  };
  const favoriteCount = workspace.systems.filter((s) => s.favorite).length;
  const categories = [
    ...new Set(workspace.systems.map((s) => s.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  const categoryCount = categories.length;
  const openEditor = (system) => {
    setEditing(system || null);
    setModal("edit");
  };
  const toggleFavorite = (id) =>
    setWorkspace((w) => ({
      ...w,
      systems: w.systems.map((s) =>
        s.id === id ? { ...s, favorite: !s.favorite } : s,
      ),
    }));
  const trackVisit = (id) =>
    setWorkspace((w) => ({
      ...w,
      recent: [id, ...w.recent.filter((x) => x !== id)].slice(0, 12),
    }));
  const move = (id, direction) =>
    setWorkspace((w) => {
      const systems = [...w.systems];
      const i = systems.findIndex((s) => s.id === id);
      const j = i + direction;
      if (j < 0 || j >= systems.length) return w;
      [systems[i], systems[j]] = [systems[j], systems[i]];
      return { ...w, systems };
    });
  const saveSystem = (system) => {
    if (!editing && workspace.systems.length >= 250) {
      setToast("Your workspace can hold up to 250 systems.");
      return;
    }
    setWorkspace((w) => ({
      ...w,
      systems: editing
        ? w.systems.map((s) => (s.id === system.id ? system : s))
        : [...w.systems, system],
    }));
    setModal(null);
    setToast(
      editing ? "System updated. Looking good!" : "Your new system is ready.",
    );
  };
  const removeSystem = (id) => {
    setWorkspace((w) => ({
      ...w,
      systems: w.systems.filter((s) => s.id !== id),
      recent: w.recent.filter((x) => x !== id),
    }));
    setModal(null);
    setToast("System removed from your dashboard.");
  };
  const exportWorkspace = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(workspace, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "drids-workspace.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Workspace exported. Keep it somewhere safe.");
  };
  const importWorkspace = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError("");
    try {
      if (file.size > 2_000_000)
        throw new Error("This backup is too large. Choose a file under 2 MB.");
      setPendingImport(validateWorkspace(JSON.parse(await file.text())));
    } catch (error) {
      setImportError(
        error instanceof SyntaxError
          ? "This file is not valid JSON. Choose a DRIDS workspace backup."
          : error.message,
      );
    }
  };
  let visible = workspace.systems.filter(
    (s) =>
      (page !== "favorites" || s.favorite) &&
      (page !== "recent" || workspace.recent.includes(s.id)) &&
      (category === "All categories" || s.category === category) &&
      `${s.title} ${s.description} ${s.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (page === "recent" && sort === "custom")
    visible.sort(
      (a, b) => workspace.recent.indexOf(a.id) - workspace.recent.indexOf(b.id),
    );
  if (sort === "az") visible.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "za") visible.sort((a, b) => b.title.localeCompare(a.title));
  const sectionTitle =
    page === "favorites"
      ? "Your favorites"
      : page === "recent"
        ? "Recently opened"
        : category === "All categories"
          ? "All systems"
          : category;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to dashboard
      </a>
      {menuOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${menuOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <Brand />
        <p className="sidebar-tagline">
          DICT Region 10
          <br />
          Integrated Data Systems
        </p>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="main-nav">
          <button
            className={
              page === "all" && category === "All categories" ? "active" : ""
            }
            onClick={() => navigate("all")}
          >
            <LayoutGrid size={19} />
            Overview
            <span className="nav-count">{workspace.systems.length}</span>
          </button>
          <button
            className={page === "favorites" ? "active" : ""}
            onClick={() => navigate("favorites")}
          >
            <Star size={19} />
            Favorites<span className="nav-count subtle">{favoriteCount}</span>
          </button>
          <button
            className={page === "recent" ? "active" : ""}
            onClick={() => navigate("recent")}
          >
            <Clock3 size={19} />
            Recently opened
          </button>
        </nav>
        {categories.length > 0 && (
          <div className="sidebar-scroll">
            <div className="sidebar-section-label category-label">
              CATEGORIES
            </div>
            <nav className="category-nav">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  onClick={() => navigate("all", c)}
                >
                  <Tag size={17} />
                  {c}
                </button>
              ))}
            </nav>
          </div>
        )}
        <div className="sidebar-bottom">
          <div className="workspace-tip">
            <span className="tip-icon">
              <Sparkles size={18} />
            </span>
            <strong>A workspace that’s yours.</strong>
            <p>
              Bring your everyday systems
              <br />
              together, just the way you work.
            </p>
            <button onClick={() => setModal("customize")}>
              Make it your own <ArrowUpRight size={16} />
            </button>
          </div>
          <button className="help-button" onClick={() => setModal("help")}>
            <HelpCircle size={18} />
            Help & information
            <ArrowUpRight size={15} />
          </button>
          <div className="region-signature">
            <div className="region-badge">10</div>
            <div>
              <strong>DICT Region 10</strong>
              <span>Northern Mindanao</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="desktop-crumb">Workspace</span>
            <span className="crumb-slash">/</span>
            <strong>Dashboard</strong>
          </div>
          <div className="topbar-right">
            <span className="region-pill">
              <span />
              Region 10 workspace
            </span>
            <button
              className="icon-button theme-toggle"
              onClick={() =>
                patch({
                  appearance: workspace.appearance === "dark" ? "light" : "dark",
                })
              }
              aria-label={
                workspace.appearance === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                workspace.appearance === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {workspace.appearance === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
            <button
              className="profile-button"
              onClick={() => setModal("help")}
              aria-label="About DICT Region 10"
            >
              R10
            </button>
          </div>
        </header>
        <main id="main">
          <section className="page-heading">
            <div>
              <div className="eyebrow">YOUR DIGITAL WORKSPACE</div>
              <h1>
                One portal. Every possibility<span>.</span>
              </h1>
              <p>Welcome to DICT Region 10 Integrated Data Systems.</p>
            </div>
            <button
              className="button customize-button"
              onClick={() => setModal("customize")}
            >
              <Settings2 size={17} />
              Customize
            </button>
          </section>
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-kicker">
                <span />
                CONNECTED FOR A BETTER TOMORROW
              </span>
              <h2>
                Your systems.
                <br />
                All in one place.
              </h2>
              <p>
                Less searching. More doing. Access the tools and
                <br className="desktop-break" /> services that keep Region 10
                moving forward.
              </p>
              <button
                onClick={() => {
                  navigate("favorites");
                  document
                    .getElementById("systems")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Explore your favorites <ArrowRight size={17} />
              </button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-orbit orbit-a" />
              <div className="hero-orbit orbit-b" />
              <div className="hero-orbit orbit-c" />
              <div className="art-node node-wifi">
                <Wifi />
              </div>
              <div className="art-node node-shield">
                <ShieldCheck />
              </div>
              <div className="art-node node-data">
                <Database />
              </div>
              <div className="art-spark spark-a">✧</div>
              <div className="art-spark spark-b">+</div>
              <div className="art-dot" />
              <div className="platform platform-bottom" />
              <div className="platform platform-middle" />
              <div className="platform platform-top">
                <div className="platform-brand">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <span className="art-caption">ONE CONNECTED REGION</span>
            </div>
            <div className="hero-corner">
              DRIDS <span>/ 10</span>
            </div>
          </section>
          <section className="stats" aria-label="Workspace statistics">
            <div>
              <span className="stat-icon">
                <LayoutGrid size={20} />
              </span>
              <div>
                <strong>
                  {String(workspace.systems.length).padStart(2, "0")}
                </strong>
                <span>Connected systems</span>
              </div>
              <span className="stat-caption">Your digital toolkit</span>
            </div>
            <div>
              <span className="stat-icon favorite-stat">
                <Star size={20} />
              </span>
              <div>
                <strong>{String(favoriteCount).padStart(2, "0")}</strong>
                <span>Pinned favorites</span>
              </div>
              <button
                className="stat-link"
                onClick={() => navigate("favorites")}
                aria-label="View favorites"
              >
                <ArrowUpRight size={20} />
              </button>
            </div>
            <div>
              <span className="stat-icon category-stat">
                <Database size={20} />
              </span>
              <div>
                <strong>{String(categoryCount).padStart(2, "0")}</strong>
                <span>System categories</span>
              </div>
              <span className="stat-caption">Everything organized</span>
            </div>
          </section>
          {storageError && (
            <div className="storage-error" role="alert">
              {storageError}
              <button onClick={exportWorkspace}>Export backup</button>
            </div>
          )}
          <section id="systems" className="systems-section">
            <div className="section-heading">
              <div>
                <h2>
                  {sectionTitle}
                  <span>{visible.length}</span>
                </h2>
                <p>
                  {page === "favorites"
                    ? "Your most important systems, always close at hand."
                    : page === "recent"
                      ? "Pick up where you left off."
                      : "The right tools, right at your fingertips."}
                </p>
              </div>
              <button className="button primary" onClick={() => openEditor()}>
                <Plus size={18} />
                Add system
              </button>
            </div>
            <div className="toolbar">
              <div className="search-box">
                <Search size={18} />
                <input
                  ref={searchRef}
                  aria-label="Search systems"
                  placeholder="Search your systems…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query ? (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <kbd>Ctrl K</kbd>
                )}
              </div>
              <div className="toolbar-filters">
                <label className="select-wrap">
                  <select
                    aria-label="Filter by category"
                    value={category}
                    onChange={(e) => filterByCategory(e.target.value)}
                  >
                    <option>All categories</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </label>
                <label className="select-wrap sort-select">
                  <select
                    aria-label="Sort systems"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="custom">Default order</option>
                    <option value="az">Name: A–Z</option>
                    <option value="za">Name: Z–A</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
                <div className="view-toggle">
                  <button
                    className={workspace.layout === "grid" ? "selected" : ""}
                    aria-label="Grid view"
                    aria-pressed={workspace.layout === "grid"}
                    onClick={() => patch({ layout: "grid" })}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    className={workspace.layout === "list" ? "selected" : ""}
                    aria-label="List view"
                    aria-pressed={workspace.layout === "list"}
                    onClick={() => patch({ layout: "list" })}
                  >
                    <List size={19} />
                  </button>
                </div>
              </div>
            </div>
            <div
              ref={gridRef}
              className={`systems-grid layout-${workspace.layout} columns-${workspace.columns} ${!workspace.showCovers ? "no-covers" : ""}`}
              style={
                workspace.layout === "custom"
                  ? {
                      "--card-width": `${workspace.cardWidth}px`,
                      "--card-cover-height": `${workspace.cardHeight}px`,
                    }
                  : undefined
              }
            >
              {visible.map((system) => (
                <article
                  className={`system-card ${themeClass(system.theme)}`}
                  style={themeVars(system.theme)}
                  key={system.id}
                >
                  {workspace.layout === "custom" && (
                    <>
                      <span
                        className="resize-handle resize-handle-x"
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize card width for all systems"
                        onPointerDown={(e) => startResize(e, "width")}
                      />
                      <span
                        className="resize-handle resize-handle-y"
                        role="separator"
                        aria-orientation="horizontal"
                        aria-label="Resize card height for all systems"
                        onPointerDown={(e) => startResize(e, "height")}
                      />
                    </>
                  )}
                  <a
                    className="system-link"
                    href={system.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackVisit(system.id)}
                    aria-label={`Open ${system.title} in a new tab`}
                  >
                    {workspace.showCovers && <Cover system={system} />}
                    <div className="card-body">
                      <div className="card-heading">
                        <span className="system-icon">
                          <SystemIcon name={system.icon} size={21} />
                        </span>
                        {system.category && (
                          <span className="category-badge">
                            {system.category}
                          </span>
                        )}
                      </div>
                      <h3>
                        {system.title}
                        <ArrowUpRight size={19} />
                      </h3>
                      <p>{system.description}</p>
                      <div className="card-footer">
                        <span>
                          {new URL(system.url).hostname.replace(/^www\./, "")}
                        </span>
                        <span>
                          Open system <ArrowUpRight size={14} />
                        </span>
                      </div>
                    </div>
                  </a>
                  <div className="card-controls">
                    <button
                      className={system.favorite ? "is-favorite" : ""}
                      onClick={() => toggleFavorite(system.id)}
                      aria-label={`${system.favorite ? "Unpin" : "Pin"} ${system.title}`}
                      aria-pressed={system.favorite}
                    >
                      <Star
                        size={16}
                        fill={system.favorite ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      onClick={() => openEditor(system)}
                      aria-label={`Edit ${system.title}`}
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {!visible.length && (
              <div className="empty-state">
                <span>
                  <Search size={30} />
                </span>
                <h3>
                  {query
                    ? "No systems found"
                    : page === "favorites"
                      ? "Make room for your favorites"
                      : page === "recent"
                        ? "Your next visit starts here"
                        : "A fresh space for your systems"}
                </h3>
                <p>
                  {query
                    ? "Try a different search or choose another category."
                    : page === "favorites"
                      ? "Tap the star on any system to keep it here."
                      : page === "recent"
                        ? "Open a system and it will appear here for easy access."
                        : "Add a system to start connecting your workspace."}
                </p>
                <button
                  className="button"
                  onClick={() => {
                    navigate("all");
                  }}
                >
                  View all systems
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            <div className="systems-note">
              <ExternalLink size={13} />
              <span>
                Every system opens in a new tab. Your workspace stays right
                here.
              </span>
            </div>
          </section>
          <footer className="footer">
            <span>
              © {new Date().getFullYear()} DICT Region 10 <i />
              Integrated Data Systems
            </span>
            <span>
              Made for a more connected region.
              <span className="footer-dot" />
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal === "edit" && (
        <SystemForm
          system={editing}
          onSave={saveSystem}
          onClose={() => setModal(null)}
          onDelete={removeSystem}
          categories={categories}
        />
      )}
      {modal === "customize" && (
        <Modal
          title="Make yourself at home"
          subtitle="A few little changes. A workspace that feels like you."
          onClose={() => {
            setModal(null);
            setPendingImport(null);
            setResetting(false);
          }}
        >
          <div className="settings-section">
            <h3>Dashboard layout</h3>
            <div className="layout-options">
              <button
                className={workspace.layout === "grid" ? "selected" : ""}
                onClick={() => patch({ layout: "grid" })}
              >
                <LayoutGrid size={24} />
                <strong>Card grid</strong>
                <span>A little more visual</span>
              </button>
              <button
                className={workspace.layout === "list" ? "selected" : ""}
                onClick={() => patch({ layout: "list" })}
              >
                <List size={24} />
                <strong>Compact list</strong>
                <span>Everything at a glance</span>
              </button>
              <button
                className={workspace.layout === "custom" ? "selected" : ""}
                onClick={() => patch({ layout: "custom" })}
              >
                <Maximize2 size={24} />
                <strong>Custom size</strong>
                <span>Drag a card to resize</span>
              </button>
            </div>
            {workspace.layout === "custom" ? (
              <p className="settings-description">
                Drag the handle on the right or bottom edge of any card to
                resize every card at once.
              </p>
            ) : (
              <div className="setting-row">
                <div>
                  <strong>Cards per row</strong>
                  <p>On larger screens</p>
                </div>
                <div className="segmented">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      className={workspace.columns === n ? "selected" : ""}
                      aria-pressed={workspace.columns === n}
                      onClick={() => patch({ columns: n })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="setting-row">
              <div>
                <strong>Show cover artwork</strong>
                <p>Add a little character to your cards</p>
              </div>
              <button
                className={`switch ${workspace.showCovers ? "on" : ""}`}
                role="switch"
                aria-checked={workspace.showCovers}
                aria-label="Show cover artwork"
                onClick={() => patch({ showCovers: !workspace.showCovers })}
              >
                <span />
              </button>
            </div>
          </div>
          <div className="settings-section">
            <h3>Arrange your systems</h3>
            <p className="settings-description">
              Set the order used by “Default order” on your dashboard.
            </p>
            <div className="reorder-list">
              {workspace.systems.map((s, i) => (
                <div key={s.id}>
                  <span
                    className={`reorder-icon ${themeClass(s.theme)}`}
                    style={themeVars(s.theme)}
                  >
                    <SystemIcon name={s.icon} size={17} />
                  </span>
                  <span>{s.title}</span>
                  <button
                    className="icon-button"
                    disabled={i === 0}
                    aria-label={`Move ${s.title} up`}
                    onClick={() => move(s.id, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={i === workspace.systems.length - 1}
                    aria-label={`Move ${s.title} down`}
                    onClick={() => move(s.id, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="settings-section">
            <h3>Take your workspace with you</h3>
            <p className="settings-description">
              Your changes are saved in this browser. Export a backup to move
              them to another device.
            </p>
            <div className="backup-actions">
              <button className="button" onClick={exportWorkspace}>
                <Download size={16} />
                Export backup
              </button>
              <button
                className="button"
                onClick={() => importRef.current.click()}
              >
                <Upload size={16} />
                Import backup
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={importWorkspace}
              />
            </div>
            {importError && (
              <p className="form-error" role="alert">
                {importError}
              </p>
            )}
            {pendingImport && (
              <div className="import-confirm">
                <p>
                  Replace this workspace with {pendingImport.systems.length}{" "}
                  systems from your backup?
                </p>
                <div className="backup-actions">
                  <button
                    className="button primary"
                    onClick={() => {
                      setWorkspace(pendingImport);
                      setPendingImport(null);
                      navigate("all");
                      setToast("Your workspace has been restored.");
                    }}
                  >
                    Replace workspace
                  </button>
                  <button
                    className="button"
                    onClick={() => setPendingImport(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-actions">
            {resetting ? (
              <div className="reset-confirm">
                <p>
                  Replace all your systems and settings with the starter
                  workspace?
                </p>
                <button
                  className="text-button danger-text"
                  onClick={() => {
                    setWorkspace(defaultWorkspace());
                    setResetting(false);
                    navigate("all");
                    setToast("Starter workspace restored.");
                  }}
                >
                  Yes, reset workspace
                </button>
                <button
                  className="text-button"
                  onClick={() => setResetting(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="text-button danger-text"
                onClick={() => setResetting(true)}
              >
                Reset workspace
              </button>
            )}
            <div className="action-spacer" />
            <button className="button primary" onClick={() => setModal(null)}>
              Done
              <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="One region. Connected."
          subtitle="DICT Region 10 Integrated Data Systems"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            <div className="help-brand">
              <Brand />
            </div>
            <p>
              DRIDS brings your everyday systems together in one simple,
              personal dashboard.
            </p>
            <div>
              <ArrowUpRight />
              <p>
                <strong>Go straight to your systems</strong>Click a card to open
                its website in a new tab.
              </p>
            </div>
            <div>
              <Star />
              <p>
                <strong>Keep the essentials close</strong>Star a system to find
                it in Favorites. Recent visits are saved automatically.
              </p>
            </div>
            <div>
              <Settings2 />
              <p>
                <strong>Make it work for you</strong>Add systems, edit their
                details, reorder cards, and choose your layout.
              </p>
            </div>
            <div>
              <Download />
              <p>
                <strong>Keep a copy</strong>Changes stay in this browser on this
                device. Export your workspace from Customize to back it up.
              </p>
            </div>
            <p className="help-footnote">
              The included links are starter public resources. Replace them with
              your organization’s approved systems. DRIDS is a link dashboard
              and does not provide access to restricted systems.
            </p>
          </div>
          <div className="modal-actions">
            <button className="button primary" onClick={() => setModal(null)}>
              Back to workspace
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
