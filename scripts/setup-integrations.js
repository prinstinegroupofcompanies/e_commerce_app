/**
 * One-command setup for Markay Hall notifications (Twilio SMS + Web Push).
 * Run: npm run setup:integrations
 */
const fs = require("fs");
const path = require("path");
const webpush = require("web-push");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

function readEnvFile(file) {
  if (!fs.existsSync(file)) return "";
  return fs.readFileSync(file, "utf8");
}

function upsertEnvKey(content, key, value) {
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) {
    return content.replace(re, line);
  }
  return `${content.trimEnd()}\n${line}\n`;
}

function main() {
  const keys = webpush.generateVAPIDKeys();
  let env = readEnvFile(envPath);

  if (!env && fs.existsSync(examplePath)) {
    env = readEnvFile(examplePath);
    console.log("Created .env from .env.example");
  }

  env = upsertEnvKey(env, "NEXT_PUBLIC_VAPID_PUBLIC_KEY", keys.publicKey);
  env = upsertEnvKey(env, "VAPID_PRIVATE_KEY", keys.privateKey);
  if (!/^VAPID_SUBJECT=/m.test(env)) {
    env = upsertEnvKey(env, "VAPID_SUBJECT", "mailto:admin@markayhall.local");
  }

  fs.writeFileSync(envPath, env);

  console.log("\n✅ Web Push (VAPID) keys written to .env\n");
  console.log("📱 Twilio SMS (recommended for Liberia +231):");
  console.log("   1. Create account: https://www.twilio.com/try-twilio");
  console.log("   2. Get a phone number with SMS capability");
  console.log("   3. Add to .env:");
  console.log('      TWILIO_ACCOUNT_SID="AC..."');
  console.log('      TWILIO_AUTH_TOKEN="..."');
  console.log('      TWILIO_FROM_NUMBER="+1..."');
  console.log("\n💳 Optional — Flutterwave (Orange/MTN via one API):");
  console.log('      FLUTTERWAVE_SECRET_KEY="FLWSECK_..."');
  console.log('      NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_..."');
  console.log("\nRestart the dev server after updating .env.\n");
}

main();
