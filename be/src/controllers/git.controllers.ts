import type { Request, Response } from "express";
import { uploadtoServer } from "../helpers/upload.js";

export const githubWebhook = async (req: Request, res: Response) => {
  const repo = req.body.repository.clone_url;
  const branch = req.body.ref.replace("refs/heads/", "");

  console.log("Push detected:", repo, branch);

  await uploadtoServer(repo);

  res.status(200).send("Deployment triggered");
};
