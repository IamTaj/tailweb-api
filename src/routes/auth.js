const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

const router = express.Router()

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body || {}
  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ message: "name, email, password, role are required" })
  }
  if (!["teacher", "student"].includes(role)) {
    return res.status(400).json({ message: "role must be teacher or student" })
  }

  const exists = await User.findOne({ email }).lean()
  if (exists)
    return res.status(409).json({ message: "Email already registered" })

  const user = await User.create({ name, email, password, role })
  return res
    .status(201)
    .json({ id: user._id, name: user.name, email: user.email, role: user.role })
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" })

  const userDoc = await User.findOne({ email }).select("+password name email role").exec()
  if (!userDoc) return res.status(401).json({ message: "Invalid credentials" })

  const isMatch = await userDoc.comparePassword(password)
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" })

  const token = jwt.sign(
    { id: userDoc._id, role: userDoc.role, name: userDoc.name, email: userDoc.email },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  )

  res.json({
    token,
    role: userDoc.role,
    user: { id: userDoc._id, name: userDoc.name, email: userDoc.email, role: userDoc.role }
  })
})

module.exports = router
