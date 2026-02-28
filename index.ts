import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";


type JobStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  createdAt: string; // ISO date
  notes?: string;
}

const DATA_FILE = join(process.cwd(), "jobs.json");

function loadJobs(): JobApplication[] {
  if (!existsSync(DATA_FILE)) return [];
  const raw = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as JobApplication[];
}

function saveJobs(jobs: JobApplication[]) {
  writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function printHelp() {
  console.log(`
Job Tracker (TypeScript CLI)

Commands:
  add "<company>" "<role>" [status] [notes]
  list
  update <id> <status>
  remove <id>
  help

Statuses: saved | applied | interview | offer | rejected

Examples:
  npm run dev -- add "Google" "Software Engineer" applied "Reached out via referral"
  npm run dev -- list
  npm run dev -- update 1700000000-ab12 applied
`);
}

function requireArg(value: string | undefined, name: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    console.error(`Missing required argument: ${name}`);
    process.exit(1);
  }
  return value;
}


function isStatus(value: string): value is JobStatus {
  return ["saved", "applied", "interview", "offer", "rejected"].includes(value);
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  const jobs = loadJobs();

  if (!command || command === "help") {
    printHelp();
    return;
  }

  if (command === "add") {
    const company = requireArg(args[0], "company");
    const role = requireArg(args[1], "role");

    const maybeStatus = args[2];
    const status: JobStatus = maybeStatus && isStatus(maybeStatus) ? maybeStatus : "saved";

    const notes = args.slice(maybeStatus && isStatus(maybeStatus) ? 3 : 2).join(" ") || undefined;

    const newJob: JobApplication = {
      id: makeId(),
      company,
      role,
      status,
      createdAt: new Date().toISOString(),
      notes
    };

    const updated = [newJob, ...jobs];
    saveJobs(updated);

    console.log(`✅ Added: ${newJob.company} — ${newJob.role} (${newJob.status})`);
    console.log(`   id: ${newJob.id}`);
    return;
  }

  if (command === "list") {
    if (jobs.length === 0) {
      console.log("No jobs saved yet. Add one with: npm run dev -- add \"Company\" \"Role\"");
      return;
    }

    console.log(`\n📌 Job Applications (${jobs.length})\n`);
    for (const j of jobs) {
      console.log(`- ${j.company} — ${j.role}`);
      console.log(`  id: ${j.id}`);
      console.log(`  status: ${j.status}`);
      console.log(`  created: ${new Date(j.createdAt).toLocaleString()}`);
      if (j.notes) console.log(`  notes: ${j.notes}`);
      console.log("");
    }
    return;
  }

  if (command === "update") {
    const id = requireArg(args[0], "id");
    const newStatusRaw = requireArg(args[1], "status");

    if (!isStatus(newStatusRaw)) {
      console.error(`Invalid status: ${newStatusRaw}`);
      printHelp();
      process.exit(1);
    }

    const idx = jobs.findIndex((j) => j.id === id);
    if (idx === -1) {
      console.error(`No job found with id: ${id}`);
      process.exit(1);
    }

    jobs[idx]!.status = newStatusRaw; // <-- note the !
    saveJobs(jobs);
    console.log(`✅ Updated ${id} → ${newStatusRaw}`);
    return;
  }


  if (command === "remove") {
    const id = requireArg(args[0], "id");
    const filtered = jobs.filter(j => j.id !== id);
    if (filtered.length === jobs.length) {
      console.error(`No job found with id: ${id}`);
      process.exit(1);
    }
    saveJobs(filtered);
    console.log(`🗑️ Removed ${id}`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
}

main();
