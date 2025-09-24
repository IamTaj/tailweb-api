const express = require('express');
const Assignment = require('../models/Assignment');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();


router.get('/', requireAuth, async (req, res) => {
  const { role, id } = req.user;
  const { status } = req.query;

  const query = {};
  if (role === 'student') query.status = 'Published';
  if (role === 'teacher') query.createdBy = id; 
  if (status) query.status = status;

  const list = await Assignment.find(query).sort({ createdAt: -1 }).lean();
  res.json(list);
});


router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, description, dueDate } = req.body || {};
  if (!title || !description || !dueDate) {
    return res.status(400).json({ message: 'title, description, dueDate are required' });
  }
  const assignment = await Assignment.create({
    title, description, dueDate, status: 'Draft', createdBy: req.user.id
  });
  res.status(201).json(assignment);
});


router.put('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const a = await Assignment.findById(req.params.id);
  if (!a) return res.status(404).json({ message: 'Not found' });
  if (a.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (a.status !== 'Draft') return res.status(400).json({ message: 'Only Draft can be edited' });

  const { title, description, dueDate } = req.body || {};
  if (title) a.title = title;
  if (description) a.description = description;
  if (dueDate) a.dueDate = dueDate;
  await a.save();

  res.json(a);
});


router.delete('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const a = await Assignment.findById(req.params.id);
  if (!a) return res.status(404).json({ message: 'Not found' });
  if (a.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (a.status !== 'Draft') return res.status(400).json({ message: 'Only Draft can be deleted' });
  await a.deleteOne();
  res.json(a);
});


router.post('/:id/publish', requireAuth, requireRole('teacher'), async (req, res) => {
  const a = await Assignment.findById(req.params.id);
  if (!a) return res.status(404).json({ message: 'Not found' });
  if (a.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (a.status !== 'Draft') return res.status(400).json({ message: 'Must be Draft to publish' });
  a.status = 'Published';
  await a.save();
  res.json(a);
});


router.post('/:id/complete', requireAuth, requireRole('teacher'), async (req, res) => {
  const a = await Assignment.findById(req.params.id);
  if (!a) return res.status(404).json({ message: 'Not found' });
  if (a.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  if (a.status !== 'Published') return res.status(400).json({ message: 'Must be Published to complete' });
  a.status = 'Completed';
  await a.save();
  res.json(a);
});

module.exports = router;