import { spawn } from "node:child_process";
import path from "node:path";

const repoDir = path.resolve(import.meta.dirname, "..");

async function run(
    command: string,
    args: string[],
    cwd: string,
): Promise<void> {
    await new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            stdio: "inherit",
            shell: true,
        });

        child.on("exit", (code) => {
            if (code === 0) {
                resolve(undefined);
            } else {
                reject(new Error(`${command} exited with code ${code}`));
            }
        });

        child.on("error", reject);
    });
}

async function main(): Promise<void> {
    console.log("Generating schemas and validators...");
    await run("pnpm", ["generate-schemas"], path.join(repoDir, "client"));

    console.log();
    console.log("Building client...");
    await run("pnpm", ["build"], path.join(repoDir, "client"));

    console.log();
    console.log("Build completed.");
}

main().catch((error) => {
    console.error();
    console.error(error);
    process.exit(1);
});
