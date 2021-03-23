const { Router } = require('express');
const Course = require('../models/course');
const router = Router();

router.get('/', (req, res) => {
  res.status(200);
  res.render('add.hbs', {
    title: 'Add course',
    isAdd: true,
  });
});

router.post('/', async (req, res) => {
  const { title, price, image } = req.body;
  // В req.body объект { title: 'Course', price: '100500', image: 'IMAGE' }
  // Пришло из инпутов по полям name
  const course = new Course(title, price, image);
  await course.save();
  res.redirect('/courses');
});

module.exports = router;
