const { Router } = require('express');
const Course = require('../models/course');
const Cart = require('../models/cart');
const router = Router();

router.get('/', async (req, res) => {
  const courses = await Course.getAll();
  res.status(200);
  res.render('courses.hbs', {
    title: 'Courses',
    isCourses: true,
    courses,
  });
});

router.get('/:id/edit', async (req, res) => {
  if (!req.query.allow) {
    return res.redirect('/');
  }
  const course = await Course.getById(req.params.id);
  res.render('course-edit.hbs', { course });
});

router.post('/edit', async (req, res) => {
  await Course.update(req.body);
  res.redirect('/courses');
});

router.get('/:id', async (req, res) => {
  const course = await Course.getById(req.params.id);
  res.render('course', {
    layout: 'empty',
    title: `Course: ${course.title}`,
    course,
  });
});

module.exports = router;
