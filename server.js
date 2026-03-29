const express = require("express");
const Redis = require("ioredis");

const app = express();
app.use(express.json());

const redis = new Redis();

let totalSeats = 100;

// BOOK API
app.post("/api/book", async (req, res) => {
  const seat = req.body.seat;

  if (!seat) return res.status(400).json({ error: "Seat required" });

  const lockKey = `lock:${seat}`;

  // TRY LOCK
  const isLocked = await redis.set(lockKey, "locked", "NX", "EX", 5);

  if (!isLocked) {
    return res.json({ success: false, message: "Seat already booked" });
  }

  // Check if seat already booked
  const exists = await redis.get(`seat:${seat}`);
  if (exists) {
    return res.json({ success: false, message: "Seat taken" });
  }

  // Book seat
  await redis.set(`seat:${seat}`, "booked");

  totalSeats--;

  res.json({
    success: true,
    bookingId: Date.now(),
    remaining: totalSeats,
  });
});

// GET remaining seats
app.get("/api/seats", (req, res) => {
  res.json({ remaining: totalSeats });
});

// SERVER
app.listen(3000, () => {
  console.log("Booking system running on port 3000");
});
