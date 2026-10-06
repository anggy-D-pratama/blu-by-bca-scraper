import { spawn, exec } from "node:child_process";
import fs from "node:fs";
import { closeSession, openSession } from "./client.js";

class Scraper {
    terminalProcess = null;

    constructor(config) {
        this.config = config;
        this.client = null;
    }

    async start() {
        const serverUrl = this.config.device;
        const port = Number(serverUrl.port_appium) || 4723;

        this.stopAppium({
            port,
        });
        await new Promise((r) => setTimeout(r, 5000));
        await this.startAppium({
            port,
        });

        const client = await openSession(this.config);
        await client.terminateApp("com.bcadigital.blu");
        await client.activateApp("com.bcadigital.blu");

        return this.client = client;
    }

    stopAppium = function ({
        port
    }) {
        if (this.terminalProcess) {
            try {
                process.kill(-this.terminalProcess.pid); // kill whole process group
                console.log("🛑 Appium terminal closed");
            } catch (e) {
                console.log("⚠️ Failed to kill Appium terminal:", e.message);
            }
            this.terminalProcess = null;
        }

        if (process.platform === "win32") {
            exec(
                'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :' + port + '\') do taskkill /F /PID %a',
                () => {
                    console.log("🛑 Appium stopped on " + port);
                }
            );
        } else {
            exec("lsof -ti:" + port + " | xargs kill -9", () => {
                console.log("🛑 Appium stopped on " + port);
            });
        }
    }

    startAppium = async function ({
        backgroundProcess = true,
        port
    }) {
        if (backgroundProcess) {
            return new Promise((resolve) => {
                const logStream = fs.createWriteStream("appium.log", { flags: "a" });

                this.terminalProcess = spawn("appium", ["-p", port], {
                    detached: true,
                    stdio: ["ignore", "pipe", "pipe"], // pipe stdout & stderr
                    shell: true,
                });

                // Redirect stdout and stderr to file
                this.terminalProcess.stdout.pipe(logStream);
                this.terminalProcess.stderr.pipe(logStream);

                this.terminalProcess.unref();
                console.log("🚀 Appium started (background, logs → appium.log)");

                setTimeout(resolve, 5000);
            });
        }

        return new Promise((resolve) => {
            if (process.platform === "win32") {
                this.terminalProcess = spawn("cmd", ["/c", "start", "cmd", "/k", "appium -p " + port], {
                    detached: true,
                    stdio: "ignore",
                });
            } else {
                this.terminalProcess = spawn("gnome-terminal", [
                    "--",
                    "bash",
                    "-c",
                    "appium -p " + port + "; exec bash",
                ], {
                    detached: true,
                    stdio: "ignore",
                });
            }

            if (this.terminalProcess) {
                this.terminalProcess.unref();
                console.log("🚀 Appium started in new terminal");
            }

            setTimeout(() => resolve(), 5000);
        });
    }
}

export { Scraper };