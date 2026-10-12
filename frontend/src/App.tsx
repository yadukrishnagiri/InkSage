import { useEffect, useRef, useState } from "react";
import type { CSSProperties, DragEvent, FormEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  Menu,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import "./styles.css";

type Pdf = { id: string; name: string; pages: number; size: number };
type Subject = { id: string; name: string; created_at: string; files: Pdf[] };
type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: string[];
  mode?: string;
};
type DialogState =
  | { kind: "create" }
  | { kind: "deleteSubject"; subject: Subject }
  | { kind: "deletePdf"; file: Pdf; subjectId: string }
  | null;
type UploadState = {
  id: number;
  name: string;
  status: "uploading" | "done" | "error";
  detail?: string;
};
type PreviewState = { file: Pdf; page: number } | null;
const tones = ["coral", "violet", "lime", "sky", "yellow"];

function answerText(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      detail = (await response.json()).detail || detail;
    } catch {
      /* Keep status text. */
    }
    throw new Error(detail);
  }
  return response.json();
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button className="brand" onClick={onClick} aria-label="InkSage home">
      <span className="brand-mark">
        <BookOpen size={22} strokeWidth={2.5} />
      </span>
      <span>
        ink<span className="brand-accent">sage</span>
        <b>.</b>
      </span>
    </button>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <nav>
          <a href="#how-it-works">How it works</a>
          <button className="nav-cta" onClick={onStart}>
            Open my space <ArrowRight size={17} />
          </button>
        </nav>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-pill">
              <span className="pill-dot" /> YOUR NOTES, YOUR ANSWERS
            </div>
            <h1 id="hero-title">
              Make your notes <em>make sense.</em>
            </h1>
            <p>
              Keep every subject in its own space. Drop in your PDFs and ask
              questions grounded in the pages you actually study.
            </p>
            <div className="hero-actions">
              <button className="hero-button" onClick={onStart}>
                Start studying <ArrowRight size={20} />
              </button>
              <a href="#how-it-works" className="how-link">
                See how it works <ArrowDown size={17} />
              </a>
            </div>
            <div className="hero-fineprint">
              <span className="mini-check">
                <Check size={12} />
              </span>{" "}
              Local workspace · No account needed
            </div>
          </div>
          <div
            className="hero-demo"
            aria-label="Illustration: a Chemistry folder receives PDFs and produces an answer with a page citation"
          >
            <div className="demo-doodle doodle-one" aria-hidden="true">
              ✳
            </div>
            <div className="demo-doodle doodle-two" aria-hidden="true">
              ✦
            </div>
            <div className="demo-stage">
              <span className="demo-caption">
                Illustrative preview of the flow
              </span>
              <div className="demo-folder">
                <div className="folder-tab" />
                <div className="folder-front">
                  <Folder size={28} />
                  <span>CHEMISTRY</span>
                  <strong>Everything in one place.</strong>
                </div>
              </div>
              <div className="demo-pdf pdf-a">
                <FileText size={20} />
                <span>Atomic Structure.pdf</span>
              </div>
              <div className="demo-pdf pdf-b">
                <FileText size={20} />
                <span>Chapter 02.pdf</span>
              </div>
              <svg
                className="demo-route"
                viewBox="0 0 440 360"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M235 203 C305 192 321 250 359 260"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="7 8"
                  strokeLinecap="round"
                />
                <path
                  d="m348 250 12 10-14 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="demo-answer">
                <div className="demo-answer-top">
                  <span className="demo-spark">
                    <Sparkles size={15} />
                  </span>{" "}
                  InkSage says
                </div>
                <p>Atoms are made of protons, neutrons and electrons.</p>
                <small>
                  <FileText size={12} /> Atomic Structure.pdf · page 3
                </small>
              </div>
              <div className="demo-sticker">ask away!</div>
            </div>
          </div>
        </section>
        <div className="ticker" aria-hidden="true">
          <div>
            ONE SUBJECT AT A TIME <span>✳</span> REAL PDF PAGES <span>✳</span>{" "}
            QUESTIONS WITH SOURCES <span>✳</span> ONE SUBJECT AT A TIME{" "}
            <span>✳</span> REAL PDF PAGES <span>✳</span> QUESTIONS WITH SOURCES{" "}
            <span>✳</span>
          </div>
        </div>
        <section id="how-it-works" className="how-section">
          <div className="how-heading">
            <h2>
              From scattered PDFs
              <br />
              to <em>“oh, I get it.”</em>
            </h2>
            <p>Three small steps. One calmer way to study.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-art art-folder">
                <FolderPlus size={46} />
              </div>
              <span className="step-number">01</span>
              <h3>Make a subject</h3>
              <p>Give Chemistry, Maths, or your next course its own folder.</p>
            </div>
            <div className="step-connector" aria-hidden="true">
              <ChevronRight size={26} />
            </div>
            <div className="step">
              <div className="step-art art-pdf">
                <FileText size={46} />
              </div>
              <span className="step-number">02</span>
              <h3>Add your PDFs</h3>
              <p>Upload text based PDFs to the subject where they belong.</p>
            </div>
            <div className="step-connector" aria-hidden="true">
              <ChevronRight size={26} />
            </div>
            <div className="step">
              <div className="step-art art-chat">
                <MessageCircle size={46} />
              </div>
              <span className="step-number">03</span>
              <h3>Ask your notes</h3>
              <p>Get an answer or matching passage with PDF page references.</p>
            </div>
          </div>
        </section>
        <section className="landing-close">
          <span className="close-sun" aria-hidden="true">
            ✺
          </span>
          <h2>Ready when your notes are.</h2>
          <p>
            Your study space lives on this computer. Start with one subject and
            build from there.
          </p>
          <button className="hero-button" onClick={onStart}>
            Open my study space <ArrowRight size={20} />
          </button>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <span>Made for the “wait, what does that mean?” moments.</span>
        <span>Local mode · 2026</span>
      </footer>
    </div>
  );
}

function Dialog({
  state,
  onClose,
  onCreate,
  onDelete,
  working,
}: {
  state: DialogState;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
  working: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (state && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement;
      setName("");
      setError("");
      dialog.showModal();
      if (state.kind === "create")
        requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!state && dialog.open) {
      dialog.close();
      returnFocus.current?.focus();
    }
  }, [state]);
  if (!state)
    return (
      <dialog
        ref={ref}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      />
    );
  const isCreate = state.kind === "create";
  const title = isCreate
    ? "Name your new subject"
    : state.kind === "deleteSubject"
      ? `Delete ${state.subject.name}?`
      : `Remove ${state.file.name}?`;
  const description = isCreate
    ? "One home for every PDF and question in this subject."
    : state.kind === "deleteSubject"
      ? `This removes the subject and its ${state.subject.files.length} PDF${state.subject.files.length === 1 ? "" : "s"} from this computer.`
      : "This removes the PDF and its extracted text from this subject.";
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (isCreate) {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 80) {
        setError("Use a name between 1 and 80 characters.");
        inputRef.current?.focus();
        return;
      }
      try {
        await onCreate(trimmed);
        onClose();
      } catch (e) {
        setError((e as Error).message);
      }
    } else {
      try {
        await onDelete();
        onClose();
      } catch (e) {
        setError((e as Error).message);
      }
    }
  }
  return (
    <dialog
      ref={ref}
      className="app-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!working) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !working) onClose();
      }}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <form onSubmit={submit}>
        <div className={`dialog-icon ${isCreate ? "" : "danger"}`}>
          {isCreate ? <FolderPlus size={25} /> : <Trash2 size={24} />}
        </div>
        <button
          type="button"
          className="dialog-close"
          onClick={onClose}
          disabled={working}
          aria-label="Close dialog"
        >
          <X size={19} />
        </button>
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-description">{description}</p>
        {isCreate && (
          <>
            <label htmlFor="subject-name">Subject name</label>
            <input
              id="subject-name"
              ref={inputRef}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              maxLength={80}
              placeholder="e.g. Chemistry"
              aria-invalid={!!error}
              aria-describedby={error ? "dialog-error" : undefined}
            />
            <small className="field-hint">
              {name.trim().length}/80 characters
            </small>
          </>
        )}
        {error && (
          <div id="dialog-error" className="dialog-error" role="alert">
            {error}
          </div>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button-quiet"
            onClick={onClose}
            disabled={working}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={isCreate ? "button-solid" : "button-danger"}
            disabled={working}
          >
            {working ? "Working…" : isCreate ? "Create subject" : "Delete"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function App() {
  const [view, setView] = useState<"landing" | "workspace">("landing");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dialogWorking, setDialogWorking] = useState(false);
  const [preview, setPreview] = useState<PreviewState>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadInFlight = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const menuWasOpen = useRef(false);
  const active = subjects.find((subject) => subject.id === activeId);
  const chat = activeId ? messages[activeId] || [] : [];
  const question = activeId ? drafts[activeId] || "" : "";

  async function refresh() {
    const next = await request<Subject[]>("/api/subjects");
    setSubjects(next);
    setActiveId((current) =>
      current && next.some((s) => s.id === current)
        ? current
        : next[0]?.id || null,
    );
  }
  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    try {
      setMessages(JSON.parse(localStorage.getItem("inksage-chat") || "{}"));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("inksage-chat", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length, busy]);
  useEffect(() => {
    if (menuOpen) {
      sidebarCloseRef.current?.focus();
      const onEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !dialog) setMenuOpen(false);
      };
      document.addEventListener("keydown", onEscape);
      menuWasOpen.current = true;
      return () => document.removeEventListener("keydown", onEscape);
    }
    if (menuWasOpen.current) {
      menuButtonRef.current?.focus();
      menuWasOpen.current = false;
    }
  }, [menuOpen, dialog]);

  function enterWorkspace() {
    setView("workspace");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function goHome() {
    setView("landing");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openCitation(citation: string) {
    const match = citation.match(/^(.*), page (\d+)$/i);
    if (!match || !active) return;
    const file = active.files.find((item) => item.name === match[1]);
    if (file) setPreview({ file, page: Number(match[2]) });
  }
  async function createSubject(name: string) {
    setDialogWorking(true);
    try {
      const subject = await request<Subject>("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await refresh();
      setActiveId(subject.id);
      setUploads([]);
      setError("");
      setMenuOpen(false);
    } finally {
      setDialogWorking(false);
    }
  }
  async function deleteSelected() {
    if (!dialog || dialog.kind === "create") return;
    setDialogWorking(true);
    try {
      if (dialog.kind === "deleteSubject") {
        await request(`/api/subjects/${dialog.subject.id}`, {
          method: "DELETE",
        });
        setMessages((previous) => {
          const next = { ...previous };
          delete next[dialog.subject.id];
          return next;
        });
        setDrafts((previous) => {
          const next = { ...previous };
          delete next[dialog.subject.id];
          return next;
        });
      } else {
        await request(
          `/api/subjects/${dialog.subjectId}/files/${dialog.file.id}`,
          { method: "DELETE" },
        );
      }
      await refresh();
      setUploads([]);
    } finally {
      setDialogWorking(false);
    }
  }
  async function upload(fileList: FileList | File[]) {
    if (!activeId || !fileList.length || busy || uploadInFlight.current) return;
    uploadInFlight.current = true;
    setBusy(true);
    setError("");
    setUploads([]);
    const selected = Array.from(fileList);
    for (const [id, file] of selected.entries()) {
      setUploads((previous) => [
        ...previous,
        { id, name: file.name, status: "uploading" },
      ]);
      try {
        if (!file.name.toLowerCase().endsWith(".pdf"))
          throw new Error("Choose a PDF file.");
        const body = new FormData();
        body.append("file", file);
        await request(`/api/subjects/${activeId}/files`, {
          method: "POST",
          body,
        });
        setUploads((previous) =>
          previous.map((item) =>
            item.id === id ? { ...item, status: "done" } : item,
          ),
        );
      } catch (e) {
        setUploads((previous) =>
          previous.map((item) =>
            item.id === id
              ? { ...item, status: "error", detail: (e as Error).message }
              : item,
          ),
        );
      }
    }
    try {
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
    uploadInFlight.current = false;
    if (uploadRef.current) uploadRef.current.value = "";
  }
  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    if (!busy && !uploadInFlight.current && event.dataTransfer.files.length)
      upload(event.dataTransfer.files);
  }
  async function send() {
    const text = question.trim();
    const subjectId = activeId;
    if (!subjectId || !text || !active?.files.length || busy) return;
    setDrafts((previous) => ({ ...previous, [subjectId]: "" }));
    setError("");
    setBusy(true);
    setMessages((previous) => ({
      ...previous,
      [subjectId]: [...(previous[subjectId] || []), { role: "user", text }],
    }));
    try {
      const answer = await request<{
        text: string;
        citations: string[];
        mode: string;
      }>("/api/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: subjectId, query: text }),
      });
      setMessages((previous) => ({
        ...previous,
        [subjectId]: [
          ...(previous[subjectId] || []),
          { role: "assistant", ...answer },
        ],
      }));
    } catch (e) {
      setMessages((previous) => ({
        ...previous,
        [subjectId]: (previous[subjectId] || []).slice(0, -1),
      }));
      setDrafts((previous) => ({ ...previous, [subjectId]: text }));
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div key={view} className="view-enter">
        {view === "landing" ? (
          <Landing onStart={enterWorkspace} />
        ) : (
          <div className="workspace">
            <aside
              className={`workspace-sidebar ${menuOpen ? "open" : ""}`}
              aria-label="Subjects"
            >
              <div className="sidebar-top">
                <Brand onClick={goHome} />
                <button
                  ref={sidebarCloseRef}
                  className="sidebar-close"
                  aria-label="Close subjects"
                  onClick={() => setMenuOpen(false)}
                >
                  <X size={21} />
                </button>
              </div>
              <div className="sidebar-label">
                YOUR SUBJECTS <span>{subjects.length}</span>
              </div>
              <div className="subject-list">
                {subjects.map((subject, index) => (
                  <div
                    className={`subject-item tone-${tones[index % tones.length]} ${subject.id === activeId ? "active" : ""}`}
                    key={subject.id}
                  >
                    <button
                      className="subject-choice"
                      onClick={() => {
                        setActiveId(subject.id);
                        setUploads([]);
                        setError("");
                        setMenuOpen(false);
                      }}
                    >
                      <span className="subject-symbol">
                        <Folder size={20} />
                      </span>
                      <span className="subject-name">
                        {subject.name}
                        <small>
                          {subject.files.length} PDF
                          {subject.files.length === 1 ? "" : "s"}
                        </small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                    <button
                      className="subject-trash"
                      onClick={() =>
                        setDialog({ kind: "deleteSubject", subject })
                      }
                      title={`Delete ${subject.name}`}
                      aria-label={`Delete ${subject.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="sidebar-add"
                onClick={() => setDialog({ kind: "create" })}
              >
                <Plus size={18} /> New subject
              </button>
              <div className="sidebar-bottom">
                <span className="local-indicator" /> Stored on this computer
                <br />
                <small>No account. No database.</small>
              </div>
            </aside>
            {menuOpen && (
              <div
                className="sidebar-scrim"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
            )}
            <div className="workspace-main" inert={menuOpen}>
              <header className="workspace-header">
                <div className="workspace-header-left">
                  <button
                    ref={menuButtonRef}
                    className="menu-button"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open subjects"
                  >
                    <Menu size={22} />
                  </button>
                  <button className="back-link" onClick={goHome}>
                    <ArrowLeft size={17} /> Home
                  </button>
                  <span className="header-divider" />
                  <span className="header-current">
                    {active?.name || "My study space"}
                  </span>
                </div>
                <div className="header-right">
                  <span className="workspace-badge">
                    <span /> LOCAL WORKSPACE
                  </span>
                </div>
              </header>
              {error && (
                <div className="global-error" role="alert">
                  <span>{error}</span>
                  <button
                    onClick={() => setError("")}
                    aria-label="Dismiss error"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {loading ? (
                <div className="workspace-empty">
                  <BookOpen size={38} />
                  <h1>Opening your space…</h1>
                </div>
              ) : !active ? (
                <div className="workspace-empty">
                  <div className="empty-orbit">
                    <FolderPlus size={48} />
                  </div>
                  <h1>Every big idea starts somewhere.</h1>
                  <p>
                    Make your first subject, then give your PDFs a place to
                    live.
                  </p>
                  <button
                    className="button-solid"
                    onClick={() => setDialog({ kind: "create" })}
                  >
                    <Plus size={18} /> Create a subject
                  </button>
                </div>
              ) : (
                <div className="study-content">
                  <div className="study-heading">
                    <div>
                      <div className="study-heading-spark">
                        <Sparkles size={17} /> Your study space
                      </div>
                      <h1>
                        {active.name}
                        <span className="heading-period">.</span>
                      </h1>
                      <p>
                        One subject. All its notes. Answers tied to the source.
                      </p>
                    </div>
                    <div className="heading-illustration" aria-hidden="true">
                      <span className="illus-page one" />
                      <span className="illus-page two" />
                      <span className="illus-folder">
                        <Folder size={34} />
                      </span>
                    </div>
                  </div>
                  <div className="study-columns">
                    <section
                      className="sources-panel"
                      aria-labelledby="sources-title"
                    >
                      <div className="panel-heading">
                        <div>
                          <h2 id="sources-title">
                            Your PDFs <span>{active.files.length}</span>
                          </h2>
                          <p>Only these files are used for this subject.</p>
                        </div>
                      </div>
                      <div
                        className={`dropzone ${dragging ? "dragging" : ""}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={(event) => {
                          if (
                            !event.currentTarget.contains(
                              event.relatedTarget as Node,
                            )
                          )
                            setDragging(false);
                        }}
                        onDrop={onDrop}
                      >
                        <div className="drop-icon">
                          <Upload size={27} />
                        </div>
                        <strong>Drop your PDFs here</strong>
                        <span>or choose files from your computer</span>
                        <button
                          className="button-solid upload-button"
                          onClick={() => uploadRef.current?.click()}
                          disabled={busy}
                        >
                          <Plus size={17} /> Add PDFs
                        </button>
                        <small>Text based PDFs · up to 20 MB each</small>
                        <input
                          ref={uploadRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          multiple
                          hidden
                          onChange={(event) => {
                            if (event.target.files) upload(event.target.files);
                          }}
                        />
                      </div>
                      {uploads.length > 0 && (
                        <div className="upload-results" aria-live="polite">
                          {uploads.map((item, index) => (
                            <div
                              className={`upload-result ${item.status}`}
                              key={`${item.name}-${index}`}
                            >
                              <FileText size={16} />
                              <span title={item.name}>{item.name}</span>
                              <small>
                                {item.status === "uploading"
                                  ? "Adding…"
                                  : item.status === "done"
                                    ? "Added"
                                    : item.detail}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="file-section-title">IN THIS SUBJECT</div>
                      {active.files.length ? (
                        <div className="pdf-list">
                          {active.files.map((file) => (
                            <div className="pdf-row" key={file.id}>
                              <div className="pdf-symbol">
                                <FileText size={20} />
                              </div>
                              <div className="pdf-info">
                                <strong title={file.name}>{file.name}</strong>
                                <small>
                                  {file.pages}{" "}
                                  {file.pages === 1 ? "page" : "pages"} ·{" "}
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </small>
                              </div>
                              <button
                                onClick={() =>
                                  setDialog({
                                    kind: "deletePdf",
                                    file,
                                    subjectId: active.id,
                                  })
                                }
                                title={`Remove ${file.name}`}
                                aria-label={`Remove ${file.name}`}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="files-empty">
                          Your PDF shelf is empty. Add a file to start asking
                          questions.
                        </p>
                      )}
                    </section>
                    <section
                      className="chat-panel"
                      aria-labelledby="chat-title"
                    >
                      <div className="chat-header">
                        <div className="chat-avatar">
                          <MessageCircle size={22} />
                        </div>
                        <div>
                          <h2 id="chat-title">Ask InkSage</h2>
                          <p>Studying {active.name}</p>
                        </div>
                        <span className="chat-status">
                          <span />{" "}
                          {busy
                            ? "Thinking"
                            : active.files.length
                              ? "Ready"
                              : "Add a PDF"}
                        </span>
                      </div>
                      <div
                        className="conversation"
                        role="log"
                        aria-label={`${active.name} chat messages`}
                        aria-live="polite"
                        aria-relevant="additions"
                      >
                        {!chat.length && (
                          <div className="chat-welcome">
                            <div className="welcome-mark">
                              <Sparkles size={30} />
                            </div>
                            <h3>
                              {active.files.length
                                ? "What are we figuring out?"
                                : "Add a PDF, then ask away."}
                            </h3>
                            <p>
                              {active.files.length
                                ? "Ask about a concept, definition or example in your PDFs. I’ll show where the answer came from."
                                : "Your questions will stay inside this subject’s uploaded PDFs."}
                            </p>
                          </div>
                        )}
                        {chat.map((message, index) => (
                          <div
                            className={`message ${message.role}`}
                            key={index}
                          >
                            <div className="message-bubble">
                              <span className="message-author">
                                {message.role === "user"
                                  ? "YOU"
                                  : message.mode === "search"
                                    ? "MATCHING PASSAGES"
                                    : "INKSAGE"}
                              </span>
                              <div className="message-text">
                                {answerText(message.text)}
                              </div>
                              {!!message.citations?.length && (
                                <div className="citations">
                                  {message.citations.map(
                                    (citation, citationIndex) => (
                                      <button
                                        key={citationIndex}
                                        type="button"
                                        onClick={() => openCitation(citation)}
                                        title="Open this page in the PDF"
                                      >
                                        <FileText size={13} />
                                        {citation}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {busy && (
                          <div className="thinking">
                            <div className="book-loader" aria-hidden="true">
                              <span className="book-cover" />
                              <span className="book-page" />
                            </div>
                            <div className="thinking-copy">
                              <strong>Finding it in your notes…</strong>
                              <small>Reading the right pages</small>
                            </div>
                          </div>
                        )}
                        <div ref={bottomRef} />
                      </div>
                      <div className="composer">
                        <div className="composer-box">
                          <textarea
                            value={question}
                            onChange={(event) =>
                              setDrafts((previous) => ({
                                ...previous,
                                [active.id]: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                send();
                              }
                            }}
                            placeholder={
                              active.files.length
                                ? `Ask anything about ${active.name}…`
                                : "Add a PDF to ask a question…"
                            }
                            disabled={!active.files.length || busy}
                            aria-label="Ask a question"
                          />
                          <button
                            onClick={send}
                            disabled={
                              !question.trim() || !active.files.length || busy
                            }
                            aria-label="Send question"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                        <small>
                          Answers can make mistakes. Check the cited PDF pages.
                        </small>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Dialog
        state={dialog}
        onClose={() => setDialog(null)}
        onCreate={createSubject}
        onDelete={deleteSelected}
        working={dialogWorking}
      />
      {preview && active && (
        <div className="pdf-preview-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPreview(null);
        }}>
          <section className="pdf-preview" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <header>
              <div>
                <span className="preview-kicker"><FileText size={13} /> Citation preview</span>
                <h2 id="preview-title">{preview.file.name}</h2>
                <p>Page {preview.page} · cited in your answer</p>
              </div>
              <button className="dialog-close" onClick={() => setPreview(null)} aria-label="Close PDF preview"><X size={19} /></button>
            </header>
            <div className="pdf-frame-wrap">
              <iframe title={`${preview.file.name}, page ${preview.page}`} src={`/api/subjects/${active.id}/files/${preview.file.id}/preview#page=${preview.page}`} />
              <div className="page-highlight" aria-hidden="true">Cited page {preview.page}</div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
