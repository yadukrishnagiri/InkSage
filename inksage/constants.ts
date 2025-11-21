import { BookOpen, Folder, ShieldCheck, FileText, Eraser, Download } from "lucide-react";

export const FEATURES = [
  {
    icon: Folder,
    title: "Subject-Based Chats",
    desc: "Each subject has its own memory. Biology notes don't get mixed with History."
  },
  {
    icon: FileText,
    title: "Multi-File Upload",
    desc: "Upload entire syllabi. Chat using all your notes at once."
  },
  {
    icon: BookOpen,
    title: "Proof-Based Answers",
    desc: "Answers must quote your own notes. No hallucinations."
  },
  {
    icon: ShieldCheck,
    title: "Guest Mode Privacy",
    desc: "Upload → Learn → Close tab → Auto delete. Zero footprint."
  },
  {
    icon: Eraser,
    title: "Smart Organization",
    desc: "Keep your digital desk tidy with color-coded binders."
  },
  {
    icon: Download,
    title: "Export Summary",
    desc: "Save your chat sessions as PDF study guides."
  }
];

export const TESTIMONIALS = [
  {
    text: "Finally, an AI that doesn't just make things up. It actually points to the slide in my lecture notes.",
    author: "Sarah J., Med Student",
    color: "bg-yellow-100"
  },
  {
    text: "I use Guest Mode for my confidential research papers. It feels safe knowing everything wipes when I close the tab.",
    author: "David L., PhD Candidate",
    color: "bg-blue-100"
  },
  {
    text: "It's like a study buddy who memorized the textbook perfectly. Saved me during finals.",
    author: "Emily R., History Major",
    color: "bg-green-100"
  }
];