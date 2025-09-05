import { Router } from "express";
import { generateOptions, validateParams } from "../../shared/transport";

const router = Router();

router.get("/flights/search", (req, res) => {
  try {
    const p = validateParams(new URLSearchParams(req.query as any));
    const options = generateOptions("flight", p);
    res.json(options);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "invalid" });
  }
});

router.get("/trains/search", (req, res) => {
  try {
    const p = validateParams(new URLSearchParams(req.query as any));
    const options = generateOptions("train", p);
    res.json(options);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "invalid" });
  }
});

export default router;
