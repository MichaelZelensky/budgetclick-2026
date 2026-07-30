import { spawn } from "node:child_process";

const run = (command: string, args: string[]) =>
    new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, {
            shell: true,
            stdio: "inherit",
        });

        child.on("error", reject);

        child.on("exit", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${command} exited with code ${code}`));
            }
        });
    });

const waitForServer = async (url: string) => {
    for (let i = 0; i < 30; i++) {
        try {
            const response = await fetch(url);

            if (response.ok) {
                return;
            }
        } catch {
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Server did not start");
};

const main = async () => {
    await run("docker", [
        "run",
        "--rm",
        "--detach",
        "--name",
        "budgetclick-client-test",
        "--publish",
        "8080:80",
        "budgetclick-client",
    ]);

    try {
        await waitForServer("http://localhost:8080");

        const response = await fetch("http://localhost:8080");

        if (!response.ok) {
            throw new Error(`Unexpected status ${response.status}`);
        }

        const html = await response.text();

        if (!html.includes("BudgetClick")) {
            throw new Error("Unexpected response");
        }

        console.log("Startup test passed.");
    } finally {
        await run("docker", [
            "rm",
            "--force",
            "budgetclick-client-test",
        ]).catch(() => {});
    }
};

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});