require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');

const Contact = require('./models/Contact');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Save contact to database
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    // Prepare email options
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.OWNER_EMAIL,
      subject: '📨 New Contact Form Message',
      html: `
        <h2>New Message Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ Email error:', err);
        return res.status(500).json({ success: false, message: 'Failed to send email' });
      } else {
        console.log('✅ Email sent:', info.response);
        return res.status(200).json({ success: true, message: 'Message sent and stored successfully' });
      }
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
