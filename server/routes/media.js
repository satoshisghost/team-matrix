import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import Team from '../models/Team.js';
import { auth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|mov|avi|pdf|png|jpg|jpeg|gif|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    if (ext || mime) return cb(null, true);
    cb(new Error('Only videos, PDFs, and images are allowed'));
  }
});

// Upload playbook
router.post('/:teamId/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { title, description } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileType = 'pdf';
    if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) fileType = 'video';
    if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) fileType = 'image';
    const fileUrl = `/uploads/${req.file.filename}`;
    const team = await Team.findByIdAndUpdate(
      req.params.teamId,
      { $push: { playbooks: { title, description, fileUrl, fileType, uploadedBy: req.userId } } },
      { new: true }
    );
    res.json({ message: 'File uploaded', fileUrl, team });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all playbooks
router.get('/:teamId/playbooks', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate('playbooks.uploadedBy', 'name');
    res.json(team?.playbooks || []);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete playbook
router.delete('/:teamId/playbooks/:playbookId', auth, async (req, res) => {
  try {
    await Team.findByIdAndUpdate(req.params.teamId, {
      $pull: { playbooks: { _id: req.params.playbookId } }
    });
    res.json({ message: 'Playbook deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Email distribute
router.post('/:teamId/distribute', auth, async (req, res) => {
  try {
    const { subject, message, fileUrl } = req.body;
    const team = await Team.findById(req.params.teamId).populate('players', 'email name');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const emails = team.players.map(p => p.email).filter(Boolean);
    if (emails.length === 0) return res.status(400).json({ error: 'No player emails found' });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    await transporter.sendMail({
      from: `"${team.name} - Team Matrix" <${process.env.SMTP_USER}>`,
      to: emails.join(', '),
      subject: subject || `New content from ${team.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #00d4ff; margin: 0; font-size: 24px; letter-spacing: 3px;">TEAM MATRIX</h1>
            <p style="color: #7a7a9e; margin: 8px 0 0; font-size: 13px;">${team.name}</p>
          </div>
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #333;">${message || 'New content has been shared with the team.'}</p>
            ${fileUrl ? `<a href="${baseUrl}${fileUrl}" style="display: inline-block; padding: 12px 24px; background: #00d4ff; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">View Content</a>` : ''}
            <p style="font-size: 12px; color: #999; margin-top: 24px;">Sent via Team Matrix</p>
          </div>
        </div>
      `
    });
    res.json({ message: `Email sent to ${emails.length} team members`, recipients: emails });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// WhatsApp share link
router.post('/:teamId/whatsapp', auth, async (req, res) => {
  try {
    const { message, fileUrl } = req.body;
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fullUrl = fileUrl ? `${baseUrl}${fileUrl}` : '';
    const text = encodeURIComponent(`${message || 'Check this out!'}\n\n${fullUrl}`);
    res.json({ whatsappUrl: `https://wa.me/?text=${text}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
