import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({
  input,
  output,
});

try {
  console.log("\nHANDOFF manifest migration\n");

  const oldUrlRaw = await rl.question(
    "Paste the FULL URL of your existing successful HANDOFF:\n> ",
  );

  const productionUrlRaw = await rl.question(
    "\nPaste the URL of your LATEST Vercel deployment / production site:\n> ",
  );

  const oldUrl = new URL(oldUrlRaw.trim());
  const productionUrl = new URL(productionUrlRaw.trim());

  const params = oldUrl.searchParams;

  const appliance =
    params.get("appliance") || "Refurbished appliance";

  const originalAudioUrl =
    params.get("originalAudioUrl");

  const translatedAudioUrl =
    params.get("translatedAudioUrl") ||
    params.get("spanishAudioUrl");

  const transcriptUrl =
    params.get("transcriptUrl");

  const sourceLanguage =
    params.get("sourceLanguage") || "en";

  const targetLanguage =
    params.get("targetLanguage") || "es";

  if (!originalAudioUrl) {
    throw new Error(
      "The old HANDOFF URL does not contain originalAudioUrl.",
    );
  }

  if (!translatedAudioUrl) {
    throw new Error(
      "The old HANDOFF URL does not contain translatedAudioUrl/spanishAudioUrl.",
    );
  }

  if (!transcriptUrl) {
    throw new Error(
      "The old HANDOFF URL does not contain transcriptUrl.",
    );
  }

  console.log("\nFetching existing readable HANDOFF...");

  const transcriptResponse =
    await fetch(transcriptUrl);

  if (!transcriptResponse.ok) {
    throw new Error(
      `Could not fetch transcript (${transcriptResponse.status}).`,
    );
  }

  const transcript =
    await transcriptResponse.json();

  const sourceText =
    transcript?.sourceText;

  const translatedText =
    transcript?.translatedText;

  if (
    typeof sourceText !== "string" ||
    !sourceText.trim() ||
    typeof translatedText !== "string" ||
    !translatedText.trim()
  ) {
    throw new Error(
      "The transcript file does not contain both sourceText and translatedText.",
    );
  }

  console.log("Creating durable HANDOFF manifest...");

  const manifestResponse = await fetch(
    new URL(
      "/api/handoff/manifest",
      productionUrl.origin,
    ),
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        appliance,
        sourceLanguage,
        targetLanguage,
        originalAudioUrl,
        translatedAudioUrl,
        sourceText,
        translatedText,
      }),
    },
  );

  const manifestData =
    await manifestResponse.json();

  if (
    !manifestResponse.ok ||
    !manifestData.id
  ) {
    throw new Error(
      `Manifest creation failed (${manifestResponse.status}): ${
        manifestData?.error ||
        JSON.stringify(manifestData)
      }`,
    );
  }

  const id =
    manifestData.id;

  const recipientUrl =
    new URL(
      `/h/${id}`,
      productionUrl.origin,
    ).toString();

  const tagUrl =
    new URL(
      `/tag/${id}`,
      productionUrl.origin,
    ).toString();

  console.log("\n✅ DURABLE HANDOFF CREATED\n");
  console.log(`ID:\n${id}\n`);
  console.log(`Recipient:\n${recipientUrl}\n`);
  console.log(`Printable tag:\n${tagUrl}\n`);
} catch (error) {
  console.error(
    "\n❌ Migration failed:",
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
} finally {
  rl.close();
}
