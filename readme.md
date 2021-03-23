# Section 3: Практика: Express.js

## 35. Динамическое изменение корзины

```js
// /public/app.js
const $cart = document.querySelector('#cart');
if ($cart) {
  $cart.addEventListener('click', event => {
    // <button class="js-remove" ...
    if (event.target.classList.contains('js-remove')) {
      // ... data-id={{id}}>Del</button>
      const id = event.target.dataset.id;
      // описать -> router.delete('/remove/:id'
      fetch(`/cart/remove/${id}`, {
        method: 'delete', // router.delete('/r..
      })
        .then(res => res.json())
        // ------------------------------------------------------
        .then(cart => {
          if (cart.courses.length) {
            const html = cart.courses
              .map(cours => {
                return `
                  <tr>
                    <td>${cours.title}</td>
                    <td>${cours.count}</td>
                    <td>
                      <button class="btn btn-small js-remove" data-id=${cours.id}>Del</button>
                    </td>
                  </tr>
                `;
              })
              .join(''); // склеиваю весь массив в строку
            $cart.querySelector('tbody').innerHTML = html;
            $cart.querySelector('.price').textContent = normalizeCurrency(
              cart.price,
            );
          } else {
            $cart.innerHTML = `<p>Cart is empty</p>`;
          }
        });
      // ------------------------------------------------------
    }
  });
}
```

---

## 34. Обработка асинхронных запросов

- Изменить `/views/cart.hbs` (довавление кнопки Del)
- Добавить обработку удаления из корзины в `/public/app.js`
- Добавить endpoint `/cart/remove/${id}`
- Описать метод `remove` в модели `/models/cart.js`

```hbs
<!-- /views/cart.hbs -->
<div id="cart">
  <h1>Cart</h1>
  ...
  <button class="js-remove" data-id={{id}}>Del</button>
  ...
</div>
```

```js
// /public/app.js
const $cart = document.querySelector('#cart');
if ($cart) {
  $cart.addEventListener('click', event => {
    // <button class="js-remove" ...
    if (event.target.classList.contains('js-remove')) {
      // ... data-id={{id}}>Del</button>
      const id = event.target.dataset.id;
      // описать -> router.delete('/remove/:id'
      fetch(`/cart/remove/${id}`, {
        method: 'delete', // router.delete('/r..
      })
        .then(res => res.json())
        .then(cart => {
          console.log(cart);
        });
    }
  });
}
```

```js
// /routes/cart.js
router.delete('/remove/:id', async (req, res) => {
  const cart = await Cart.remove(req.params.id);
  res.status(200).json(cart);
});
```

```js
// /models/cart.js
static async remove(id){
  const cart = await Cart.fetch()
  const idx = cart.courses.findIndex(current => current.id === id);
  const course = cart.courses[idx]

  if (course.count === 1){
    // del
    cart.courses = cart.courses.filter(curr => curr.id !== id)
  }else{
    cart.courses[idx].count -= 1
  }

  cart.price -= course.price

  return new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(__dirname, '..', 'data', 'cart.json'),
      JSON.stringify(cart),
      err => {
        if (err) {
          reject(err);
        } else {
          console.log('Cart was updated');
          resolve(cart) // --> /routes/cart.js
        }
      },
    );
  });
}
```

---

## 33. Вывод данных в корзине

- Создать `/views/cart.hbs`

```hbs
<h1>Cart</h1>
{{#if courses.length}}
      {{#each courses}}
        <p>{{title}}</p>
        <p>{{count}}</p>
        <!-- <button>Del</button> -->
      {{/each}}
<p>Price:<span>{{price}}</span></p>
{{else}}
  <p>Cart is empty</p>
{{/if}}
```

---

## 32. Модель корзины

- Создать место хранения `/data/cart.json`
- Создать модель корзины `/models/cart.js`
- Поправить `/routes/cart.js`

```js
// /models/cart.js
const fs = require('fs');
const path = require('path');

class Cart {
  static async add(course) {
    // <<<-----------------------------------------------------= add(course)
    const cart = await Cart.fetch();

    // Есть ли курс в корзине ?
    const idx = cart.courses.findIndex(current => current.id === course.id);
    const candidate = cart.courses[idx];

    if (candidate) {
      // курс уже есть
      candidate.count += 1;
      cart.courses[idx] = candidate;
    } else {
      // нужно добавить
      course.count = 1;
      cart.courses.push(course);
    }

    cart.price += Number.parseInt(course.price);

    return new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(__dirname, '..', 'data', 'cart.json'),
        JSON.stringify(cart),
        err => {
          if (err) {
            reject(err);
          } else {
            console.log('Course was added too cart');
            resolve();
          }
        },
      );
    });
  }

  static async fetch() {
    // <<<-----------------------------------------------------= fetch()
    return new Promise((resolve, reject) => {
      fs.readFile(
        path.join(__dirname, '..', 'data', 'cart.json'),
        'utf-8',
        (err, content) => {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(content));
          }
        },
      );
    });
  }
}
module.exports = Cart;
```

```js
// /routes/cart.js
router.get('/', async (req, res) => {
  const cart = await Cart.fetch();
  res.render('cart', {
    title: 'Cart',
    isCart: true, // <--- для навигации
    courses: cart.courses, // <---
    price: cart.price, // <---
  });
});
```

---

## 31. Подготовка корзины

- нужна кнопка корзины во `/views/courses.hbs`
- нужен роут (`/routes/cart.js` + подключить в `index.js`)
- нужна модель корзины
- добавить ссылку на корзину в `navbar.hbs`

```hbs
<!-- /views/courses.hbs -->
<h1>Courses</h1>
{{#if courses.length}}
  {{#each courses}}
  <!-- ... -->
    <form action="/cart/add" method="POST">
      <input type="hidden" name="id" value={{id}}>
      <button type="submit">Add to cart</button>
    </form>
  <!-- ... -->
  {{/each}}
{{else}}
  <h2>Курсов Нет</h2>
{{/if}}
```

```js
// /routes/cart.js
router.post('/add', async (req, res) => {
  const course = await Course.getById(req.body.id);
  await Cart.add(course);
  res.redirect('/cart');
});

router.get('/', async (req, res) => {
  const cart = await Cart.fetch();
  res.render('cart.hbs', {
    title: 'Cart',
    cart,
  });
});

module.exports = router;
```

---

## 30. Редактирование курса

```hbs
<!-- /views/courses.hbs -->
<h1>Courses</h1>
{{#if courses.length}}
  {{#each courses}}
  <!-- ... -->
    <a href="/courses/{{id}}/edit?allow=true">Edit</a> <!-- ?allow=true -->
  <!-- ... -->
  {{/each}}
{{else}}
  <h2>Курсов Нет</h2>
{{/if}}
```

```js
// /routes/courses.js
router.get('/:id/edit', async (req, res) => {
  if (!req.query.allow) {
    // <!-- ?allow=true если нету allow то просто перекинет на главную -->
    return res.redirect('/');
  }
  const course = await Course.getById(req.params.id); // <-- :id
  res.render('course-edit.hbs', { course });
});
```

```hbs
<!-- /views/course-edit.hbs -->
<h1>Edit Course {{course.title}}</h1>
<form action="/courses/edit" method="POST">
  <input name="id" type="hidden" value={{course.id}}>
  <input name="title" type="text" required value={{course.title}}>
  <input name="price" type="text" required value={{course.price}}>
  <input name="image" type="text" required value={{course.image}}>
  <button type="submit">Submit</button>
</form>
```

```js
// /routes/courses.js
router.post('/edit', async (req, res) => {
  // req.body содержит всё из формы /views/course-edit.hbs
  // в модели courses описать метод update
  await Course.update(req.body);
  res.redirect('/courses');
});
```

---

## 29. Динамические параметры

```js
// /routes/courses.js
router.get('/:id', async (req, res) => {
  // '/:id' --->> req.params.id
  const course = await Course.getById(req.params.id);
  res.render('course.hbs', {
    layout: 'empty.hbs', // по умолчанию используется main.hbs но тут меняю на empty.hbs
    title: `Course: ${course.title}`,
    course, // <-== это теперь доступно в course.hbs
  });
});
```

```hbs
<!-- /views/course.hbs -->
<div>
  <h1>{{course.title}}</h1>
  <img src={{course.image}} alt={{course.title}}>
  <p >{{course.price}}</p>
</div>
```

```hbs
<!-- /views/layouts/empty.hbs -->
<!DOCTYPE html>
<html lang="en">
  {{> head }}
  <body>
    {{{ body }}} <!-- сюда подгрузит course.hbs -->
    {{> footer }}
  </body>
</html>
```

А стили можно прописать в статическом файле `/public/index.css`

---

## 28. Подключение клиентских скриптов

Положить файл со скриптами в /public и подключить его во
/views/partials/footer.hbs

```hbs
<script src="/app.js"></script>
```

```js
// Локализация цены
const normalizeCurrency = price => {
  return new Intl.NumberFormat('en-En', {
    currency: 'usd',
    style: 'currency',
  }).format(price);
};

document.querySelectorAll('.price').forEach(node => {
  node.textContent = normalizeCurrency(node.textContent);
});
```

## 27. Вывод списка курсов

```js
// /routes/courses.js
const Course = require('../models/course');

router.get('/', async (req, res) => {
  const courses = await Course.getAll();
  res.status(200);
  res.render('courses.hbs', {
    title: 'Courses',
    isCourses: true,
    courses, // <-== это теперь доступно в courses.hbs
  });
});
```

```hbs
<!--/views/courses.hbs-->
<h1>Courses</h1>
{{#if courses.length}}
  {{#each courses}}
    <img src={{image}}>
    <span >{{title}}</span>
    <p >{{price}}</p>
    <a href="/courses/{{id}}" target="_blank">Open course</a>
    <form action="/cart/add" method="POST">
      <input type="hidden" name="id" value={{id}}>
      <button type="submit" >Add to cart</button>
    </form>
  {{/each}}
{{else}}
  <h2>Курсов Нет</h2>
{{/if}}
```

---

## 26. Создание модели

```js
// /models/course.js
class Course {
  constructor(title, price, image) {
    this.title = title;
    this.price = price;
    this.image = image;
    this.id = uuidv4();
  }
  async save() { ... }
  toJSON() { ... }
  static getAll() { ... }
}
module.exports = Course;
```

```js
// /routes/add.js
const Course = require('../models/course');

router.post('/', async (req, res) => {
  const { title, price, image } = req.body;
  // В req.body объект { title: 'Course', price: '100500', image: 'IMAGE' }
  // Пришло из инпутов по полям name
  const course = new Course(title, price, image);
  await course.save();
  res.redirect('/courses');
});
```

---

## 25. Обработка формы

```hbs
<!-- /views/add.hbs -->
<!-- отправка POST запроса -->
<h1>Add Course</h1>
<form action="/add" method="POST" >
  <input name="title" id="title" type="text" class="validate" required>
  <input name="price" id="price" type="text" class="validate" required>
  <input name="image" id="img" type="text" class="validate" required>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

```js
// /routes/add.js
// Обработка POST запроса
router.post('/', async (req, res) => {
  const { title, price, image } = req.body;
  // В req.body объект { title: 'Course', price: '100500', image: 'IMAGE' }
  // Пришло из инпутов по полям NAME
  console.log(title, price, image);
  res.redirect('/courses'); // просто редирект на страницу courses
});

module.exports = router;
```

```js
//index.js
const addRoutes = require('./routes/add');
app.use(express.urlencoded({ extended: true }));
app.use('/add', addRoutes);
```

---

## 24. Регистрация роутов

```js
// /routes/home.js
const { Router } = require('express');

router.get('/', (request, response) => {
  response.status(200);
  response.render('index.hbs', {
    title: 'Main page',
    isHome: true,
  });
});

const router = Router();
module.exports = router;
```

```js
//index.js
const homeRoutes = require('./routes/home');
app.use('/', homeRoutes); // первый параметр '/' - префикс
```

## 23. Рендеринг данных

```js
//index.js
app.use('/courses', (req, res) => {
  res.render('courses.hbs', {
    title: 'Courses', // подставится в .hbs на место {{{title}}}
    isCourses: true, // для выделения активной ссылки в nav
  });
});
```

```handlebars
  {{#if isCourses}}
    <li class="active" ><a href="/courses">Courses</a></li>
  {{else}}
    <li><a href="/courses">Courses</a></li>
  {{/if}}
```

---

## 22. Добавление навигации

```js
...
app.set('views', 'views');

// папка для статических пользовательских файлов (картинки, стили)
app.use(express.static(path.join(__dirname, 'public'))); // <<< --- ==========

app.get('/', (req, res) => {
  res.render('index.hbs');
});
...
```

---

## 21. Настройка Layout

```handlebars
<!-- /views/layouts/partials/head.hbs -->
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="/index.css">
  <title>{{title}}</title>
</head>
```

```handlebars
<!-- /views/layouts/main.hbs -->
<!DOCTYPE html>
<html lang="en">
  {{> head }}
  <body>
      {{> navbar }}
      <div class="container">
      <!-- на место body в зависимости от app.get('/...' -->
          {{{ body }}}
      </div>
      {{> footer }}
  </body>
</html>
```

---

## 20. Подключение Handlebars

<a href="https://handlebarsjs.com/" alt="handlebarsjs">
<img height="100" src="https://res.cloudinary.com/xdpiqbx/image/upload/v1616321246/logos-imgs/hbs_kppfnk.png"></img>
</a>

<a href="https://ejs.co/" alt="ejs">
<img height="100" src="https://res.cloudinary.com/xdpiqbx/image/upload/v1616320870/logos-imgs/ejs_jw1rb4.png"></img>
</a>

<a href="https://pugjs.org/api/getting-started.html" alt="pugjs.org">
<img height="100" src="https://res.cloudinary.com/xdpiqbx/image/upload/v1616321008/logos-imgs/pugjs_kzp85h.png"></img>
</a>

---

## [Express Handlebars](https://www.npmjs.com/package/express-handlebars)

```code
npm i express-handlebars
```

```js
const express = require('express');
// const path = require('path');
const app = express();
const exphbs = require('express-handlebars');

const hbs = exphbs.create({
  defaultLayout: 'main', // дефолтный вывод
  extname: 'hbs', // регистрирую расширение файлов
});

//не забыть создать /views/layouts/main.hbs

app.engine('hbs', hbs.engine); // тут зарегистрировал что вообще есть такой движок
app.set('view engine', 'hbs'); // тут прямо указываю какой движ использую 'hbs' из app.engine
app.set('views', 'views'); // Тут указываю название папки где лежат шаблоны ('views' это по умолчанию)

//теперь можно переименовать все файлы из .html в .hbs и в папку views

app.get('/', (req, res) => {
  res.render('index.hbs');
});

app.get('/about', (req, res) => {
  res.render('about.hbs');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is runing on port ${PORT}`);
});
```

---

## 19. Работа с HTML-файлами

> Тут работаю со статическими файлами **_index.html_** и **_about.html_**

```js
const express = require('express');
const path = require('path');
const app = express();

app.get('/', (req, res) => {
  res.status(200);
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
  //для этого в корне должен быть views/index.html
});

app.get('/about', (req, res) => {
  res.status(200);
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
  //для этого в корне должен быть views/about.html
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is runing on port ${PORT}`);
});
```

---

## 18. Настройка приложения

```code
  npm init -y
  npm install express -E
  npm i nodemon -E
```

|                                                                |                                                                                                                                  |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------: |
| [Expressjs](https://expressjs.com/en/starter/hello-world.html) |                                                    <img height="100" src="https://i.cloudup.com/zfY6lL7eFa-3000x3000.png"></img> |
| [Nodemon](https://www.npmjs.com/package/nodemon)               | <img height="100" src="https://user-images.githubusercontent.com/13700/35731649-652807e8-080e-11e8-88fd-1b2f6d553b2d.png"></img> |

---

### Так просто стартануть сервер

```js
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is runing on port ${PORT}`);
});
```
