import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { isDBConnected } from "../config/database.js";
import { sendUserNotification } from "../services/notifications.js";
import { TwoFactorChallenge } from "../models/TwoFactorChallenge.js";
import { sendResendEmail } from "../utils/resend.js";
import { createHash } from "node:crypto";
import type { AuthRequest } from "../utils/jwt.js";
import {
  FRONTEND_URL,
  GITHUB_CALLBACK_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  isProd,
} from "../constants/e.js";
import { incrementUserHeatmap } from "../services/heatmap.js";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

async function createTwoFactorChallenge(
  userId: string,
  purpose: "enable" | "login",
  destination: string,
): Promise<string> {
  const code = generateOtp();
  await TwoFactorChallenge.deleteMany({ userId, purpose });
  await TwoFactorChallenge.create({
    userId,
    purpose,
    destination,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
  return code;
}

/**
 * Initiate GitHub OAuth flow
 * Redirects user to GitHub authorization page
 */
export const githubLogin = (req: Request, res: Response): any => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({
      success: false,
      message: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID",
    });
  }

  // Scopes needed: repo access and webhook management
  const scopes = ["repo", "admin:repo_hook", "user:email"];
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=${scopes.join(" ")}`;

  res.redirect(githubAuthUrl);
};

/**
 * GitHub OAuth callback
 * Exchanges code for access token and creates/updates user
 */
export const githubCallback = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/auth/error?message=No code provided`);
  }

  if (!isDBConnected()) {
    return res.redirect(
      `${FRONTEND_URL}/auth/error?message=Database not connected`,
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as any;

    if (tokenData.error || !tokenData.access_token) {
      console.error("GitHub OAuth error:", tokenData);
      return res.redirect(
        `${FRONTEND_URL}/auth/error?message=${encodeURIComponent(tokenData.error_description || "Failed to get access token")}`,
      );
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    const githubUser = (await userResponse.json()) as any;

    if (!githubUser.id) {
      return res.redirect(
        `${FRONTEND_URL}/auth/error?message=Failed to get user info`,
      );
    }

    // Create or update user in database
    let user = await User.findOne({ githubId: String(githubUser.id) });

    if (user) {
      // Update existing user
      user.username = githubUser.login;
      user.email = githubUser.email;
      user.avatarUrl = githubUser.avatar_url;
      user.accessToken = accessToken;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        githubId: String(githubUser.id),
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        accessToken: accessToken,
        lastLoginAt: new Date(),
      });
    }

    // Generate JWT for our app
    if (user.twoFactorEnabled) {
      const destination = user.twoFactorEmail || user.email;

      if (!destination) {
        return res.redirect(
          `${FRONTEND_URL}/auth/error?message=${encodeURIComponent("Two-factor authentication is enabled but no email is set.")}`,
        );
      }

      const code = await createTwoFactorChallenge(
        user._id.toString(),
        "login",
        destination,
      );

      if (isProd) {
        try {
          await sendResendEmail({
            to: destination,
            subject: "Your Hostify login code",
            text: `Your Hostify verification code is ${code}. It expires in 10 minutes.`,
          });
        } catch (emailError) {
          console.error("2FA email send failed:", emailError);
          return res.redirect(
            `${FRONTEND_URL}/auth/error?message=${encodeURIComponent("Failed to send verification code. Please try again.")}`,
          );
        }
      } else {
        console.info(
          `[LOCAL 2FA] Verification code for ${destination}: ${code}`,
        );
      }

      const tempToken = generateToken(
        {
          userId: user._id.toString(),
          githubId: user.githubId,
          username: user.username,
          twoFactorPending: true,
          twoFactorPurpose: "login",
        },
        { expiresIn: "10m" },
      );

      return res.redirect(
        `${FRONTEND_URL}/auth/success?twoFactor=required&token=${tempToken}`,
      );
    }

    const token = generateToken({
      userId: user._id.toString(),
      githubId: user.githubId,
      username: user.username,
    });

    // Fire-and-forget login notification
    setImmediate(() => {
      void sendUserNotification({
        userId: user._id.toString(),
        type: "security",
        subject: "You signed in to Hostify",
        text: "If this wasn't you, rotate your tokens and review recent activity.",
        templateContext: {
          username: user.username,
          ...(user.email ? { details: `Signed in as ${user.email}` } : {}),
          ctaUrl: `${FRONTEND_URL}/settings`,
        },
        loggerContext: { source: "auth-login" },
      });
    });

    await incrementUserHeatmap(user._id);

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.redirect(
      `${FRONTEND_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`,
    );
  }
};

/**
 * Get current authenticated user info
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const authReq = req as any; // Has user from authenticate middleware

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    const user = await User.findById(authReq.user.userId).select(
      "-accessToken -refreshToken",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        twoFactorEnabled: !!user.twoFactorEnabled,
        twoFactorEmail: user.twoFactorEmail,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user info",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Logout user (client should delete token)
 */
export const logout = (req: Request, res: Response): any => {
  const authReq = req as any;

  if (authReq.user?.userId) {
    void sendUserNotification({
      userId: authReq.user.userId,
      type: "security",
      subject: "You signed out of Hostify",
      text: "If this wasn't you, rotate your tokens and review recent activity.",
      templateContext: {
        username: authReq.user.username,
        ...(authReq.user.email
          ? { details: `Signed out from ${authReq.user.email}` }
          : {}),
        ctaUrl: `${FRONTEND_URL}/settings`,
      },
      loggerContext: { source: "auth-logout" },
    });
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully. Please delete your token.",
  });
};

export const verifyTwoFactorLogin = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    if (!req.user?.twoFactorPending || req.user.twoFactorPurpose !== "login") {
      return res.status(400).json({
        success: false,
        message: "No pending two-factor verification.",
      });
    }

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database not connected",
      });
    }

    const code = (req.body?.code || "").toString().trim();
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const challenge = await TwoFactorChallenge.findOne({
      userId: req.user.userId,
      purpose: "login",
      consumed: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: "No active verification code. Please request a new one.",
      });
    }

    if (challenge.codeHash !== hashCode(code)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    await TwoFactorChallenge.updateOne(
      { _id: challenge._id },
      { $set: { consumed: true } },
    );

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const fullToken = generateToken({
      userId: user._id.toString(),
      githubId: user.githubId,
      username: user.username,
    });

    await incrementUserHeatmap(user._id);

    return res.status(200).json({ success: true, token: fullToken });
  } catch (error) {
    console.error("Verify 2FA login error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify code",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
