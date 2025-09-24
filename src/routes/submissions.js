const express = require('express');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/:assignmentId', requireAuth, requireRole('student'), async (req, res) => {
  const { assignmentId } = req.params;
  const { answer } = req.body || {};
  if (!answer) return res.status(400).json({ message: 'answer is required' });

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  if (assignment.status !== 'Published') {
    return res.status(400).json({ message: 'Submissions allowed only for Published assignments' });
  }

  const sub = await Submission.create({
    assignmentId,
    studentId: req.user.id,
    studentName: req.user.name,
    answer
  });

  res.status(201).json(sub);
});

router.get('/my/:assignmentId', requireAuth, requireRole('student'), async (req, res) => {
  const sub = await Submission.findOne({
    assignmentId: req.params.assignmentId,
    studentId: req.user.id
  }).lean();
  if (!sub) return res.status(404).json({ message: 'No submission' });
  res.json(sub);
});

router.get('/assignment/:assignmentId', requireAuth, requireRole('teacher'), async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId).lean();
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  if (assignment.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  const list = await Submission.find({ assignmentId: assignment._id }).lean();
  const enriched = list.map(s => ({ ...s, assignmentTitle: assignment.title }));
  res.json(enriched);
});

router.post('/:id/review', requireAuth, requireRole('teacher'), async (req, res) => {
  const { reviewed } = req.body || {};
  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });

  const assignment = await Assignment.findById(sub.assignmentId).lean();
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  if (assignment.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  sub.reviewed = Boolean(reviewed);
  await sub.save();
  const enriched = { ...sub.toObject(), assignmentTitle: assignment.title };
  res.json(enriched);
});

router.post('/:id/mark', requireAuth, requireRole('teacher'), async (req, res) => {
  const { mark } = req.body || {};
  if (mark == null || Number.isNaN(Number(mark))) {
    return res.status(400).json({ message: 'mark is required and must be a number' });
  }
  const bounded = Math.max(0, Math.min(100, Number(mark)));

  const sub = await Submission.findById(req.params.id);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });

  const assignment = await Assignment.findById(sub.assignmentId).lean();
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  if (assignment.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

  sub.mark = bounded;
  await sub.save();
  const enriched = { ...sub.toObject(), assignmentTitle: assignment.title };
  res.json(enriched);
});

router.get('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const assignments = await Assignment.find({ createdBy: req.user.id }).select('_id title').lean();
  const map = new Map(assignments.map(a => [a._id.toString(), a.title]));
  const ids = assignments.map(a => a._id);
  const list = await Submission.find({ assignmentId: { $in: ids } }).lean();
  const enriched = list.map(s => ({ ...s, assignmentTitle: map.get(s.assignmentId.toString()) || '' }));
  res.json(enriched);
});

module.exports = router;