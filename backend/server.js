const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());


// ================= MONGODB CONNECTION =================
mongoose.connect(
  "mongodb+srv://skillsync:skillsync123@cluster0.lsa4hze.mongodb.net/skillsync?retryWrites=true&w=majority"
)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("MongoDB Connection Error ❌", err));

app.get("/", (req, res) => {
  res.send("SkillSync Backend Running 🚀");
});


// ================= REGISTER =================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.json({ message: "User registered successfully" });

  } catch (error) {
    console.log("REGISTER ERROR 👉", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= LOGIN =================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      name: user.name
    });

  } catch (error) {
    console.log("LOGIN ERROR 👉", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= EMAIL TRANSPORTER =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sharathachar33@gmail.com",
    pass: "qjjv dnnp rvzs xrvl"   // 🔥 Replace with Gmail App Password
  }
});


// ================= FORGOT PASSWORD =================
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.tokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetLink = `https://abcd1234.ngrok-free.app/reset.html?token=${resetToken}`;

    await transporter.sendMail({
      from: "skillsyncproject@gmail.com",
      to: email,
      subject: "SkillSync Password Reset",
      html: `
        <h3>Password Reset Request</h3>
        <p>Click below link to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    res.json({ message: "Reset link sent to email" });

  } catch (error) {
    console.log("FORGOT PASSWORD route hit!");
    res.status(500).json({ message: "Server error" });
  }
});


// ================= RESET PASSWORD =================
app.post("/api/reset-password", async (req, res) => {
  try {
    console.log("Incoming body 👉", req.body);

    const { token, newPassword } = req.body;

    console.log("Token received 👉", token);
    console.log("Password received 👉", newPassword);

    const user = await User.findOne({
      resetToken: token,
      tokenExpiry: { $gt: Date.now() }
    });

    console.log("User found 👉", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.tokenExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.log("RESET ERROR 👉", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= START SERVER =================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
