const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const csrf = require('csurf')
const flash = require('connect-flash')
const multer = require('multer')

const errorController = require('./controllers/error')
const User = require('./models/user')

const MONGODB_URI =
  'mongodb+srv://jitesh:9158740900@cluster0.wied1.mongodb.net/shop'

const app = express()
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
})
const csrfProtection = csrf()

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop')
const authRoutes = require('./routes/auth')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
)
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(
  session({
    secret: 'my ultrasupersecret',
    resave: false,      //session would not be saved on every req where nothing changed
    saveUninitialized: false, //both these to improve performance (rest same as above)
    store: store
  })
)
app.use(csrfProtection)
app.use(flash())

//this is being rendered in every view, thus no need to set in every rendered view
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn //check compare pswrd in auth controller
  res.locals.csrfToken = req.csrfToken()
  next()
})

//this checks if no session then not authenticated and cannot access routes meant for authenticated users
app.use((req, res, next) => {
  if (!req.session.user) {
    return next()
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next()
      }
      req.user = user
      next()
    })
    .catch(err => {
      next(new Error(err))
    })
})

app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.get('/500', errorController.get500)

app.use(errorController.get404)

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...)
  // res.redirect('/500')
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  })
})

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(3000)
  })
  .catch(err => {
    console.log(err)
  })
