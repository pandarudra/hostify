#!/usr/bin/env node

/**
 * Test script for GitHub webhook
 *
 * Usage:
 *   node test-webhook.js <backend-url> <repo-url> [webhook-secret]
 *
 * Example:
 *   node test-webhook.js http://localhost:3000 https://github.com/username/repo.git mywebhooksecret
 */

import crypto from "crypto";

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(
    "Usage: node test-webhook.js <backend-url> <repo-url> [webhook-secret]",
  );
  console.error(
    "Example: node test-webhook.js http://localhost:3000 https://github.com/username/repo.git mywebhooksecret",
  );
  process.exit(1);
}

const [backendUrl, repoUrl, webhookSecret] = args;

// Create mock webhook payload
const payload = {
  ref: "refs/heads/main",
  repository: {
    name: "test-repo",
    full_name: "username/test-repo",
    clone_url: repoUrl,
    html_url: repoUrl.replace(".git", ""),
  },
  pusher: {
    name: "test-user",
    email: "test@example.com",
  },
  commits: [
    {
      id: "1234567890abcdef",
      message: "Test commit for auto-redeploy",
      timestamp: new Date().toISOString(),
      author: {
        name: "Test User",
        email: "test@example.com",
      },
    },
  ],
  head_commit: {
    id: "1234567890abcdef",
    message: "Test commit for auto-redeploy",
  },
};

const payloadJson = JSON.stringify(payload);

// Generate signature if webhook secret is provided
let signature;
if (webhookSecret) {
  const hmac = crypto.createHmac("sha256", webhookSecret);
  const digest = hmac.update(payloadJson).digest("hex");
  signature = `sha256=${digest}`;
  console.log("🔐 Generated signature for webhook authentication");
} else {
  console.log(
    "⚠️  No webhook secret provided - signature verification will be skipped",
  );
}

// Prepare headers
const headers = {
  "Content-Type": "application/json",
  "X-GitHub-Event": "push",
  "X-GitHub-Delivery": crypto.randomUUID(),
  "User-Agent": "GitHub-Hookshot/test",
};

if (signature) {
  headers["X-Hub-Signature-256"] = signature;
}

console.log(
  "\n📤 Sending test webhook to:",
  `${backendUrl}/int/api/v1/webhook/gh`,
);
console.log("📦 Payload:");
console.log(JSON.stringify(payload, null, 2));
console.log("\n🚀 Triggering webhook...\n");

// Send webhook request
fetch(`${backendUrl}/int/api/v1/webhook/gh`, {
  method: "POST",
  headers,
  body: payloadJson,
})
  .then(async (response) => {
    console.log(
      `📨 Response status: ${response.status} ${response.statusText}`,
    );

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("\n📋 Response body:");
      console.log(JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("\n✅ Webhook test successful!");

        if (data.results && data.results.length > 0) {
          console.log("\n🎯 Deployment Results:");
          data.results.forEach((result, index) => {
            const status = result.success ? "✅" : "❌";
            console.log(`  ${index + 1}. ${status} ${result.subdomain}`);
            if (result.success) {
              console.log(`     URL: ${result.url}`);
            } else {
              console.log(`     Error: ${result.error}`);
            }
          });
        }

        if (data.summary) {
          console.log("\n📊 Summary:");
          console.log(`   Total: ${data.summary.total}`);
          console.log(`   Successful: ${data.summary.successful}`);
          console.log(`   Failed: ${data.summary.failed}`);
        }
      } else {
        console.log("\n❌ Webhook test failed!");
        if (data.message) {
          console.log(`   Message: ${data.message}`);
        }
      }
    } else {
      const text = await response.text();
      console.log("\n📋 Response body:");
      console.log(text);
    }
  })
  .catch((error) => {
    console.error("\n❌ Error sending webhook:");
    console.error(error.message);
    process.exit(1);
  });
