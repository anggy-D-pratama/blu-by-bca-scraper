import fs from "fs";
import pathModule from "path";
import FormData from "form-data";
import sharp from "sharp";

import { BANKCODE, ACCOUNT_NUMBER } from "../config/index.js";
import { axios } from "../config/axios.js";
import { WD_STATUS } from "../config/constants/withdrawStatus.js";
let count_bank_transactions = 0;

async function getCountBT() {
  return count_bank_transactions;
}

async function setCountBT() {
  count_bank_transactions = count_bank_transactions + 1;
}

async function sendTelegram(msg, is_photo = "false", is_file = "false") {
  try {
    await axios.post("/telegram/send", {
      account_number: ACCOUNT_NUMBER,
      text: msg,
      is_photo: is_photo,
      is_file: is_file,
    });
    await new Promise((r) => setTimeout(r, 1000));
  } catch (e) {
    console.error(e);
  }
}

async function screenshot(client, path) {
  try {
    // await client.waitForTimeout(1000); // Wait for any final rendering
    await client.saveScreenshot(path);

    // Load original buffer once
    let inputBuffer = await fs.promises.readFile(path);
    let quality = 80;
    let buffer = await sharp(inputBuffer)
      .png({ quality, compressionLevel: 9 })
      .toBuffer();

    while (buffer.length > 100 * 1024 && quality > 10) {
      quality -= 10;
      buffer = await sharp(inputBuffer)
        .png({ quality, compressionLevel: 9 })
        .toBuffer();
    }

    // Overwrite with compressed image
    await sharp(buffer).toFile(path);

    const formData = new FormData();
    const fileStream = fs.createReadStream(path);
    formData.append("file", fileStream, {
      filename: pathModule.basename(path),
      contentType: "image/png",
    });
    formData.append("account_number", ACCOUNT_NUMBER);

    await axios.post("/telegram/save-image", formData, {
      headers: formData.getHeaders(),
    });
  } catch (error) {
    console.error("Error taking screenshot:", error);
  }
}

async function handleElementError(err, client, defaultStatus = WD_STATUS.FAILED) {
  if (err.message.match(/not displayed|not found|no such element/i)) {
    // TAKE SS
    const time = new Date().toISOString().replace(/:/g, '-');
    await screenshot(client, `./screenshot/${time}.png`);
    // SEND NOTIF
  }
  throw err;
}

async function swipeSmall(client, deltaX, deltaY, duration = 200) {
  const { width, height } = await client.getWindowRect();
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);

  await client.performActions([
    {
      type: "pointer",
      id: "finger1",
      parameters: { pointerType: "touch" },
      actions: [
        { type: "pointerMove", duration: 0, x: startX, y: startY },
        { type: "pointerDown", button: 0 },
        { type: "pause", duration: 50 },
        {
          type: "pointerMove",
          duration,
          x: startX + deltaX,
          y: startY + deltaY,
        },
        { type: "pointerUp", button: 0 },
      ],
    },
  ]);
}

export {
  sendTelegram,
  screenshot,
  getCountBT,
  setCountBT,
  handleElementError,
  swipeSmall,
};
