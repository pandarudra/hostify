import mongoose from "mongoose";
import { User } from "../src/models/User.js";
import { Deployment } from "../src/models/Deployment.js";
import {
  CF_ACCOUNT_ID,
  CF_API_TOKEN,
  CF_KV_NAMESPACE_ID,
} from "../src/constants/e.js";
import readline from "readline";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/hostify";

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function clearMongoDB() {
  console.log("\n🗑️  Clearing MongoDB...");

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Get counts before deletion
    const userCount = await User.countDocuments();
    const deploymentCount = await Deployment.countDocuments();

    console.log(`\n📊 Current counts:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Deployments: ${deploymentCount}`);

    if (userCount === 0 && deploymentCount === 0) {
      console.log("\n✓ MongoDB is already empty!");
      return;
    }

    // Delete all documents
    const userResult = await User.deleteMany({});
    const deploymentResult = await Deployment.deleteMany({});

    console.log(`\n✓ Deleted ${userResult.deletedCount} users`);
    console.log(`✓ Deleted ${deploymentResult.deletedCount} deployments`);
    console.log("✓ MongoDB cleaned successfully!");
  } catch (error) {
    console.error("❌ MongoDB cleanup error:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

async function clearCloudflareKV() {
  console.log("\n🗑️  Clearing Cloudflare KV...");

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_KV_NAMESPACE_ID) {
    console.log(
      "⚠️  Cloudflare KV credentials not configured. Skipping KV cleanup.",
    );
    return;
  }

  try {
    // List all keys in the namespace
    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/keys`;

    const response = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list KV keys: ${await response.text()}`);
    }

    const data = (await response.json()) as {
      result: Array<{ name: string }>;
      success: boolean;
    };

    if (!data.success || !data.result) {
      throw new Error("Failed to retrieve KV keys");
    }

    const keys = data.result.map((k) => k.name);

    console.log(`\n📊 Found ${keys.length} keys in Cloudflare KV`);

    if (keys.length === 0) {
      console.log("✓ Cloudflare KV is already empty!");
      return;
    }

    // Delete keys in batches
    console.log("\n🗑️  Deleting KV keys...");
    let deletedCount = 0;

    for (const key of keys) {
      const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;

      const deleteResponse = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
        },
      });

      if (deleteResponse.ok) {
        deletedCount++;
        if (deletedCount % 10 === 0) {
          console.log(`   Deleted ${deletedCount}/${keys.length} keys...`);
        }
      } else {
        console.warn(`   ⚠️  Failed to delete key: ${key}`);
      }
    }

    console.log(
      `\n✓ Deleted ${deletedCount}/${keys.length} keys from Cloudflare KV`,
    );
    console.log("✓ Cloudflare KV cleaned successfully!");
  } catch (error) {
    console.error("❌ Cloudflare KV cleanup error:", error);
    throw error;
  }
}

async function main() {
  console.log("\n⚠️  ═══════════════════════════════════════════════════════");
  console.log("⚠️  WARNING: COMPLETE DATA CLEANUP");
  console.log("⚠️  ═══════════════════════════════════════════════════════");
  console.log("\nThis script will:");
  console.log("  1. Delete ALL users from MongoDB");
  console.log("  2. Delete ALL deployments from MongoDB");
  console.log("  3. Delete ALL keys from Cloudflare KV");
  console.log("\n❌ THIS CANNOT BE UNDONE! ❌\n");

  const answer = await question(
    'Type "DELETE EVERYTHING" to confirm (or anything else to cancel): ',
  );

  if (answer.trim() !== "DELETE EVERYTHING") {
    console.log("\n✓ Cleanup cancelled. No data was deleted.");
    rl.close();
    process.exit(0);
  }

  console.log("\n🚨 Starting cleanup process...\n");

  try {
    // Clear MongoDB
    await clearMongoDB();

    // Clear Cloudflare KV
    await clearCloudflareKV();

    console.log("\n✅ ═══════════════════════════════════════════════════════");
    console.log("✅ CLEANUP COMPLETE!");
    console.log("✅ ═══════════════════════════════════════════════════════");
    console.log("\nAll data has been successfully deleted.");
    console.log("Your system is now in a clean state.\n");
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
