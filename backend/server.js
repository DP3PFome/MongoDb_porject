const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB pieslegt!"))
  .catch(err => console.error("MongoDB error:", err));

// Models
const User = mongoose.model("User", {
  username: String,
  password: String
});

const Task = mongoose.model("Task", {
  userId: String,
  text: String,
  description: String,
  completed: Boolean
});

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Nav tokena" });

  try {
    const decoded = jwt.verify(token, "secret");
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ message: "Nederīgs token" });
  }
}

// Routes
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: "Lietotājvārds aizņemts" });

  const user = new User({ username, password });
  await user.save();
  res.json({ message: "Reģistrēts" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || user.password !== password)
    return res.status(400).json({ message: "Nepareizi dati" });

  const token = jwt.sign({ userId: user._id }, "secret");
  res.json({ token });
});

app.get("/tasks", auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.userId });
  res.json(tasks);
});

app.post("/tasks", auth, async (req, res) => {
  const task = new Task({ ...req.body, userId: req.userId });
  await task.save();
  res.json(task);
});

app.put("/tasks/:id", auth, async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
  res.json(task);
});

app.delete("/tasks/:id", auth, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: "Dzēsts" });
});

app.listen(PORT, () => {
  console.log(`Serveris darbojas uz http://localhost:${PORT}`);
});
const path = require('path');

// Статические файлы из frontend/
app.use(express.static(path.join(__dirname, '../frontend')));

// Если явно запросили '/', отдай index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
