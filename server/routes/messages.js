import express from 'express';
import Message from '../models/Message.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:teamId', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await Message.find({ team: req.params.teamId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(messages.reverse());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:teamId', auth, async (req, res) => {
  try {
    const { text, fileUrl, fileType } = req.body;
    const message = new Message({ team: req.params.teamId, sender: req.userId, text, fileUrl, fileType });
    await message.save();
    const populated = await Message.findById(message._id).populate('sender', 'name avatar role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:messageId/pin', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { pinned: !req.body.pinned },
      { new: true }
    );
    res.json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
