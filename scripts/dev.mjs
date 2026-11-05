import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const useProcessGroups = process.platform !== "win32";

const applications = [
  { name: "backend", args: ["--prefix", "backend", "run", "start:dev"] },
  { name: "frontend", args: ["--prefix", "frontend", "run", "dev"] },
];

const children = applications.map(({ name, args }) => {
  const child = spawn(npmCommand, args, {
    cwd: repositoryRoot,
    env: process.env,
    stdio: "inherit",
    detached: useProcessGroups,
  });

  child.applicationName = name;
  return child;
});

let shuttingDown = false;
let exitCode = 0;
let closedChildren = 0;

function signalChild(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;

  try {
    if (useProcessGroups) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

function shutdown(signal = "SIGTERM", code = exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  exitCode = code;

  for (const child of children) signalChild(child, signal);

  const forceStop = setTimeout(() => {
    for (const child of children) signalChild(child, "SIGKILL");
  }, 5_000);
  forceStop.unref();
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(`Unable to start the ${child.applicationName}: ${error.message}`);
    shutdown("SIGTERM", 1);
  });

  child.on("exit", (code, signal) => {
    closedChildren += 1;

    if (!shuttingDown) {
      const reason = signal ? `signal ${signal}` : `exit code ${code ?? 1}`;
      console.error(`${child.applicationName} stopped with ${reason}; stopping the other application.`);
      shutdown("SIGTERM", code ?? 1);
    }

    if (closedChildren === children.length) process.exit(exitCode);
  });
}

process.on("SIGINT", () => shutdown("SIGINT", 0));
process.on("SIGTERM", () => shutdown("SIGTERM", 0));
