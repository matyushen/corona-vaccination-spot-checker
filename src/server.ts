import { format } from "date-fns";
import { Request, Response } from "express";
import { checkSlots } from "./checkSlots";
const express = require("express");
const cron = require("node-cron");
const app = express();

let count = 1;

const task = cron.schedule("*/1 * * * *", async () => {
  console.log(`🚀 Running a #${count} cycle`);
  await checkSlots();
  count += 1;
  console.log(`💤 Sleeping at ${format(new Date(), "PPpp")}`);
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
  task.start();
});

app.listen(process.env.PORT);
