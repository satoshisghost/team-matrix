import express from 'express';
import Event from '../models/Event.js';
import Team from '../models/Team.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all events for team
router.get('/:teamId', auth, async (req, res) => {
  try {
    const events = await Event.find({ team: req.params.teamId })
      .populate('attendees.player', 'name number position')
      .populate('createdBy', 'name')
      .sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create event
router.post('/:teamId', auth, async (req, res) => {
  try {
    const { title, type, date, endDate, location, address, notes, travelInfo, opponent, homeAway } = req.body;
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const allMembers = [...team.players];
    if (team.coach) allMembers.push(team.coach);
    const attendees = allMembers.map(p => ({ player: p, status: 'pending' }));

    const event = new Event({
      title, type, date, endDate, location, address, notes, travelInfo,
      opponent, homeAway,
      team: req.params.teamId,
      attendees,
      createdBy: req.userId
    });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// RSVP to event
router.put('/:eventId/rsvp', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const attendee = event.attendees.find(a => a.player.toString() === req.userId);
    if (attendee) {
      attendee.status = status;
    } else {
      event.attendees.push({ player: req.userId, status });
    }
    await event.save();
    const populated = await Event.findById(event._id).populate('attendees.player', 'name number position');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Check in player to event
router.put('/:eventId/checkin/:playerId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const attendee = event.attendees.find(a => a.player.toString() === req.params.playerId);
    if (attendee) {
      attendee.checkedIn = !attendee.checkedIn;
      attendee.checkedInAt = attendee.checkedIn ? new Date() : null;
    }
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update event score
router.put('/:eventId/score', auth, async (req, res) => {
  try {
    const { scoreUs, scoreThem } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { scoreUs, scoreThem },
      { new: true }
    );
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete event
router.delete('/:eventId', auth, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.eventId);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
