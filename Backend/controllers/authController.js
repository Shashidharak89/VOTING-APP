const User = require("../models/User");
const transporter = require("./mailer");
const Settings = require("../models/Settings");
const jwt = require("jsonwebtoken");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configurable OTP expiry (minutes); default extended from 10 to 30
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "30", 10);

exports.requestOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    console.log("[auth][requestOTP] 400 missing email");
    return res.status(400).json({ message: "Email required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@nmamit\.in$/i.test(normalizedEmail)) {
    console.log("[auth][requestOTP] 400 invalid email domain", { email });
    return res.status(400).json({ message: "Email must end with @nmamit.in" });
  }

  // Check votingEnabled flag
  const settings = await Settings.getSettings();
  if (!settings.votingEnabled) {
    return res.status(403).json({ message: "Voting has not started yet." });
  }

  let user = await User.findOne({ email });
  if (user && user.hasVoted) {
    console.log("[auth][requestOTP] 403 already voted", { email });
    return res.status(403).json({ message: "You have already voted. OTP not sent." });
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000); // configurable minutes
  if (!user) user = new User({ email });
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Voting OTP",
      text: `Your OTP for voting is: ${otp}`,
    });
    console.log("[auth][requestOTP] 200 OTP sent", { email, expires: otpExpires.toISOString() });
    res.json({ message: "OTP sent to email." });
  } catch (err) {
    console.error("[mailer] sendMail error:", err);
    res.status(500).json({ message: "Failed to send OTP email. Please try again." });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpires < new Date()) {
    console.log("[auth][verifyOTP] 400 invalid/expired otp", { email, providedOtp: otp, userExists: !!user });
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }
  user.otp = null;
  user.otpExpires = null;
  await user.save();
  const token = jwt.sign({ email: user.email, uid: user._id }, process.env.JWT_SECRET || "devsecret", {
    expiresIn: "2h",
  });
  console.log("[auth][verifyOTP] 200 otp verified", { email });
  res.json({ message: "OTP verified.", token });
};
